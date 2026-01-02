use std::str::FromStr;

use anyhow::Ok;
use base64::{prelude::BASE64_STANDARD, Engine};
use reqwest::header;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::http;
use tracing::{error, info};

#[derive(Debug)]
pub struct RequestClient {
    client: reqwest::Client,
    base_url: String,
    pub token: Option<String>,
    pub refresh_token: Option<String>,
}

impl RequestClient {
    pub fn new(base_url: String) -> Result<Self, anyhow::Error> {
        let mut headers = header::HeaderMap::new();
        headers.insert(
            header::CONTENT_TYPE,
            header::HeaderValue::from_static("application/json"),
        );

        // Read basic auth credentials from environment variables
        let credentials = format!(
            "Basic {}:{}",
            std::env::var("BASIC_AUTH").unwrap_or("".to_string()),
            std::env::var("BASIC_AUTH_PWD").unwrap_or("".to_string())
        );
        // Check if basic auth credentials are empty
        if credentials.eq(":") {
            error!("Basic auth credentials are empty. Please set BASIC_AUTH and BASIC_AUTH_PWD on .env file.");
            return Err(anyhow::anyhow!("Basic auth credentials are empty"));
        }
        let basic_auth = BASE64_STANDARD.encode(credentials);
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
        })
    }

    pub fn set_base_url(&mut self, base_url: String) {
        self.base_url = base_url;
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

        // 设置请求体
        if let Some(body) = body {
            request_builder = request_builder.json(body);
        } else {
            request_builder = request_builder.json(&json!({}));
        }

        // 设置查询参数
        if let Some(params) = params {
            request_builder = request_builder.query(params);
        }

        request_builder
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
    pub client_id: String, // 客户端指纹信息
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
            "clientId": "testClientId",
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
