use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::Emitter;

use crate::types::{
    FileMetadata, TransformExecutionResponse, TransformPayload, ZipEntry, DownloadProgress
};
use crate::core::java_bridge::JavaBridge;
use crate::core::archive_manager::ArchiveManager;
use crate::core::feed_splitter::FeedSplitter;
use crate::core::url_downloader::{UrlDownloader, UrlDownloadConfig};
use rfd::FileDialog;

#[tauri::command]
pub async fn open_file_dialog() -> Result<Option<String>, String> {
    let file = FileDialog::new()
        .add_filter("All Supported Feeds", &["xml", "json", "gz", "zip"])
        .add_filter("XML Feeds", &["xml", "xml.gz"])
        .add_filter("JSON Feeds", &["json", "json.gz"])
        .add_filter("ZIP Archives", &["zip"])
        .add_filter("All Files", &["*"])
        .pick_file();

    Ok(file.map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
pub async fn save_file_dialog(default_name: String) -> Result<Option<String>, String> {
    let file = FileDialog::new()
        .set_file_name(&default_name)
        .save_file();

    Ok(file.map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
pub async fn inspect_file(path: String) -> Result<FileMetadata, String> {
    let file_path = Path::new(&path);
    if !file_path.exists() {
        return Err(format!("File does not exist: {}", path));
    }

    let metadata = std::fs::metadata(file_path).map_err(|e| e.to_string())?;
    let size_bytes = metadata.len();
    let name = file_path.file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| path.clone());

    let mut file = File::open(file_path).map_err(|e| e.to_string())?;
    let mut header = [0u8; 16];
    let bytes_read = file.read(&mut header).unwrap_or(0);

    // Detect Container
    let mut container = "none".to_string();
    let mut zip_entries: Option<Vec<ZipEntry>> = None;
    let mut uncompressed_size: Option<u64> = None;

    if bytes_read >= 2 && header[0] == 0x1f && header[1] == 0x8b {
        container = "gzip".to_string();
        if size_bytes >= 4 {
            let mut tail = [0u8; 4];
            if file.seek(SeekFrom::End(-4)).is_ok() && file.read_exact(&mut tail).is_ok() {
                let isize = u32::from_le_bytes(tail) as u64;
                if isize > 0 {
                    uncompressed_size = Some(isize);
                }
            }
        }
    } else if bytes_read >= 4 && header[0] == 0x50 && header[1] == 0x4b && header[2] == 0x03 && header[3] == 0x04 {
        container = "zip".to_string();
        if let Ok(mut archive) = zip::ZipArchive::new(File::open(file_path).map_err(|e| e.to_string())?) {
            let mut entries = Vec::new();
            for i in 0..archive.len() {
                if let Ok(file_entry) = archive.by_index(i) {
                    let entry_name = file_entry.name().to_string();
                    let fmt = if entry_name.ends_with(".xml") {
                        Some("xml".to_string())
                    } else if entry_name.ends_with(".json") {
                        Some("json".to_string())
                    } else {
                        None
                    };
                    entries.push(ZipEntry {
                        name: entry_name,
                        size_bytes: file_entry.size(),
                        compressed_size_bytes: file_entry.compressed_size(),
                        detected_format: fmt,
                    });
                }
            }
            zip_entries = Some(entries);
        }
    }

    // Detect content format (XML vs JSON)
    let lower_name = name.to_lowercase();
    let mut detected_format = if lower_name.contains(".json") {
        "json".to_string()
    } else {
        "xml".to_string()
    };

    let is_large_file = size_bytes > 10 * 1024 * 1024; // > 10MB
    let mut preview_slice = None;

    if container == "none" {
        let preview_len = std::cmp::min(size_bytes as usize, 65536);
        let mut sample_buf = vec![0u8; preview_len];
        let _ = file.seek(SeekFrom::Start(0));
        if file.read_exact(&mut sample_buf).is_ok() {
            let sample_str = String::from_utf8_lossy(&sample_buf);
            let clean_str = sample_str.strip_prefix('\u{FEFF}').unwrap_or(&sample_str);
            let trimmed = clean_str.trim_start();
            if trimmed.starts_with('{') || trimmed.starts_with('[') {
                detected_format = "json".to_string();
            } else if trimmed.starts_with('<') {
                detected_format = "xml".to_string();
            }

            // Always provide clean sample preview slice without BOM
            preview_slice = Some(clean_str.to_string());
        }
    } else if container == "gzip" {
        if let Ok(gz_file) = File::open(file_path) {
            let mut gz = flate2::read::GzDecoder::new(gz_file);
            let mut decomp_buf = vec![0u8; 65536];
            if let Ok(n) = gz.read(&mut decomp_buf) {
                decomp_buf.truncate(n);
                let sample_str = String::from_utf8_lossy(&decomp_buf);
                let clean_str = sample_str.strip_prefix('\u{FEFF}').unwrap_or(&sample_str);
                let trimmed = clean_str.trim_start();
                if trimmed.starts_with('{') || trimmed.starts_with('[') {
                    detected_format = "json".to_string();
                } else if trimmed.starts_with('<') {
                    detected_format = "xml".to_string();
                }
                preview_slice = Some(clean_str.to_string());
            }
        }
    }

    Ok(FileMetadata {
        path,
        name,
        size_bytes,
        uncompressed_size_bytes: uncompressed_size,
        container,
        detected_format,
        estimated_records: Some(1),
        zip_entries,
        selected_zip_entry: None,
        preview_slice,
        is_large_file,
    })
}

#[tauri::command]
pub async fn read_file_slice(path: String, offset: u64, length: u64) -> Result<String, String> {
    let file_path = Path::new(&path);
    if !file_path.exists() {
        return Err(format!("File not found: {}", path));
    }

    let mut file = File::open(file_path).map_err(|e| e.to_string())?;
    file.seek(SeekFrom::Start(offset)).map_err(|e| e.to_string())?;

    let read_len = std::cmp::min(length, 1024 * 1024) as usize;
    let mut buf = vec![0u8; read_len];
    let actual_read = file.read(&mut buf).map_err(|e| e.to_string())?;
    buf.truncate(actual_read);

    let raw = String::from_utf8_lossy(&buf);
    let clean = if offset == 0 {
        raw.strip_prefix('\u{FEFF}').unwrap_or(&raw).to_string()
    } else {
        raw.to_string()
    };

    Ok(clean)
}

#[tauri::command]
pub async fn search_file(path: String, query: String, max_matches: Option<usize>) -> Result<Vec<u64>, String> {
    FeedSplitter::search_large_file(Path::new(&path), &query, max_matches.unwrap_or(50))
}

#[tauri::command]
pub async fn start_transformation(payload: TransformPayload) -> Result<TransformExecutionResponse, String> {
    let job_id = uuid::Uuid::new_v4().to_string();
    let session_dir = std::env::temp_dir().join("TransformLab").join("sessions").join(&job_id);
    std::fs::create_dir_all(&session_dir).map_err(|e| format!("Failed to create session dir: {}", e))?;

    let mut working_input_path = PathBuf::from(&payload.input_path);

    // If input path was not provided or empty, save editor content
    if !working_input_path.exists() || payload.input_path.trim().is_empty() {
        let ext = if payload.transform_type == "xslt" { "xml" } else { "json" };
        let pasted_file = session_dir.join(format!("input_editor.{}", ext));
        let default_content = if payload.transform_type == "xslt" {
            "<feed><job id=\"1\"><title>Sample</title></job></feed>"
        } else {
            "{\"positions\":[{\"id\":\"1\",\"title\":\"Sample\"}]}"
        };
        let content_to_write = payload.input_content.as_deref().unwrap_or(default_content);
        std::fs::write(&pasted_file, content_to_write).map_err(|e| format!("Failed to write input: {}", e))?;
        working_input_path = pasted_file;
    }

    // Handle GZIP decompression if needed
    if working_input_path.to_string_lossy().ends_with(".gz") {
        let decomp_file = session_dir.join("decompressed_input.raw");
        ArchiveManager::decompress_gzip(&working_input_path, &decomp_file)?;
        working_input_path = decomp_file;
    }

    // Handle Sample Mode extraction (Section 39)
    if payload.is_sample_run && payload.transform_type == "xslt" {
        let sample_file = session_dir.join("sample_input.xml");
        let count = payload.sample_record_count.unwrap_or(100);
        if let Ok(_) = FeedSplitter::extract_xml_sample(&working_input_path, &sample_file, count) {
            working_input_path = sample_file;
        }
    }

    // Target disk output file
    let out_ext = if payload.transform_type == "xslt" { "xml" } else { "json" };
    let output_path = session_dir.join(format!("output.{}", out_ext));
    let output_str = output_path.to_string_lossy().to_string();

    let bridge = JavaBridge::new()?;
    let cancel_flag = Arc::new(AtomicBool::new(false));

    bridge.execute_transformation(
        &payload,
        &working_input_path.to_string_lossy(),
        &output_str,
        cancel_flag,
    )
}

#[tauri::command]
pub async fn cancel_transformation(job_id: String) -> Result<bool, String> {
    log::info!("Transformation cancelled: {}", job_id);
    Ok(true)
}

#[tauri::command]
pub async fn export_output_file(source_path: String, destination_path: String) -> Result<u64, String> {
    let src = Path::new(&source_path);
    if !src.exists() {
        return Err(format!("Source output file not found: {}", source_path));
    }
    let dest = Path::new(&destination_path);
    if let Some(parent) = dest.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let bytes_copied = std::fs::copy(src, dest).map_err(|e| format!("Failed to save output file: {}", e))?;
    Ok(bytes_copied)
}

static ACTIVE_DOWNLOAD_CANCEL: std::sync::LazyLock<Arc<AtomicBool>> =
    std::sync::LazyLock::new(|| Arc::new(AtomicBool::new(false)));

#[tauri::command]
pub async fn cancel_url_download() -> Result<bool, String> {
    ACTIVE_DOWNLOAD_CANCEL.store(true, Ordering::Relaxed);
    Ok(true)
}

#[tauri::command]
pub async fn download_url_feed(
    app: tauri::AppHandle,
    url: String,
    auth_type: Option<String>,
    token: Option<String>,
    username: Option<String>,
    password: Option<String>,
    header_name: Option<String>,
    header_value: Option<String>,
) -> Result<FileMetadata, String> {
    ACTIVE_DOWNLOAD_CANCEL.store(false, Ordering::Relaxed);

    // Determine default file name from URL path
    let parsed_url = reqwest::Url::parse(&url).map_err(|e| format!("Invalid URL: {}", e))?;
    let path_segments = parsed_url.path_segments();
    let url_filename = path_segments
        .and_then(|mut segs| segs.next_back())
        .filter(|s| !s.trim().is_empty())
        .unwrap_or("feed.xml");

    // Clean filename
    let clean_name = url_filename.split('?').next().unwrap_or("feed.xml");
    let safe_filename = if clean_name.contains('.') {
        clean_name.to_string()
    } else {
        format!("{}.xml", clean_name)
    };

    let download_dir = std::env::temp_dir().join("TransformLab").join("downloads");
    std::fs::create_dir_all(&download_dir).map_err(|e| format!("Failed to create download dir: {}", e))?;
    let dest_path = download_dir.join(&safe_filename);
    let dest_str = dest_path.to_string_lossy().to_string();

    let mut basic_auth = None;
    let mut auth_token = None;
    let mut custom_headers = None;

    if let Some(at) = auth_type.as_deref() {
        match at {
            "bearer" => {
                auth_token = token;
            }
            "basic" => {
                if let (Some(u), Some(p)) = (username, password) {
                    basic_auth = Some((u, p));
                }
            }
            "apikey" => {
                if let (Some(hn), Some(hv)) = (header_name, header_value) {
                    custom_headers = Some(vec![(hn, hv)]);
                }
            }
            _ => {}
        }
    }

    let config = UrlDownloadConfig {
        url: url.clone(),
        destination_path: dest_str.clone(),
        auth_token,
        basic_auth,
        custom_headers,
    };

    let app_handle = app.clone();
    let cancel_flag = ACTIVE_DOWNLOAD_CANCEL.clone();

    let (downloaded_bytes, suggested_filename) = UrlDownloader::download_to_file(
        config,
        cancel_flag,
        move |downloaded, total, speed_mbps| {
            let percent = total.map(|t| if t > 0 { (downloaded as f64 / t as f64) * 100.0 } else { 0.0 });
            let _ = app_handle.emit("download-progress", DownloadProgress {
                downloaded_bytes: downloaded,
                total_bytes: total,
                percent,
                speed_m_bps: speed_mbps,
                status: "downloading".to_string(),
            });
        },
    ).await.map_err(|e| {
        let _ = app.emit("download-progress", DownloadProgress {
            downloaded_bytes: 0,
            total_bytes: None,
            percent: None,
            speed_m_bps: 0.0,
            status: "error".to_string(),
        });
        e
    })?;

    let final_dest = if let Some(suggested) = suggested_filename {
        let new_path = download_dir.join(&suggested);
        if new_path != dest_path {
            let _ = std::fs::rename(&dest_path, &new_path);
            new_path
        } else {
            dest_path
        }
    } else {
        dest_path
    };

    let _ = app.emit("download-progress", DownloadProgress {
        downloaded_bytes,
        total_bytes: Some(downloaded_bytes),
        percent: Some(100.0),
        speed_m_bps: 0.0,
        status: "completed".to_string(),
    });

    inspect_file(final_dest.to_string_lossy().to_string()).await
}

#[tauri::command]
pub async fn clear_temp_cache() -> Result<u64, String> {
    let base_dir = std::env::temp_dir().join("TransformLab");
    if !base_dir.exists() {
        return Ok(0);
    }

    fn compute_and_remove(path: &Path) -> u64 {
        let mut total = 0;
        if let Ok(entries) = std::fs::read_dir(path) {
            for entry in entries.flatten() {
                let p = entry.path();
                if p.is_file() {
                    if let Ok(meta) = std::fs::metadata(&p) {
                        total += meta.len();
                    }
                    let _ = std::fs::remove_file(&p);
                } else if p.is_dir() {
                    total += compute_and_remove(&p);
                    let _ = std::fs::remove_dir_all(&p);
                }
            }
        }
        total
    }

    let freed = compute_and_remove(&base_dir);
    Ok(freed)
}

#[tauri::command]
pub async fn get_temp_cache_path() -> Result<String, String> {
    let base_dir = std::env::temp_dir().join("TransformLab");
    Ok(base_dir.to_string_lossy().to_string())
}

