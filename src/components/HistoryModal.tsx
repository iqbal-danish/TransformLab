import { History, X, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

import type { TransformType } from '../types';
import { formatBytes, formatDuration } from '../utils/formatters';

export interface HistoryItem {
  id: string;
  timestamp: string;
  inputFile: string;
  transformFile: string;
  transformType: TransformType;
  inputSizeBytes: number;
  executionTimeMs: number;
  status: 'success' | 'error';
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="h-12 border-b border-[#30363d] px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white font-semibold text-sm">
            <History className="w-4 h-4 text-[#58a6ff]" />
            <span>Transformation History</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* History List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2 text-xs">
          {history.length === 0 ? (
            <div className="text-center py-12 text-[#8b949e]">
              No transformation history recorded yet.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectHistoryItem(item);
                  onClose();
                }}
                className="p-3 rounded-md bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {item.status === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span className="font-semibold text-white truncate max-w-xs">{item.inputFile}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e]">
                      {item.transformType.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#8b949e] flex items-center space-x-3">
                    <span>{item.timestamp}</span>
                    <span>{formatBytes(item.inputSizeBytes)}</span>
                    <span>{formatDuration(item.executionTimeMs)}</span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-[#8b949e]" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
