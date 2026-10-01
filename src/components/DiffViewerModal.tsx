import { GitCompare, X } from 'lucide-react';
import { DiffEditor } from '@monaco-editor/react';
import type { InputFormat } from '../types';

interface DiffViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  modifiedText: string;
  language: InputFormat;
}

export const DiffViewerModal: React.FC<DiffViewerModalProps> = ({
  isOpen,
  onClose,
  originalText,
  modifiedText,
  language,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-12 border-b border-[#30363d] px-4 flex items-center justify-between bg-[#0d1117]">
          <div className="flex items-center space-x-2 text-white font-semibold text-sm">
            <GitCompare className="w-4 h-4 text-[#58a6ff]" />
            <span>Feed Transformation Diff Viewer (Input vs Output)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Diff Canvas */}
        <div className="flex-1 min-h-0 relative">
          <DiffEditor
            height="100%"
            language={language}
            theme="one-dark-pro"
            original={originalText}
            modified={modifiedText}
            options={{
              readOnly: true,
              renderSideBySide: true,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
              fontSize: 13,
              lineHeight: 20,
              fontLigatures: true,
              letterSpacing: 0.3,
              automaticLayout: true,
              padding: { top: 8, bottom: 8 },
              stickyScroll: { enabled: false },
            }}
          />
        </div>
      </div>
    </div>
  );
};
