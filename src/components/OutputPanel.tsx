import { useState } from 'react';
import { 
  FileCheck, 
  Copy, 
  Save, 
  Maximize2, 
  Minimize2, 
  Check, 
  Sparkles,
  Trash2
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import type { TransformStats, InputFormat } from '../types';
import { formatBytes, formatDuration } from '../utils/formatters';
import { defineMonacoThemes } from '../utils/monacoThemes';

interface OutputPanelProps {
  outputContent: string;
  outputFormat: InputFormat;
  stats: TransformStats | null;
  onSaveOutput: () => void;
  onClear: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isLargeOutput: boolean;
  outputPath?: string;
  theme?: string;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  outputContent,
  outputFormat,
  stats,
  onSaveOutput,
  onClear,
  isExpanded,
  onToggleExpand,
  isLargeOutput,
  outputPath,
  theme = 'one-dark-pro',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!outputContent) return;
    navigator.clipboard.writeText(outputContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#21252b] relative overflow-hidden">
      {/* Panel Header (Exact 40px / h-10) */}
      <div className="h-10 border-b border-[#30363d] bg-[#161b22] px-3 flex items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-2">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-[#e6edf3] uppercase tracking-wider text-[11px]">
            TRANSFORMED OUTPUT
          </span>
          {stats && (
            <span className="text-[10px] bg-emerald-950/60 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800/50 font-mono">
              {formatDuration(stats.executionTimeMs)}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          {outputContent && (
            <button
              onClick={handleCopy}
              className="px-2 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] flex items-center gap-1 transition-colors"
              title="Copy Output"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          <button
            onClick={onSaveOutput}
            className="px-2.5 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white border border-green-700/50 flex items-center gap-1.5 transition-colors font-medium shadow-sm"
            title="Download Complete File"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save As</span>
          </button>

          <button
            onClick={onClear}
            className="px-2 py-1 rounded bg-[#21262d] hover:bg-rose-950/40 hover:text-rose-300 text-[#8b949e] border border-[#30363d] flex items-center gap-1 transition-colors"
            title="Clear output and statistics"
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
      <div className="h-8 border-b border-[#30363d] bg-[#161b22]/90 px-3 flex items-center justify-between text-[11px] font-mono select-none" title={outputPath}>
        {stats ? (
          <>
            <div className="flex items-center space-x-3 text-[#8b949e] truncate">
              <span>Size: <strong className="text-white">{formatBytes(stats.outputSizeBytes)}</strong></span>
              <span>Speed: <strong className="text-white font-mono">{(stats.averageSpeedMBps || 0).toFixed(1)} MB/s</strong></span>
              {isLargeOutput && (
                <span className="text-[10px] text-amber-300 bg-amber-950/50 border border-amber-800/40 px-1.5 py-0.5 rounded font-sans shrink-0">
                  64 KB Preview
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-[10px] text-[#58a6ff] shrink-0 font-sans">
              <span>Peak RAM: <strong className="font-mono">{stats.peakMemoryMB} MB</strong></span>
            </div>
          </>
        ) : (
          <>
            <span className="text-[#8b949e]">No output generated yet</span>
            <span className="text-[10px] text-[#8b949e] font-sans">Ready for transform</span>
          </>
        )}
      </div>

      {/* Editor Canvas Always Mounted (Identical #21252b background as Panel 1 & 2) */}
      <div className="flex-1 min-h-0 relative">
        <div className="relative w-full h-full">
          <Editor
            height="100%"
            language={outputFormat}
            theme={theme}
            beforeMount={defineMonacoThemes}
            value={outputContent}
            options={{
              readOnly: true,
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
          {!outputContent && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-center p-6 space-y-2 opacity-40 z-10">
              <Sparkles className="w-8 h-8 text-[#58a6ff]" />
              <div className="text-sm font-medium text-[#c9d1d9]">No output generated yet</div>
              <div className="text-xs text-[#8b949e] max-w-xs">
                Press <kbd className="px-1.5 py-0.5 bg-[#161b22] text-[#e6edf3] rounded border border-[#30363d] font-mono">Ctrl + Enter</kbd> to execute transformation.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
