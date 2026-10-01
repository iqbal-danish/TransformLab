use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileMetadata {
    pub path: String,
    pub name: String,
    pub size_bytes: u64,
    pub uncompressed_size_bytes: Option<u64>,
    pub container: String, // "none", "gzip", "zip"
    pub detected_format: String, // "xml", "json"
    pub estimated_records: Option<u64>,
    pub zip_entries: Option<Vec<ZipEntry>>,
    pub selected_zip_entry: Option<String>,
    pub preview_slice: Option<String>,
    pub is_large_file: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ZipEntry {
    pub name: String,
    pub size_bytes: u64,
    pub compressed_size_bytes: u64,
    pub detected_format: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransformParameter {
    pub id: String,
    pub name: String,
    pub value: String,
    #[serde(rename = "type")]
    pub param_type: String, // "string", "number", "boolean"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticError {
    pub category: String, // "Engine", "Application", "Network", "File", "Archive"
    pub code: Option<String>, // e.g. XTSE0010, XPTY0004
    pub message: String,
    pub file: Option<String>,
    pub line: Option<u32>,
    pub column: Option<u32>,
    pub context_snippet: Option<String>,
    pub nested_cause: Option<String>,
    pub raw_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransformStats {
    pub input_size_bytes: u64,
    pub output_size_bytes: u64,
    pub input_records: Option<u64>,
    pub output_records: Option<u64>,
    pub records_removed: Option<u64>,
    pub execution_time_ms: u64,
    pub average_speed_m_bps: f64,
    pub peak_memory_m_b: u64,
    pub output_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressReport {
    pub job_id: String,
    pub status: String,
    pub processed_bytes: u64,
    pub total_bytes: Option<u64>,
    pub percent: Option<f64>,
    pub processed_records: Option<u64>,
    pub speed_m_bps: Option<f64>,
    pub elapsed_seconds: u64,
    pub eta_seconds: Option<u64>,
    pub memory_m_b: u64,
    pub current_phase: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
    pub downloaded_bytes: u64,
    pub total_bytes: Option<u64>,
    pub percent: Option<f64>,
    pub speed_m_bps: f64,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransformPayload {
    pub input_path: String,
    pub input_content: Option<String>,
    pub transform_content: String,
    pub transform_type: String, // "xslt", "jolt"
    pub parameters: Vec<TransformParameter>,
    pub is_sample_run: bool,
    pub sample_record_count: Option<u64>,
    pub output_compression: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransformExecutionResponse {
    pub job_id: String,
    pub stats: Option<TransformStats>,
    pub error: Option<DiagnosticError>,
}
