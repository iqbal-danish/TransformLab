import { useState } from 'react';
import { 
  X, 
  Globe, 
  ShieldCheck, 
  Download, 
  Zap, 
  HardDrive, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import type { DownloadProgress, UrlAuthConfig } from '../types';
import { formatBytes } from '../utils/formatters';

interface UrlInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string, authConfig?: UrlAuthConfig) => void;
  isDownloading: boolean;
  downloadProgress: DownloadProgress | null;
  onCancelDownload: () => void;
  downloadError?: string | null;
}

export const UrlInputModal: React.FC<UrlInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isDownloading,
  downloadProgress,
  onCancelDownload,
  downloadError,
}) => {
  const [url, setUrl] = useState('');
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'basic' | 'apikey'>('none');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [headerName, setHeaderName] = useState('X-API-Key');
  const [headerValue, setHeaderValue] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isDownloading) return;

    let authConfig: UrlAuthConfig | undefined = undefined;
    if (authType === 'bearer') {
      authConfig = { type: 'bearer', token };
    } else if (authType === 'basic') {
      authConfig = { type: 'basic', username, password };
    } else if (authType === 'apikey') {
      authConfig = { type: 'apikey', headerName, headerValue };
    }

    onSubmit(url.trim(), authConfig);
  };

  const percent = downloadProgress?.percent ?? (downloadProgress?.totalBytes ? (downloadProgress.downloadedBytes / downloadProgress.totalBytes) * 100 : undefined);
  const speed = downloadProgress?.speedMBps ?? 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="h-12 border-b border-[#30363d] px-4 flex items-center justify-between bg-[#1c2128]">
          <div className="flex items-center space-x-2.5 text-white font-semibold text-sm">
            <Globe className="w-4 h-4 text-[#58a6ff]" />
            <span>Open Feed from URL</span>
          </div>
          {!isDownloading && (
            <button
              onClick={onClose}
              className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Form or Streaming Progress View */}
        {isDownloading ? (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-[#1f6feb]/20 border border-[#388bfd]/30 flex items-center justify-center text-[#58a6ff]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h4 className="text-white text-sm font-semibold flex items-center gap-2">
                    <span>Streaming Feed to Disk</span>
                  </h4>
                  <p className="text-[11px] text-[#8b949e]">
                    Direct socket write via Rust engine at maximum throughput
                  </p>
                </div>
              </div>

              {speed > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-emerald-400 font-mono text-xs">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{speed.toFixed(2)} MB/s</span>
                </div>
              )}
            </div>

            {/* Progress Bar Container */}
            <div className="space-y-2">
              <div className="h-3 w-full bg-[#0d1117] rounded-full overflow-hidden border border-[#30363d] relative">
                {percent !== undefined ? (
                  <div
                    className="h-full bg-linear-to-r from-[#1f6feb] via-[#388bfd] to-emerald-400 rounded-full transition-all duration-150 relative"
                    style={{ width: `${Math.min(100, Math.max(2, percent))}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                ) : (
                  <div className="h-full w-1/3 bg-linear-to-r from-transparent via-[#58a6ff] to-transparent rounded-full animate-indeterminate" />
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-[#8b949e] font-mono">
                <span>
                  {formatBytes(downloadProgress?.downloadedBytes || 0)}
                  {downloadProgress?.totalBytes ? ` / ${formatBytes(downloadProgress.totalBytes)}` : ' streamed'}
                </span>
                <span>
                  {percent !== undefined ? `${percent.toFixed(1)}%` : 'Streaming...'}
                </span>
              </div>
            </div>

            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[11px] text-[#8b949e] flex items-start gap-2">
              <HardDrive className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white font-medium">Memory Safe O(1) Streaming:</strong> Feed data streams directly to local disk without accumulating in browser RAM. Instant inspection slice is extracted on completion.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onCancelDownload}
                className="px-3.5 py-1.5 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs transition-colors"
              >
                Cancel Stream
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
            {downloadError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-[11px]">
                  <strong className="block font-semibold">Download Failed:</strong>
                  {downloadError}
                </div>
              </div>
            )}

            <div>
              <label className="block text-white font-medium mb-1">
                Feed URL (HTTP / HTTPS)
              </label>
              <input
                type="url"
                required
                placeholder="https://example.com/job-feed.xml.gz"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-white font-mono placeholder-[#484f58] outline-none focus:border-[#58a6ff]"
              />
              <span className="text-[11px] text-[#8b949e] mt-1 block">
                Directly streamed to disk by Rust backend. Never loaded entirely into browser RAM.
              </span>
            </div>

            {/* Authentication Extensibility */}
            <div className="pt-2 border-t border-[#30363d]">
              <label className="block text-white font-medium mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Authentication (Optional)</span>
              </label>
              <div className="flex items-center space-x-2 mb-3">
                {(['none', 'bearer', 'basic', 'apikey'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAuthType(type)}
                    className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                      authType === type
                        ? 'bg-[#1f6feb] text-white font-medium'
                        : 'bg-[#0d1117] text-[#8b949e] border border-[#30363d] hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {authType === 'bearer' && (
                <input
                  type="password"
                  placeholder="Bearer Token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-[#0d1117] border border-[#30363d] text-white font-mono placeholder-[#484f58] outline-none focus:border-[#58a6ff]"
                />
              )}

              {authType === 'basic' && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="px-3 py-1.5 rounded bg-[#0d1117] border border-[#30363d] text-white outline-none focus:border-[#58a6ff]"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="px-3 py-1.5 rounded bg-[#0d1117] border border-[#30363d] text-white outline-none focus:border-[#58a6ff]"
                  />
                </div>
              )}

              {authType === 'apikey' && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Header Name (e.g. X-API-Key)"
                    value={headerName}
                    onChange={(e) => setHeaderName(e.target.value)}
                    className="px-3 py-1.5 rounded bg-[#0d1117] border border-[#30363d] text-white outline-none focus:border-[#58a6ff]"
                  />
                  <input
                    type="password"
                    placeholder="Key Value"
                    value={headerValue}
                    onChange={(e) => setHeaderValue(e.target.value)}
                    className="px-3 py-1.5 rounded bg-[#0d1117] border border-[#30363d] text-white outline-none focus:border-[#58a6ff]"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-[#30363d] flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[#1f6feb] hover:bg-[#388bfd] text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Stream Feed</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
