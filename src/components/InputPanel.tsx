import { 
  FileCode, 
  FolderOpen, 
  Globe, 
  Archive, 
  Maximize2, 
  Minimize2,
  Trash2,
  Upload
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import type { FileMetadata, InputFormat } from '../types';
import { formatBytes } from '../utils/formatters';
import { defineMonacoThemes } from '../utils/monacoThemes';

interface InputPanelProps {
  inputFormat: InputFormat;
  rawInputText: string;
  onRawInputChange: (value: string) => void;
  metadata: FileMetadata | null;
  onOpenFile: () => void;
  onOpenUrlModal: () => void;
  onClear: () => void;
  onSelectZipEntry?: (entryName: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  theme?: string;
  isDraggingFile?: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  inputFormat,
  rawInputText,
  onRawInputChange,
  metadata,
  onOpenFile,
  onOpenUrlModal,
  onClear,
  onSelectZipEntry,
  isExpanded,
  onToggleExpand,
  theme = 'one-dark-pro',
  isDraggingFile = false,
}) => {
  return (
    <div className="flex flex-col h-full bg-[#21252b] border-r border-[#30363d] relative overflow-hidden">
      {/* Drag & Drop Visual Overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 bg-[#0d1117]/90 border-2 border-dashed border-[#58a6ff] z-50 flex flex-col items-center justify-center pointer-events-none backdrop-blur-[1px]">
          <Upload className="w-10 h-10 text-[#58a6ff] animate-bounce mb-2" />
          <p className="text-sm font-semibold text-white">Drop feed file here</p>
          <p className="text-xs text-[#8b949e]">Auto-detects XML, JSON, GZ, or ZIP & inspects size</p>
        </div>
      )}

      {/* Panel Header (Exact 40px / h-10) */}
      <div className="h-10 border-b border-[#30363d] bg-[#161b22] px-3 flex items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-2">
          <FileCode className="w-4 h-4 text-[#58a6ff]" />
          <span className="font-semibold text-[#e6edf3] uppercase tracking-wider text-[11px]">
            INPUT ({inputFormat.toUpperCase()})
          </span>
          {metadata && (
            <>
              <span className="text-[10px] bg-[#21262d] text-[#8b949e] px-1.5 py-0.5 rounded border border-[#30363d] font-mono">
                {metadata.container !== 'none' ? metadata.container.toUpperCase() : 'RAW'}
              </span>
              <span 
                className="text-[10px] bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40 px-2 py-0.5 rounded font-mono font-medium"
                title={metadata.uncompressedSizeBytes ? `Compressed: ${formatBytes(metadata.sizeBytes)} | Uncompressed: ${formatBytes(metadata.uncompressedSizeBytes)}` : `Size: ${formatBytes(metadata.sizeBytes)}`}
              >
                {metadata.uncompressedSizeBytes && metadata.uncompressedSizeBytes !== metadata.sizeBytes
                  ? `${formatBytes(metadata.uncompressedSizeBytes)} (raw)`
                  : formatBytes(metadata.sizeBytes)}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={onOpenFile}
            className="px-2 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] flex items-center gap-1 transition-colors"
            title="Open local file (.xml, .json, .gz, .zip)"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open</span>
          </button>

          <button
            onClick={onOpenUrlModal}
            className="px-2 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] flex items-center gap-1 transition-colors"
            title="Download from HTTP/HTTPS URL"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>URL</span>
          </button>

          <button
            onClick={onClear}
            className="px-2 py-1 rounded bg-[#21262d] hover:bg-rose-950/40 hover:text-rose-300 text-[#8b949e] border border-[#30363d] flex items-center gap-1 transition-colors"
            title="Clear input and detach file"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            onClick={onToggleExpand}
            className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
            title={isExpanded ? "Collapse" : "Maximize"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Sub-header Bar (Exact 32px / h-8 for unified height across all 3 panels) */}
      <div className="h-8 border-b border-[#30363d] bg-[#161b22]/90 px-3 flex items-center justify-between text-[11px] font-mono select-none">
        {metadata ? (
          <>
            <div className="flex items-center space-x-2 truncate">
              <span className="text-[#58a6ff] font-medium truncate max-w-[200px]" title={metadata.path}>
                {metadata.name}
              </span>
              <span className="text-[11px] font-mono font-semibold text-[#e6edf3] bg-[#21262d] border border-[#30363d] px-1.5 py-0.5 rounded">
                {metadata.uncompressedSizeBytes && metadata.uncompressedSizeBytes !== metadata.sizeBytes
                  ? `${formatBytes(metadata.sizeBytes)} → ${formatBytes(metadata.uncompressedSizeBytes)} uncompressed`
                  : formatBytes(metadata.sizeBytes)}
              </span>
              {metadata.isLargeFile && (
                <span className="text-[10px] text-amber-300 bg-amber-950/50 border border-amber-800/40 px-1.5 py-0.5 rounded font-sans">
                  64 KB Preview
                </span>
              )}
            </div>
            <div className="text-[10px] text-emerald-400 font-sans shrink-0">
              Full feed transformed
            </div>
          </>
        ) : (
          <>
            <span className="text-[#8b949e]">No file attached (Drag & drop feed or paste content)</span>
            <span className="text-[10px] text-[#8b949e] font-sans">Ready for input</span>
          </>
        )}
      </div>

      {/* ZIP Archive entries selector if applicable */}
      {metadata?.container === 'zip' && metadata.zipEntries && metadata.zipEntries.length > 0 && (
        <div className="bg-[#161b22] border-b border-[#30363d] p-2 text-xs">
          <div className="text-[10px] text-[#8b949e] uppercase font-semibold mb-1 flex items-center gap-1">
            <Archive className="w-3 h-3" /> Select Entry:
          </div>
          <div className="max-h-20 overflow-y-auto space-y-1">
            {metadata.zipEntries.map((entry) => (
              <div
                key={entry.name}
                onClick={() => onSelectZipEntry && onSelectZipEntry(entry.name)}
                className={`flex items-center justify-between p-1 rounded cursor-pointer text-[11px] font-mono ${
                  metadata.selectedZipEntry === entry.name
                    ? 'bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40'
                    : 'hover:bg-[#21262d] text-[#8b949e]'
                }`}
              >
                <span className="truncate">{entry.name}</span>
                <span>{formatBytes(entry.sizeBytes)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monaco Editor Always Active */}
      <div className="flex-1 min-h-0 relative">
        <div className="relative w-full h-full">
          <Editor
            height="100%"
            language={inputFormat}
            theme={theme}
            beforeMount={defineMonacoThemes}
            value={rawInputText}
            onChange={(val) => onRawInputChange(val || '')}
            options={{
              minimap: { enabled: false },
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
              fontSize: 13,
              lineHeight: 20,
              fontLigatures: true,
              letterSpacing: 0.3,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 2,
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              padding: { top: 8, bottom: 8 },
              stickyScroll: { enabled: false },
              unicodeHighlight: {
                ambiguousCharacters: false,
                invisibleCharacters: false,
                nonBasicASCII: false,
              },
              renderControlCharacters: false,
            }}
          />
          {!metadata && !rawInputText && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-center p-6 space-y-2 opacity-40 z-10">
              <FolderOpen className="w-8 h-8 text-[#58a6ff]" />
              <div className="text-sm font-medium text-[#c9d1d9]">No input feed loaded</div>
              <div className="text-xs text-[#8b949e] max-w-xs">
                Drop a feed file (.xml, .json, .gz, .zip), click <strong className="text-[#58a6ff]">Open</strong> or <strong className="text-[#58a6ff]">URL</strong>, or start typing/pasting here.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
