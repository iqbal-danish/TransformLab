use std::fs::File;
use std::io::{BufReader, BufWriter, Read, Write};
use std::path::Path;
use flate2::read::GzDecoder;

pub struct ArchiveManager;

impl ArchiveManager {
    /// Decompresses a GZIP file to an output file streaming in 64KB chunks
    pub fn decompress_gzip(input_gz: &Path, output_raw: &Path) -> Result<u64, String> {
        let input_file = File::open(input_gz).map_err(|e| format!("Failed to open gzip file: {}", e))?;
        let gz = GzDecoder::new(BufReader::new(input_file));

        if let Some(parent) = output_raw.parent() {
            let _ = std::fs::create_dir_all(parent);
        }

        let out_file = File::create(output_raw).map_err(|e| format!("Failed to create output file: {}", e))?;
        let mut writer = BufWriter::new(out_file);
        let mut reader = BufReader::new(gz);

        let mut buf = [0u8; 65536];
        let mut total_bytes = 0u64;

        loop {
            let n = reader.read(&mut buf).map_err(|e| format!("Gzip decompression error: {}", e))?;
            if n == 0 {
                break;
            }
            writer.write_all(&buf[..n]).map_err(|e| format!("Write error: {}", e))?;
            total_bytes += n as u64;
        }

        writer.flush().map_err(|e| e.to_string())?;
        Ok(total_bytes)
    }

    /// Extracts a specific entry from a ZIP archive directly to a disk path
    pub fn extract_zip_entry(zip_path: &Path, entry_name: &str, output_path: &Path) -> Result<u64, String> {
        let file = File::open(zip_path).map_err(|e| format!("Failed to open zip archive: {}", e))?;
        let mut archive = zip::ZipArchive::new(BufReader::new(file)).map_err(|e| format!("Invalid zip archive: {}", e))?;

        let mut entry = archive.by_name(entry_name)
            .map_err(|e| format!("Entry '{}' not found in zip archive: {}", entry_name, e))?;

        if let Some(parent) = output_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }

        let mut out = BufWriter::new(File::create(output_path).map_err(|e| e.to_string())?);
        let mut buf = [0u8; 65536];
        let mut total_bytes = 0u64;

        loop {
            let n = entry.read(&mut buf).map_err(|e| format!("Zip entry read error: {}", e))?;
            if n == 0 {
                break;
            }
            out.write_all(&buf[..n]).map_err(|e| format!("Write error: {}", e))?;
            total_bytes += n as u64;
        }

        out.flush().map_err(|e| e.to_string())?;
        Ok(total_bytes)
    }
}
