use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use reqwest::header::{HeaderMap, HeaderName, HeaderValue};
use tokio::io::{AsyncWriteExt, BufWriter};
use futures_util::StreamExt;

pub struct UrlDownloadConfig {
    pub url: String,
    pub destination_path: String,
    pub auth_token: Option<String>,
    pub basic_auth: Option<(String, String)>,
    pub custom_headers: Option<Vec<(String, String)>>,
}

pub struct UrlDownloader;

impl UrlDownloader {
    pub async fn download_to_file<F>(
        config: UrlDownloadConfig,
        cancel_flag: Arc<AtomicBool>,
        mut on_progress: F,
    ) -> Result<(u64, Option<String>), String>
    where
        F: FnMut(u64, Option<u64>, f64) + Send + 'static,
    {
        let client = reqwest::Client::builder()
            .tcp_nodelay(true)
            .redirect(reqwest::redirect::Policy::limited(10))
            .connect_timeout(Duration::from_secs(30))
            .timeout(Duration::from_secs(3600)) // Large feed support up to 1 hr
            .build()
            .map_err(|e| format!("Network client error: {}", e))?;

        let mut req = client.get(&config.url);

        if let Some(token) = config.auth_token {
            req = req.bearer_auth(token);
        } else if let Some((user, pass)) = config.basic_auth {
            req = req.basic_auth(user, Some(pass));
        }

        if let Some(headers) = config.custom_headers {
            let mut header_map = HeaderMap::new();
            for (k, v) in headers {
                if let (Ok(hk), Ok(hv)) = (HeaderName::from_bytes(k.as_bytes()), HeaderValue::from_str(&v)) {
                    header_map.insert(hk, hv);
                }
            }
            req = req.headers(header_map);
        }

        let resp = req.send().await.map_err(|e| format!("HTTP request failed: {}", e))?;
        if !resp.status().is_success() {
            return Err(format!("Server returned HTTP status: {}", resp.status()));
        }

        // Try extracting filename from Content-Disposition if present
        let suggested_filename = resp.headers()
            .get(reqwest::header::CONTENT_DISPOSITION)
            .and_then(|v| v.to_str().ok())
            .and_then(|cd| {
                for part in cd.split(';') {
                    let trimmed = part.trim();
                    if trimmed.to_lowercase().starts_with("filename=") {
                        let name = trimmed["filename=".len()..].trim_matches('"').trim();
                        if !name.is_empty() {
                            return Some(name.to_string());
                        }
                    }
                }
                None
            });

        let total_size = resp.content_length();
        let dest = Path::new(&config.destination_path);
        if let Some(parent) = dest.parent() {
            let _ = tokio::fs::create_dir_all(parent).await;
        }

        let file = tokio::fs::File::create(dest)
            .await
            .map_err(|e| format!("Failed to create destination file: {}", e))?;
        let mut writer = BufWriter::with_capacity(512 * 1024, file);

        let mut downloaded: u64 = 0;
        let mut stream = resp.bytes_stream();
        let start_time = Instant::now();
        let mut last_progress_time = Instant::now();
        let mut bytes_since_last_progress: u64 = 0;
        let mut current_speed_mbps: f64 = 0.0;

        while let Some(chunk_res) = stream.next().await {
            if cancel_flag.load(Ordering::Relaxed) {
                drop(writer);
                let _ = tokio::fs::remove_file(dest).await;
                return Err("Download cancelled by user.".to_string());
            }

            let chunk = chunk_res.map_err(|e| format!("Download stream error: {}", e))?;
            writer.write_all(&chunk)
                .await
                .map_err(|e| format!("Write to disk failed: {}", e))?;

            let chunk_len = chunk.len() as u64;
            downloaded += chunk_len;
            bytes_since_last_progress += chunk_len;

            let now = Instant::now();
            let elapsed_since_last = now.duration_since(last_progress_time);
            if elapsed_since_last >= Duration::from_millis(100) {
                let seconds = elapsed_since_last.as_secs_f64();
                if seconds > 0.0 {
                    current_speed_mbps = (bytes_since_last_progress as f64 / (1024.0 * 1024.0)) / seconds;
                }
                on_progress(downloaded, total_size, current_speed_mbps);
                last_progress_time = now;
                bytes_since_last_progress = 0;
            }
        }

        writer.flush().await.map_err(|e| e.to_string())?;

        // Final progress report
        let total_elapsed = start_time.elapsed().as_secs_f64();
        let avg_speed = if total_elapsed > 0.0 {
            (downloaded as f64 / (1024.0 * 1024.0)) / total_elapsed
        } else {
            0.0
        };
        on_progress(downloaded, total_size, avg_speed);

        Ok((downloaded, suggested_filename))
    }
}
