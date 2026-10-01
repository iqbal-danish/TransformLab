use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use crate::types::{DiagnosticError, TransformExecutionResponse, TransformPayload, TransformStats};

pub struct JavaBridge {
    java_bin: PathBuf,
    classpath: String,
}

impl JavaBridge {
    pub fn new() -> Result<Self, String> {
        let java_bin = Self::find_java_executable()?;
        let classpath = Self::build_classpath()?;

        Ok(Self {
            java_bin,
            classpath,
        })
    }

    fn find_java_executable() -> Result<PathBuf, String> {
        // 1. Check JAVA_HOME
        if let Ok(jh) = std::env::var("JAVA_HOME") {
            let p = Path::new(&jh).join("bin").join("java.exe");
            if p.exists() {
                return Ok(p);
            }
        }

        // 2. Check standard Microsoft JDK path
        let ms_jdk = Path::new(r"C:\Program Files\Microsoft\jdk-25.0.4.101-hotspot\bin\java.exe");
        if ms_jdk.exists() {
            return Ok(ms_jdk.to_path_buf());
        }

        // 3. Fallback to "java" on PATH
        Ok(PathBuf::from("java"))
    }

    fn build_classpath() -> Result<String, String> {
        // Look for engine-worker relative to current dir or executable dir
        let base_dirs = [
            PathBuf::from("engine-worker"),
            PathBuf::from("../engine-worker"),
            PathBuf::from("../../engine-worker"),
        ];

        for base in &base_dirs {
            let jar = base.join("transform-engine.jar");
            let jars_dir = base.join("jars");
            if jar.exists() && jars_dir.exists() {
                return Ok(format!("{};{}\\*", jar.to_string_lossy(), jars_dir.to_string_lossy()));
            }
        }

        // Fallback absolute path
        Ok(r"C:\Users\diqbal\TransformLab\engine-worker\transform-engine.jar;C:\Users\diqbal\TransformLab\engine-worker\jars\*".to_string())
    }

    pub fn execute_transformation(
        &self,
        payload: &TransformPayload,
        actual_input_path: &str,
        actual_output_path: &str,
        cancel_flag: Arc<AtomicBool>,
    ) -> Result<TransformExecutionResponse, String> {
        let job_id = uuid::Uuid::new_v4().to_string();

        // Write request payload to temporary file for the Java process
        let temp_dir = tempfile::tempdir().map_err(|e| e.to_string())?;
        let req_file = temp_dir.path().join("request.json");

        let mut req_map = serde_json::Map::new();
        req_map.insert("engine".to_string(), serde_json::json!(payload.transform_type));
        req_map.insert("inputPath".to_string(), serde_json::json!(actual_input_path));
        req_map.insert("outputPath".to_string(), serde_json::json!(actual_output_path));
        req_map.insert("transformContent".to_string(), serde_json::json!(payload.transform_content));
        req_map.insert("parameters".to_string(), serde_json::to_value(&payload.parameters).unwrap_or_default());

        std::fs::write(&req_file, serde_json::to_string(&req_map).map_err(|e| e.to_string())?)
            .map_err(|e| e.to_string())?;

        let mut cmd = Command::new(&self.java_bin);
        cmd.arg("-Xms256m")
            .arg("-Xmx4096m")
            .arg("-Djdk.xml.maxGeneralEntitySizeLimit=0")
            .arg("-Djdk.xml.totalEntitySizeLimit=0")
            .arg("-Djdk.xml.entityExpansionLimit=0")
            .arg("-Djdk.xml.maxXMLNameLimit=0")
            .arg("-Djdk.xml.elementAttributeLimit=0")
            .arg("-Djdk.xml.maxOccurLimit=0")
            .arg("-Djdk.xml.xpathExprGrpLimit=0")
            .arg("-Djdk.xml.xpathExprOpLimit=0")
            .arg("-Djdk.xml.xpathTotalOpLimit=0")
            .arg("-DentityExpansionLimit=0")
            .arg("-cp")
            .arg(&self.classpath)
            .arg("com.transformlab.engine.TransformEngineWorker")
            .arg(req_file.to_string_lossy().to_string())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());

        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
        }

        let mut child = cmd.spawn()
            .map_err(|e| format!("Failed to spawn Java worker: {}. Check that Java is installed.", e))?;

        // Monitor child process and cancellation
        while child.try_wait().map_err(|e| e.to_string())?.is_none() {
            if cancel_flag.load(Ordering::Relaxed) {
                let _ = child.kill();
                return Err("Transformation was cancelled by the user.".to_string());
            }
            std::thread::sleep(std::time::Duration::from_millis(50));
        }

        let output = child.wait_with_output().map_err(|e| e.to_string())?;
        let stdout_str = String::from_utf8_lossy(&output.stdout);

        if !stdout_str.trim().is_empty() {
            if let Ok(resp_json) = serde_json::from_str::<serde_json::Value>(&stdout_str) {
                let status = resp_json.get("status").and_then(|s| s.as_str()).unwrap_or("error");

                if status == "success" {
                    let exec_time = resp_json.get("executionTimeMs").and_then(|v| v.as_u64()).unwrap_or(0);
                    let out_size = resp_json.get("outputSizeBytes").and_then(|v| v.as_u64()).unwrap_or(0);
                    let in_size = std::fs::metadata(actual_input_path).map(|m| m.len()).unwrap_or(0);
                    let speed = if exec_time > 0 {
                        (in_size as f64 / 1_048_576.0) / (exec_time as f64 / 1000.0)
                    } else {
                        0.0
                    };

                    return Ok(TransformExecutionResponse {
                        job_id,
                        stats: Some(TransformStats {
                            input_size_bytes: in_size,
                            output_size_bytes: out_size,
                            input_records: None,
                            output_records: None,
                            records_removed: None,
                            execution_time_ms: exec_time,
                            average_speed_m_bps: speed,
                            peak_memory_m_b: 85,
                            output_path: Some(actual_output_path.to_string()),
                        }),
                        error: None,
                    });
                } else if let Some(err_val) = resp_json.get("error") {
                    let diag_err: DiagnosticError = serde_json::from_value(err_val.clone())
                        .unwrap_or_else(|_| DiagnosticError {
                            category: "Engine".to_string(),
                            code: None,
                            message: stdout_str.to_string(),
                            file: None,
                            line: None,
                            column: None,
                            context_snippet: None,
                            nested_cause: None,
                            raw_error: Some(stdout_str.to_string()),
                        });

                    return Ok(TransformExecutionResponse {
                        job_id,
                        stats: None,
                        error: Some(diag_err),
                    });
                }
            }
        }

        let stderr_str = String::from_utf8_lossy(&output.stderr);
        Ok(TransformExecutionResponse {
            job_id,
            stats: None,
            error: Some(DiagnosticError {
                category: "Engine".to_string(),
                code: None,
                message: if !stderr_str.trim().is_empty() { stderr_str.to_string() } else { stdout_str.to_string() },
                file: None,
                line: None,
                column: None,
                context_snippet: None,
                nested_cause: None,
                raw_error: Some(stderr_str.to_string()),
            }),
        })
    }
}
