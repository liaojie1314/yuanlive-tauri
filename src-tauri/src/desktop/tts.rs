use std::process::Command;
use tracing::info;

/// 接收前端的文本，调用系统语音
#[tauri::command]
pub fn speak_system(text: String, lang: Option<String>) -> Result<(), String> {
    let lang_code = lang.unwrap_or_else(|| "zh".to_string());
    info!("系统TTS播放: [{}] text: {}", lang_code, text);

    #[cfg(target_os = "linux")]
    {
        // Linux: spd-say
        let mut cmd = Command::new("spd-say");
        if lang_code == "zh" {
            cmd.arg("-l").arg("zh");
        } else {
            cmd.arg("-l").arg("en");
            cmd.arg("-t").arg("female1");
        }
        // 使用 spawn，不等待子进程结束，直接返回
        let _ = cmd.arg(&text).spawn();
    }

    #[cfg(target_os = "macos")]
    {
        // macOS: say
        let mut cmd = Command::new("say");
        if lang_code == "zh" {
            cmd.arg("-v").arg("Ting-Ting");
        } else {
            cmd.arg("-v").arg("Samantha");
        }
        let _ = cmd.arg(&text).spawn();
    }

    #[cfg(target_os = "windows")]
    {
        // Windows: PowerShell
        // 在window.speechSynthesis出问题时兜底
        // Windows 的 spawn 可能会闪黑框，如果介意可以使用 creation_flags 隐藏
        let culture = if lang_code == "zh" { "zh-CN" } else { "en-US" };
        let ps_script = format!(
      "Add-Type -AssemblyName System.Speech; \
            $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; \
            $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female, [System.Speech.Synthesis.VoiceAge]::Adult, 0, [System.Globalization.CultureInfo]::GetCultureInfo('{}')); \
            $synth.Speak('{}');",
      culture,
      text.replace("'", "''")
    );

        let _ = Command::new("powershell")
            .arg("-NoProfile")
            .arg("-Command")
            .arg(&ps_script)
            .spawn();
    }

    Ok(())
}
