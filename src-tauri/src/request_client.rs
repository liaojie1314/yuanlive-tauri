use anyhow::Ok;
use base64::{prelude::BASE64_STANDARD, Engine};
use chrono::Utc;
use reqwest::header;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::str::FromStr;
use tauri::http;
use tracing::{error, info};

#[derive(Debug)]
pub struct RequestClient {
    client: reqwest::Client,
    base_url: String,
    pub token: Option<String>,
    pub refresh_token: Option<String>,
    pub expire: Option<i64>, // access_token过期时间(时间戳)
}

impl RequestClient {
    pub fn new(base_url: String) -> Result<Self, anyhow::Error> {
        let mut headers = header::HeaderMap::new();

        // Read basic auth credentials from environment variables
        let credentials = format!(
            "{}:{}",
            std::env::var("BASIC_AUTH").unwrap_or("".to_string()),
            std::env::var("BASIC_AUTH_PWD").unwrap_or("".to_string())
        );
        let mut basic_auth = BASE64_STANDARD.encode(credentials);
        basic_auth.insert_str(0, "Basic ");
        let basic_auth_value = header::HeaderValue::from_str(&basic_auth)
            .map_err(|e| anyhow::anyhow!("Failed to create HTTP client: {}", e))?;
        headers.insert(header::AUTHORIZATION, basic_auth_value);

        let client = reqwest::Client::builder()
            .default_headers(headers)
            .build()
            .map_err(|e| anyhow::anyhow!("Failed to create HTTP client: {}", e))?;

        Ok(Self {
            client,
            base_url,
            token: None,
            refresh_token: None,
            expire: None,
        })
    }

    pub fn set_base_url(&mut self, base_url: String) {
        self.base_url = base_url;
    }

    /// 检查token是否过期
    pub fn check_token_expired(&self) -> bool {
        match self.expire {
            Some(expire) => {
                // 获取当前时间戳
                let now = Utc::now().timestamp();
                // 如果当前时间大于过期时间，则token过期
                info!("now: {},Token expired: {}", now, expire);
                now > expire
            }
            None => {
                // 如果没有过期时间，默认为未过期
                false
            }
        }
    }

    /// 构建请求的基础方法（处理公共逻辑）
    ///
    /// 处理 URL 构建、日志记录、token 设置和额外请求头等公共逻辑
    ///
    /// # 参数
    /// - `method`: HTTP 方法
    /// - `path`: API 路径
    /// - `extra_headers`: 额外的请求头（可选）
    fn build_request_base(
        &self,
        method: http::Method,
        path: &str,
        extra_headers: Option<Vec<(&str, &str)>>,
    ) -> reqwest::RequestBuilder {
        let url = format!("{}/{}", self.base_url, path);
        info!("📡 Request URL: {}, Method: {}", &url, method);
        let mut request_builder = self.client.request(method, &url);
        // 设置 token 请求头
        if let Some(token) = &self.token {
            request_builder = request_builder.header("token", format!("Bearer {}", token));
        }
        // 添加额外的请求头
        if let Some(headers) = extra_headers {
            for (key, value) in headers {
                request_builder = request_builder.header(key, value);
            }
        }
        request_builder
    }

    /// 构建请求的公共方法（不发送请求）
    ///
    /// 提取了 URL 构建、token 添加、body/params 处理等公共逻辑
    ///
    /// # 参数
    /// - `method`: HTTP 方法
    /// - `path`: API 路径
    /// - `body`: 请求体（可选）
    /// - `params`: 查询参数（可选）
    /// - `extra_headers`: 额外的请求头（可选）
    fn build_request<B: serde::Serialize, C: serde::Serialize>(
        &self,
        method: http::Method,
        path: &str,
        body: &Option<B>,
        params: &Option<C>,
        extra_headers: Option<Vec<(&str, &str)>>,
    ) -> reqwest::RequestBuilder {
        let mut request_builder = self.build_request_base(method, path, extra_headers);

        // 设置请求体和 Content-Type
        if let Some(body) = body {
            request_builder = request_builder.json(body);
            // 显式设置 Content-Type 为 application/json
            request_builder = request_builder.header(header::CONTENT_TYPE, "application/json");
        }

        // 设置查询参数
        if let Some(params) = params {
            request_builder = request_builder.query(params);
        }

        request_builder
    }

    /// 直接从本地文件读取并上传，避免从 JS 传二进制数据
    /// 适用于大文件/视频上传场景
    pub async fn upload_chunk_from_path(
        &mut self,
        file_hash: &str,
        file_name: &str,
        chunk_index: u32,
        total_chunks: u32,
        scene: &str,
        file_path: &str,
        start: u64,
        size: u64,
    ) -> Result<ApiResult<serde_json::Value>, anyhow::Error> {
        // 在 Rust 中读取文件，零拷贝（相对于 JS Bridge）
        let mut file = File::open(file_path).map_err(|e| anyhow::anyhow!("无法打开文件: {}", e))?;

        // 移动文件指针到分片起始位置
        file.seek(SeekFrom::Start(start))
            .map_err(|e| anyhow::anyhow!("文件Seek失败: {}", e))?;

        // 读取指定大小的数据
        let mut buffer = vec![0u8; size as usize];
        let bytes_read = file
            .read(&mut buffer)
            .map_err(|e| anyhow::anyhow!("读取文件失败: {}", e))?;

        // 如果实际读取字节数小于预期（通常是最后一片），截断 buffer
        if bytes_read < size as usize {
            buffer.truncate(bytes_read);
        }

        // 调用通用的上传逻辑
        self.upload_chunk_internal(
            file_hash,
            file_name,
            chunk_index,
            total_chunks,
            scene,
            buffer,
        )
        .await
    }

    /// 适用于内存数据上传（如头像裁剪后的 Blob）
    /// 接收 Vec<u8>
    pub async fn upload_chunk_bytes(
        &mut self,
        file_hash: &str,
        file_name: &str,
        chunk_index: u32,
        total_chunks: u32,
        scene: &str,
        chunk_data: Vec<u8>,
    ) -> Result<ApiResult<serde_json::Value>, anyhow::Error> {
        self.upload_chunk_internal(
            file_hash,
            file_name,
            chunk_index,
            total_chunks,
            scene,
            chunk_data,
        )
        .await
    }

    /// 内部私有方法：执行实际的 HTTP 请求
    async fn upload_chunk_internal(
        &mut self,
        file_hash: &str,
        file_name: &str,
        chunk_index: u32,
        total_chunks: u32,
        scene: &str,
        chunk_data: Vec<u8>,
    ) -> Result<ApiResult<serde_json::Value>, anyhow::Error> {
        let (method, path) = Url::UploadChunk.get_url();
        // 使用 build_request_base 处理公共请求头逻辑
        let request_builder = self.build_request_base(method, path, None);
        // 创建表单数据
        let mut form = reqwest::multipart::Form::new();
        form = form.text("fileHash", file_hash.to_string());
        form = form.text("fileName", file_name.to_string());
        form = form.text("chunkIndex", chunk_index.to_string());
        form = form.text("totalChunks", total_chunks.to_string());
        form = form.text("scene", scene.to_string());
        // chunk_data move 进 multipart，无需 clone
        form = form.part(
            "file",
            reqwest::multipart::Part::bytes(chunk_data)
                .file_name(format!("{}.chunk{}", file_name, chunk_index)),
        );
        // 发送请求
        let response = request_builder.multipart(form).send().await?;
        let result: ApiResult<serde_json::Value> = response.json().await?;
        Ok(result)
    }

    /// 检查已上传的分片
    pub async fn check_uploaded_chunks(
        &mut self,
        file_hash: &str,
        file_name: &str,
        scene: &str,
    ) -> Result<ApiResult<serde_json::Value>, anyhow::Error> {
        let (method, path) = Url::CheckUploadedChunks.get_url();
        let params = Some(
            serde_json::json!({ "fileHash": file_hash, "fileName": file_name, "scene": scene }),
        );

        self.base_request(method, path, None::<serde_json::Value>, params)
            .await
    }

    /// 合并分片
    pub async fn merge_chunks(
        &mut self,
        file_hash: &str,
        file_name: &str,
        total_chunks: u32,
        scene: &str,
    ) -> Result<ApiResult<serde_json::Value>, anyhow::Error> {
        let (method, path) = Url::MergeChunks.get_url();
        let body = Some(serde_json::json!({
            "fileHash": file_hash,
            "fileName": file_name,
            "totalChunks": total_chunks,
            "scene": scene
        }));

        self.base_request(method, path, body, None::<serde_json::Value>)
            .await
    }

    pub async fn base_request<
        T: serde::de::DeserializeOwned,
        B: serde::Serialize,
        C: serde::Serialize,
    >(
        &mut self,
        method: http::Method,
        path: &str,
        body: Option<B>,
        params: Option<C>,
    ) -> Result<ApiResult<T>, anyhow::Error> {
        let mut retry_count = 0;
        const MAX_RETRY_COUNT: u8 = 2;

        loop {
            // 检查token是否过期，如果过期则自动刷新
            if self.check_token_expired() {
                info!("🔄 Token expired, automatically refreshing");
                self.start_refresh_token().await?;
            }

            // 使用 build_request 构建请求
            let request_builder = self.build_request(method.clone(), path, &body, &params, None);

            // 发送请求
            let response = request_builder.send().await?;
            let result: ApiResult<T> = response.json().await?;

            let url = format!("{}/{}", self.base_url, path);

            match result.code {
                Some(406) => {
                    if retry_count >= MAX_RETRY_COUNT {
                        return Err(anyhow::anyhow!("token过期，刷新token失败"));
                    }

                    error!("🔄 Token expired, starting token refresh");
                    self.start_refresh_token().await?;
                    retry_count += 1;
                    continue;
                }
                Some(401) => {
                    error!(
                        "❌ {}; 方法: {}; 失败信息: {}",
                        &url,
                        method,
                        result.msg.clone().unwrap_or_default()
                    );
                    return Err(anyhow::anyhow!("请重新登录"));
                }
                Some(200) => {
                    info!(
                        "✅ Request successful: {}, Method: {}",
                        &url,
                        method.clone()
                    );
                    return Ok(result);
                }
                _ => {
                    error!(
                        "❌ {}; 方法: {}; 失败信息: {}",
                        &url,
                        method,
                        result.msg.clone().unwrap_or_default()
                    );
                    return Err(anyhow::anyhow!(
                        "{}",
                        result.msg.clone().unwrap_or_default()
                    ));
                }
            }
        }
    }

    /// 流式请求方法（用于 SSE 等流式响应）
    ///
    /// 与 `request` 方法的区别：
    /// 1. 添加 `Accept: text/event-stream` 请求头
    /// 2. 返回 `reqwest::Response` 而不是解析 JSON
    /// 3. 不支持自动 token 刷新重试（因为流式响应无法中断重试）
    ///
    /// # 参数
    /// - `method`: HTTP 方法
    /// - `path`: API 路径
    /// - `body`: 请求体（可选）
    /// - `params`: 查询参数（可选）
    ///
    /// # 返回
    /// - `Ok(Response)`: 成功返回响应对象，可用于读取流式数据
    /// - `Err`: 请求失败或状态码非 2xx
    pub async fn request_stream<B: serde::Serialize, C: serde::Serialize>(
        &mut self,
        method: http::Method,
        path: &str,
        body: Option<B>,
        params: Option<C>,
    ) -> Result<reqwest::Response, anyhow::Error> {
        // 添加流式请求头
        let extra_headers = Some(vec![("Accept", "text/event-stream")]);

        // 使用 build_request 构建请求
        let request_builder =
            self.build_request(method.clone(), path, &body, &params, extra_headers);

        // 发送请求
        let response = request_builder.send().await?;

        // 检查响应状态（但不解析 JSON）
        let status = response.status();
        if !status.is_success() {
            let url = format!("{}/{}", self.base_url, path);
            error!("❌ 流式请求失败，URL: {}, 状态码: {}", url, status);

            // 根据状态码返回不同的错误信息
            return match status.as_u16() {
                406 => {
                    error!("🔄 Token expired in stream request");
                    Err(anyhow::anyhow!("token过期，请刷新后重试"))
                }
                401 => {
                    error!("🔐 Unauthorized in stream request");
                    Err(anyhow::anyhow!("请重新登录"))
                }
                _ => Err(anyhow::anyhow!("请求失败，状态码: {}", status)),
            };
        }

        info!("✅ 流式请求成功，开始接收流式数据");
        Ok(response)
    }

    pub async fn start_refresh_token(&mut self) -> Result<(), anyhow::Error> {
        info!("🔄 Starting token refresh");
        let url = format!("{}/{}", self.base_url, Url::RefreshToken.get_url().1);

        let body = json!({
          "refreshToken": self.refresh_token.clone().unwrap()
        });

        let request_builder = self.client.request(http::Method::POST, &url);
        let response = request_builder.json(&body).send().await?;
        let result: ApiResult<serde_json::Value> = response.json().await?;

        if !result.success {
            error!(
                "❌ 刷新token失败: {}",
                result.msg.clone().unwrap_or_default()
            );
            return Err(anyhow::anyhow!(
                "刷新token失败: {}",
                result.msg.clone().unwrap_or_default()
            ));
        }

        if let Some(token) = result.data.clone().unwrap().get("token").unwrap().as_str() {
            self.token = Some(token.to_owned());
        }

        if let Some(refresh_token) = result
            .data
            .clone()
            .unwrap()
            .get("refreshToken")
            .unwrap()
            .as_str()
        {
            self.refresh_token = Some(refresh_token.to_owned());
        }

        // 更新token过期时间
        if let Some(expire) = result.data.clone().unwrap().get("expire").unwrap().as_i64() {
            self.expire = Some(expire);
        }

        Ok(())
    }

    pub async fn request<
        T: serde::de::DeserializeOwned,
        B: serde::Serialize,
        C: serde::Serialize,
    >(
        &mut self,
        url: Url,
        body: Option<B>,
        params: Option<C>,
    ) -> Result<Option<T>, anyhow::Error> {
        let (method, path) = url.get_url();
        let result: ApiResult<T> = self.base_request(method, path, body, params).await?;
        Ok(result.data)
    }
}

impl Request for RequestClient {
    async fn login(&mut self, login_req: LoginReq) -> Result<Option<AuthResp>, anyhow::Error> {
        let result: Option<AuthResp> = self
            .request(Url::Login, Some(login_req), None::<serde_json::Value>)
            .await?;

        if let Some(data) = result.clone() {
            self.token = Some(data.access_token.clone());
            self.refresh_token = Some(data.refresh_token.clone());
            self.expire = Some(data.expire);
        }

        Ok(result)
    }

    async fn refresh_token(
        &mut self,
        refresh_token_req: RefreshTokenReq,
    ) -> Result<Option<AuthResp>, anyhow::Error> {
        let result: Option<AuthResp> = self
            .request(
                Url::RefreshToken,
                Some(refresh_token_req),
                None::<serde_json::Value>,
            )
            .await?;

        if let Some(data) = result.clone() {
            self.token = Some(data.access_token.clone());
            self.refresh_token = Some(data.refresh_token.clone());
            self.expire = Some(data.expire);
        }

        Ok(result)
    }
}

pub enum Url {
    Register,
    Login,
    RefreshToken,
    Logout,
    ForgetPassword,
    GetCode,
    GenerateQRCode,
    CheckQRStatus,
    GetUserInfoDetail,
    MessageSendStream,
    // 地图相关
    MapCoordTranslate,
    MapReverseGeocode,
    MapStatic,
    // 文件上传相关
    UploadChunk,
    CheckUploadedChunks,
    MergeChunks,
}

impl Url {
    pub fn get_url(&self) -> (http::Method, &str) {
        match self {
            Url::Register => (http::Method::POST, "user/auth/register"),
            Url::Login => (http::Method::POST, "user/auth/login"),
            Url::RefreshToken => (http::Method::POST, "user/user/refreshToken"),
            Url::Logout => (http::Method::POST, "user/auth/logout"),
            Url::ForgetPassword => (http::Method::POST, "user/auth/forgetPassword"),
            Url::GetCode => (http::Method::POST, "user/auth/getCode"),
            // 扫码登录相关
            Url::GenerateQRCode => (http::Method::GET, "user/auth/qrcode/init"),
            Url::CheckQRStatus => (http::Method::GET, "user/auth/qrcode/check"),
            // 用户信息相关
            Url::GetUserInfoDetail => (http::Method::GET, "user/info"),
            // AI 相关
            Url::MessageSendStream => (http::Method::POST, "ai/chat/stream"),
            // 地图相关
            Url::MapCoordTranslate => (http::Method::GET, "map/coord/translate"),
            Url::MapReverseGeocode => (http::Method::GET, "map/geocode/reverse"),
            Url::MapStatic => (http::Method::GET, "map/static"),
            // 文件上传相关
            Url::UploadChunk => (http::Method::POST, "api/upload/chunk"),
            Url::CheckUploadedChunks => (http::Method::GET, "api/upload/check"),
            Url::MergeChunks => (http::Method::POST, "api/upload/merge"),
        }
    }

    fn from_str(s: &str) -> Result<Self, anyhow::Error> {
        match s {
            "register" => Ok(Url::Register),
            "login" => Ok(Url::Login),
            "refreshToken" => Ok(Url::RefreshToken),
            "logout" => Ok(Url::Logout),
            "forgetPassword" => Ok(Url::ForgetPassword),
            "getCode" => Ok(Url::GetCode),
            // 扫码登录相关
            "generateQRCode" => Ok(Url::GenerateQRCode),
            "checkQRStatus" => Ok(Url::CheckQRStatus),
            // 用户信息相关
            "getUserInfoDetail" => Ok(Url::GetUserInfoDetail),
            // AI 相关
            "messageSendStream" => Ok(Url::MessageSendStream),
            // 地图相关
            "mapCoordTranslate" => Ok(Url::MapCoordTranslate),
            "mapReverseGeocode" => Ok(Url::MapReverseGeocode),
            "mapStatic" => Ok(Url::MapStatic),
            // 文件上传相关
            "uploadChunk" => Ok(Url::UploadChunk),
            "checkUploadedChunks" => Ok(Url::CheckUploadedChunks),
            "mergeChunks" => Ok(Url::MergeChunks),
            // 未匹配的字符串
            _ => Err(anyhow::anyhow!("未知的URL类型: {}", s)),
        }
    }
}

impl FromStr for Url {
    type Err = anyhow::Error;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Self::from_str(s)
    }
}

#[derive(Deserialize, Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApiResult<T> {
    pub code: Option<i32>,
    pub success: bool,
    pub msg: Option<String>,
    pub data: Option<T>,
    pub version: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LoginReq {
    pub account: String,
    pub password: String,
    pub device: String,
    #[serde(rename = "deviceID")]
    pub device_id: String, // 客户端指纹信息
    #[serde(default)]
    pub is_auto_login: bool,
    pub uid: Option<String>, // 用于自动登录时传递用户ID
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AuthResp {
    pub uid: String,
    pub access_token: String,
    pub refresh_token: String,
    pub expire: i64, // 过期时间(时间戳)
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RefreshTokenReq {
    pub refresh_token: String,
}

pub trait Request {
    async fn login(&mut self, login_req: LoginReq) -> Result<Option<AuthResp>, anyhow::Error>;
    async fn refresh_token(
        &mut self,
        refresh_token_req: RefreshTokenReq,
    ) -> Result<Option<AuthResp>, anyhow::Error>;
}

// 测试
#[cfg(test)]
mod test {
    use serde_json::json;

    use crate::request_client::{AuthResp, LoginReq, Url};
    use crate::request_client::{Request, RequestClient};

    #[tokio::test]
    async fn test_login() -> Result<(), anyhow::Error> {
        let mut request_client = RequestClient::new("http://127.0.0.1:8080".to_string())?;
        let login_req = json!({
            "account": "yuanyuan",
            "password": "123456",
            "device": "desktop",
            "deviceID": "testClientId",
        });
        let login_req: LoginReq = serde_json::from_value(login_req)?;
        let result: Option<AuthResp> = request_client.login(login_req).await?;
        println!("{:?}", json!(result).to_string());
        Ok(())
    }

    #[tokio::test]
    async fn test_get_code() -> Result<(), anyhow::Error> {
        let mut request_client = RequestClient::new("http://127.0.0.1:8080".to_string())?;
        let req = json!({
            "email": "112233@gmail.com",
            "operationType": "REGISTER"
        });
        let result: Option<String> = request_client
            .request(Url::GetCode, Some(req), None::<serde_json::Value>)
            .await?;
        println!("{:?}", json!(result).to_string());
        Ok(())
    }
}
