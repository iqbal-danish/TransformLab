import { Activity, XCircle, Zap, Cpu } from 'lucide-react';

import type { ProgressReport } from '../types';
import { formatBytes, formatSecondsClock } from '../utils/formatters';

interface ProgressBannerProps {
  progress: ProgressReport;
  onCancel: () => void;
}

export const ProgressBanner: React.FC<ProgressBannerProps> = ({
  progress,
  onCancel,
}) => {
  return (
    <div className="border-t border-[#30363d] bg-[#161b22] px-4 py-2.5 text-xs select-none">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-[#58a6ff]">
            <Activity className="w-4 h-4 animate-spin" />
            <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
              {progress.currentPhase || 'TRANSFORMING FEED'}
            </span>
          </div>

          <span className="text-[#8b949e]">|</span>

          {/* Bytes processed */}
          <div className="text-[#8b949e]">
            Processed: <strong className="text-white font-mono">{formatBytes(progress.processedBytes)}</strong>
            {progress.totalBytes ? ` / ${formatBytes(progress.totalBytes)}` : ''}
          </div>

          {/* Records count if measured */}
          {progress.processedRecords != null && (
            <div className="text-[#8b949e]">
              Jobs: <strong className="text-emerald-400 font-mono">{progress.processedRecords.toLocaleString()}</strong>
            </div>
          )}

          {/* Speed */}
          {progress.speedMBps !== undefined && progress.speedMBps > 0 && (
            <div className="text-[#8b949e] flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <strong className="text-white font-mono">{progress.speedMBps.toFixed(1)} MB/s</strong>
            </div>
          )}

          {/* Elapsed & ETA */}
          <div className="text-[#8b949e] flex items-center gap-2 font-mono text-[11px]">
            <span>Elapsed: <strong className="text-white">{formatSecondsClock(progress.elapsedSeconds)}</strong></span>
            {progress.etaSeconds !== undefined && (
              <span>ETA: <strong className="text-[#58a6ff]">{formatSecondsClock(progress.etaSeconds)}</strong></span>
            )}
          </div>

          {/* Real RAM memory monitoring */}
          <div className="text-[#8b949e] flex items-center gap-1 font-mono text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span>RAM: <strong className="text-white">{progress.memoryMB} MB</strong></span>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="px-3 py-1 rounded bg-[#da3633] hover:bg-[#b62324] text-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#0d1117] h-2 rounded-full overflow-hidden border border-[#30363d] relative">
        {progress.percent !== undefined ? (
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
          />
        ) : (
          <div className="h-full w-1/3 bg-blue-500 rounded-full animate-pulse" />
        )}
      </div>

      <div className="flex justify-between items-center text-[10px] text-[#8b949e] mt-1 font-mono">
        <span>
          {progress.percent !== undefined 
            ? `${progress.percent.toFixed(2)}% completed` 
            : 'Streaming mode active (input length unavailable)'}
        </span>
        <span>Low-RAM streaming pipeline active</span>
      </div>
    </div>
  );
};
