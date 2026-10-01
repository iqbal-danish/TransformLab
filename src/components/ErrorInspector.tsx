import { useState } from 'react';
import { 
  AlertCircle, 
  ArrowRight, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import type { DiagnosticError } from '../types';

interface ErrorInspectorProps {
  error: DiagnosticError | null;
  onGoToLine?: (line: number, column?: number) => void;
  onDismiss?: () => void;
}

export const ErrorInspector: React.FC<ErrorInspectorProps> = ({
  error,
  onGoToLine,
  onDismiss,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  if (!error) return null;

  const handleCopy = () => {
    const errorText = JSON.stringify(error, null, 2);
    navigator.clipboard.writeText(errorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Engine':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Network':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'File':
      case 'Archive':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <div className="border-t border-[#da3633]/60 bg-[#161214] text-xs font-sans">
      <div className="h-9 px-3 bg-[#241215] flex items-center justify-between border-b border-[#da3633]/40">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 animate-pulse" />
          <span className="font-semibold text-white tracking-wide uppercase text-[11px]">
            ERROR INSPECTOR
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono border ${getCategoryBadgeClass(error.category)}`}>
            {error.category} Error
          </span>
          {error.code && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950 text-red-200 border border-red-700/60 font-bold">
              {error.code}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {error.line !== undefined && onGoToLine && (
            <button
              onClick={() => onGoToLine(error.line!, error.column)}
              className="px-2.5 py-1 rounded bg-[#da3633] hover:bg-[#b62324] text-white font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Go To Error ({error.line}:{error.column || 1})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleCopy}
            className="px-2 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] flex items-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Error'}</span>
          </button>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-[#8b949e] hover:text-white px-2 py-1"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      {/* Main Error Details */}
      <div className="p-3 space-y-2">
        <div className="text-red-200 font-mono text-[12px] whitespace-pre-wrap leading-relaxed bg-[#0d1117] p-2.5 rounded border border-[#30363d]">
          {error.message}
        </div>

        {/* Location & Context */}
        <div className="flex flex-wrap items-center gap-4 text-[#8b949e] text-[11px]">
          {error.file && (
            <div>
              File: <span className="text-[#58a6ff] font-mono">{error.file}</span>
            </div>
          )}
          {error.line !== undefined && (
            <div>
              Line: <span className="text-white font-mono font-bold">{error.line}</span>
            </div>
          )}
          {error.column !== undefined && (
            <div>
              Column: <span className="text-white font-mono font-bold">{error.column}</span>
            </div>
          )}
        </div>

        {error.contextSnippet && (
          <div className="mt-1">
            <div className="text-[10px] uppercase text-[#8b949e] font-semibold mb-1">Context:</div>
            <pre className="p-2 rounded bg-[#0d1117] text-[#c9d1d9] font-mono text-[11px] overflow-x-auto border border-[#30363d]">
              {error.contextSnippet}
            </pre>
          </div>
        )}

        {/* Raw Stack Trace / Cause Toggle */}
        {(error.nestedCause || error.rawError) && (
          <div>
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="text-[11px] text-[#58a6ff] hover:underline flex items-center gap-1 mt-1"
            >
              {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{showRaw ? 'Hide underlying cause' : 'View full engine diagnostics'}</span>
            </button>
            {showRaw && (
              <pre className="mt-2 p-2 rounded bg-[#0d1117] text-[#8b949e] font-mono text-[10px] overflow-x-auto border border-[#30363d] max-h-36">
                {error.nestedCause || error.rawError}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
