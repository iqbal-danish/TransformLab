import { useRef, useImperativeHandle, forwardRef } from 'react';
import { 
  Code2, 
  FolderOpen, 
  Save, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Radio,
  Trash2
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import type { TransformType } from '../types';
import { defineMonacoThemes } from '../utils/monacoThemes';

export interface TransformPanelHandle {
  goToLine: (line: number, column?: number) => void;
  formatDocument: () => void;
}

interface TransformPanelProps {
  transformType: TransformType;
  content: string;
  onChange: (value: string) => void;
  onOpenFile: () => void;
  onSaveFile: () => void;
  onClear: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isStreamable?: boolean;
  isLargeInput?: boolean;
  theme?: string;
}

export const TransformPanel = forwardRef<TransformPanelHandle, TransformPanelProps>(({
  transformType,
  content,
  onChange,
  onOpenFile,
  onSaveFile,
  onClear,
  isExpanded,
  onToggleExpand,
  isStreamable = true,
  isLargeInput = false,
  theme = 'one-dark-pro',
}, ref) => {
  const editorRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    goToLine: (line: number, column: number = 1) => {
      if (editorRef.current) {
        editorRef.current.revealPositionInCenter({ lineNumber: line, column });
        editorRef.current.setPosition({ lineNumber: line, column });
        editorRef.current.focus();
      }
    },
    formatDocument: () => {
      if (editorRef.current) {
        editorRef.current.getAction('editor.action.formatDocument')?.run();
      }
    }
  }));

  const language = transformType === 'xslt' ? 'xml' : 'json';
  const title = transformType === 'xslt' ? 'XSLT 3.0 STYLESHEET' : 'JOLT SPECIFICATION';

  return (
    <div className="flex flex-col h-full bg-[#21252b] border-r border-[#30363d] relative overflow-hidden">
      {/* Panel Header (Exact 40px / h-10) */}
      <div className="h-10 border-b border-[#30363d] bg-[#161b22] px-3 flex items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-2">
          <Code2 className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-[#e6edf3] uppercase tracking-wider text-[11px]">
            {title}
          </span>
          {transformType === 'xslt' && (
            <span 
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono border flex items-center gap-1 ${
                isStreamable 
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' 
                  : isLargeInput
                    ? 'bg-rose-950/50 text-rose-300 border-rose-800/50 font-medium'
                    : 'bg-amber-950/40 text-amber-400 border-amber-800/40'
              }`}
              title={
                isStreamable 
                  ? "Saxon streamable processing ready (<xsl:mode streamable='yes'/> detected)" 
                  : isLargeInput
                    ? "Not Streamable: XML feed is huge and stylesheet lacks <xsl:mode streamable='yes'/>"
                    : "Not Streamable: buffered in memory unless <xsl:mode streamable='yes'/> is present"
              }
            >
              <Radio className="w-2.5 h-2.5" />
              <span>{isStreamable ? 'Streamable' : 'Not Streamable'}</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={onOpenFile}
            className="px-2 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] flex items-center gap-1 transition-colors"
            title="Open stylesheet/spec file"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open</span>
          </button>

          <button
            onClick={onSaveFile}
            className="px-2 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] flex items-center gap-1 transition-colors"
            title="Save stylesheet/spec (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            onClick={() => editorRef.current?.getAction('editor.action.formatDocument')?.run()}
            className="p-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] transition-colors"
            title="Format Code"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </button>

          <button
            onClick={onClear}
            className="px-2 py-1 rounded bg-[#21262d] hover:bg-rose-950/40 hover:text-rose-300 text-[#8b949e] border border-[#30363d] flex items-center gap-1 transition-colors"
            title="Clear stylesheet / spec content"
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
        <div className="flex items-center space-x-2 text-[#8b949e]">
          <span>Engine: <strong className="text-emerald-400">{transformType === 'xslt' ? 'Saxon-HE 12.5 (XSLT 3.0)' : 'Java JOLT 0.1.8'}</strong></span>
        </div>
        <div className="flex items-center space-x-2 text-[10px] text-emerald-400 font-sans">
          <span>● Engine Ready</span>
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="flex-1 min-h-0 relative">
        <div className="relative w-full h-full">
          <Editor
            height="100%"
            language={language}
            theme={theme}
            beforeMount={defineMonacoThemes}
            value={content}
            onChange={(val) => onChange(val || '')}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
            options={{
              minimap: { enabled: true, maxColumn: 40 },
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
              bracketPairColorization: { enabled: true },
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
          {!content && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-center p-6 space-y-2 opacity-40 z-10">
              <Code2 className="w-8 h-8 text-emerald-400" />
              <div className="text-sm font-medium text-[#c9d1d9]">No transformation loaded</div>
              <div className="text-xs text-[#8b949e] max-w-xs">
                Paste your {transformType === 'xslt' ? 'XSLT 3.0 stylesheet' : 'JOLT spec'} here, or click <strong className="text-emerald-400">Open</strong> to load from disk.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
