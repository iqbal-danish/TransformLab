# TransformLab 🚀

> **High-Performance XML & JSON Feed Transformation Studio**  
> Built with **Tauri 2**, **React 19**, **TypeScript**, **Rust**, **Monaco Editor**, **Saxon-HE 12.5**, and **Java JOLT 0.1.8**.

---

## 🌟 Overview

**TransformLab** is a specialized desktop IDE and transformation studio engineered specifically for massive XML and JSON feeds (e.g., job aggregation feeds, e-commerce catalogs, partner syndication). It bridges desktop GUI usability with enterprise-grade streaming engines, executing transformations on feeds ranging from small samples up to multi-gigabyte files with **\(O(1)\) memory safety**.

---

## ⚡ Core Engine Architecture

TransformLab employs a **Dual-Engine Pipeline**:

1. **Saxon-HE 12.5 (XSLT 3.0 Streaming)**:
   - Full support for XSLT 3.0, XPath 3.1, and streaming accumulators.
   - Real-time detection of `<xsl:mode streamable="yes"/>`.
   - Tuned JVM parameters (`-Xmx4g`, `-Djdk.xml.maxGeneralEntitySizeLimit=0`, `entityExpansionLimit=0`) to process massive XML documents without DOM entity or memory limits.

2. **Java JOLT 0.1.8 (JSON-to-JSON Transformations)**:
   - Declarative JSON transformation specifications (`shift`, `default`, `modify-overwrite-beta`, `cardinality`, `sort`).
   - Jackson streaming serialization for minimal footprint.

3. **Rust Streaming & Memory-Mapped IO**:
   - Asynchronous socket streaming directly to disk with `reqwest` and `tokio::io::BufWriter` (512 KB sequential write buffer).
   - High-performance memory-mapped file reader (`memmap2`) for regex searching across gigantic feeds without loading entire files into memory.

---

## 🛠️ Key Features

- **3-Panel Synchronized Studio**:
  - **Input Panel**: XML/JSON feed preview, container detection (`.xml`, `.json`, `.gz`, `.zip`), ZIP archive inspector, and dedicated `Clear` button.
  - **Transform Panel**: Full Monaco Editor with syntax highlighting, automatic indentation, document formatting, streamability indicator (`Streamable` vs `Not Streamable`), and `Clear` button.
  - **Output Panel**: Real-time stats (throughput in MB/s, execution duration, peak RAM, input/output size), copy to clipboard, `Save As`, and `Clear` button.
- **Direct-to-Disk URL Streaming Downloader**:
  - Downloads feeds from HTTP/HTTPS at raw network speeds.
  - Real-time progress bar with live throughput (`MB/s`), bytes streamed, and cancellation token.
  - Bypasses browser heap completely — streams straight into `%TEMP%\TransformLab\downloads\`.
- **UTF-8 BOM Sanitization**:
  - Automatically strips Byte Order Marks (`\uFEFF` / `0xEF 0xBB 0xBF`) to eliminate corrupt character artifacts (``).
- **Streamability Verification**:
  - Automatically verifies if XSLT stylesheets declare `<xsl:mode streamable="yes"/>`.
  - Warns and protects system resources if attempting to execute buffered transforms on large feeds.
- **Native Immersive Dark Titlebar**:
  - Native Windows DWM dark mode integration matching One Dark Pro.

---

## 🧹 Temporary Files & Cache Management

When streaming remote URLs or running local transformations, temporary files are staged to disk to keep browser RAM at \(O(1)\):

- **Staging Directory**:
  ```text
  %TEMP%\TransformLab\
  ├── downloads\   <-- Feeds streamed from HTTP/HTTPS
  └── sessions\    <-- Session-isolated transformation scratch files
  ```

### How to Delete / Purge Cache:
1. **In-App (1-Click)**:
   - Press <kbd>Ctrl</kbd> + <kbd>P</kbd> to open the **Command Palette**.
   - Select **`Purge Downloaded Feeds & Temp Cache`**.
2. **Manually via File Explorer**:
   - Press <kbd>Win</kbd> + <kbd>R</kbd>, enter `%TEMP%\TransformLab`, and delete the directory contents.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> | **Run Transformation** |
| <kbd>Ctrl</kbd> + <kbd>O</kbd> | **Open Input File...** |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | **Save Transformed Output...** |
| <kbd>Ctrl</kbd> + <kbd>P</kbd> | **Open Command Palette** |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> | **Search Gigantic Feed (Memory-Mapped)** |

---

## 🚀 Building & Running from Source

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Rust**: v1.80.0 or higher
- **Java JRE / JDK**: v17 or higher (for Saxon & JOLT engine worker)

### Installation
```bash
# Clone repository
git clone https://github.com/iqbal-danish/TransformLab.git
cd TransformLab

# Install frontend dependencies
npm install

# Start development studio (Vite + Tauri)
npm run desktop
```

### Production Build
```bash
# Compile frontend and standalone Windows binary
npm run build
npx tauri build --no-bundle
```
The compiled standalone executable will be generated at:
```text
src-tauri/target/release/app.exe
```

---

## 📄 License
MIT License. Created by [Md Danish Iqbal](https://github.com/iqbal-danish).
