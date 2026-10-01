use std::fs::File;
use std::io::{BufReader, BufWriter, Write};

use std::path::Path;
use quick_xml::events::Event;
use quick_xml::reader::Reader;

pub struct FeedSplitter;

impl FeedSplitter {
    /// Extracts the first N XML records (e.g. <job>...</job>) preserving root container
    pub fn extract_xml_sample(
        input_path: &Path,
        output_sample_path: &Path,
        target_record_count: u64,
    ) -> Result<u64, String> {
        let file = File::open(input_path).map_err(|e| e.to_string())?;
        let buf_reader = BufReader::with_capacity(65536, file);
        let mut reader = Reader::from_reader(buf_reader);
        reader.config_mut().trim_text(false);

        let out_file = File::create(output_sample_path).map_err(|e| e.to_string())?;
        let mut writer = BufWriter::new(out_file);

        let mut buf = Vec::new();
        let mut record_count = 0u64;
        let mut in_record = false;
        let mut record_tag_name = String::new();
        let mut root_elements_opened = Vec::new();

        writer.write_all(b"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n").map_err(|e| e.to_string())?;

        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(ref e)) => {
                    let name = String::from_utf8_lossy(e.name().as_ref()).to_string();
                    let lower = name.to_lowercase();

                    if !in_record && (lower == "job" || lower == "position" || lower == "posting" || lower == "item" || lower == "record") {
                        in_record = true;
                        record_tag_name = name.clone();
                        writer.write_all(b"<").map_err(|e| e.to_string())?;
                        writer.write_all(e.name().as_ref()).map_err(|e| e.to_string())?;
                        for attr in e.attributes().flatten() {
                            writer.write_all(b" ").map_err(|e| e.to_string())?;
                            writer.write_all(attr.key.as_ref()).map_err(|e| e.to_string())?;
                            writer.write_all(b"=\"").map_err(|e| e.to_string())?;
                            writer.write_all(&attr.value).map_err(|e| e.to_string())?;
                            writer.write_all(b"\"").map_err(|e| e.to_string())?;
                        }
                        writer.write_all(b">").map_err(|e| e.to_string())?;
                    } else if in_record {
                        writer.write_all(b"<").map_err(|e| e.to_string())?;
                        writer.write_all(e.name().as_ref()).map_err(|e| e.to_string())?;
                        writer.write_all(b">").map_err(|e| e.to_string())?;
                    } else {
                        // Container level tag
                        root_elements_opened.push(name.clone());
                        writer.write_all(b"<").map_err(|e| e.to_string())?;
                        writer.write_all(e.name().as_ref()).map_err(|e| e.to_string())?;
                        writer.write_all(b">").map_err(|e| e.to_string())?;
                    }
                }
                Ok(Event::End(ref e)) => {
                    let name = String::from_utf8_lossy(e.name().as_ref()).to_string();
                    if in_record && name == record_tag_name {
                        writer.write_all(b"</").map_err(|e| e.to_string())?;
                        writer.write_all(e.name().as_ref()).map_err(|e| e.to_string())?;
                        writer.write_all(b">\n").map_err(|e| e.to_string())?;
                        in_record = false;
                        record_count += 1;

                        if record_count >= target_record_count {
                            break;
                        }
                    } else if in_record {
                        writer.write_all(b"</").map_err(|e| e.to_string())?;
                        writer.write_all(e.name().as_ref()).map_err(|e| e.to_string())?;
                        writer.write_all(b">").map_err(|e| e.to_string())?;
                    }
                }
                Ok(Event::Text(ref e)) => {
                    if in_record {
                        writer.write_all(e.as_ref()).map_err(|e| e.to_string())?;
                    }
                }
                Ok(Event::CData(ref e)) => {
                    if in_record {
                        writer.write_all(b"<![CDATA[").map_err(|e| e.to_string())?;
                        writer.write_all(e.as_ref()).map_err(|e| e.to_string())?;
                        writer.write_all(b"]]>").map_err(|e| e.to_string())?;
                    }
                }
                Ok(Event::Eof) => break,
                Err(e) => return Err(format!("Error parsing XML feed: {}", e)),
                _ => {}
            }
            buf.clear();
        }

        // Close any opened root elements
        while let Some(tag) = root_elements_opened.pop() {
            writer.write_all(b"\n</").map_err(|e| e.to_string())?;
            writer.write_all(tag.as_bytes()).map_err(|e| e.to_string())?;
            writer.write_all(b">").map_err(|e| e.to_string())?;
        }

        writer.flush().map_err(|e| e.to_string())?;
        Ok(record_count)
    }

    /// Fast memory-mapped regex/text search returning match byte offsets (Section 33)
    pub fn search_large_file(
        path: &Path,
        query: &str,
        max_matches: usize,
    ) -> Result<Vec<u64>, String> {
        let file = File::open(path).map_err(|e| e.to_string())?;
        let mmap = unsafe { memmap2::Mmap::map(&file).map_err(|e| e.to_string())? };

        let mut matches = Vec::new();
        let query_bytes = query.as_bytes();
        if query_bytes.is_empty() {
            return Ok(matches);
        }

        let mut pos = 0;
        while let Some(idx) = mmap[pos..].windows(query_bytes.len()).position(|w| w == query_bytes) {
            let offset = pos + idx;
            matches.push(offset as u64);
            if matches.len() >= max_matches {
                break;
            }
            pos = offset + query_bytes.len();
        }

        Ok(matches)
    }
}
