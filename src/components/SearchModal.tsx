import { useState } from 'react';
import { Search, X, FileText, CornerDownRight } from 'lucide-react';

import { invoke } from '@tauri-apps/api/core';
import { isTauri, readFileSlice } from '../utils/tauri';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  filePath,
}) => {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [previewSnippet, setPreviewSnippet] = useState<{ offset: number; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !filePath) return;

    setIsSearching(true);
    setPreviewSnippet(null);
    try {
      if (isTauri()) {
        const results = await invoke<number[]>('search_file', { path: filePath, query: query.trim() });
        setMatches(results);
      } else {
        // Dev mock matches
        setMatches([183421892, 183892411, 249102844]);
      }
    } catch (err: any) {
      alert(`Search failed: ${err}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInspectOffset = async (offset: number) => {
    try {
      const slice = await readFileSlice(filePath, offset > 200 ? offset - 200 : 0, 800);
      setPreviewSnippet({ offset, text: slice });
    } catch (err: any) {
      alert(`Failed to load context: ${err}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="h-12 border-b border-[#30363d] px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white font-semibold text-sm">
            <Search className="w-4 h-4 text-[#58a6ff]" />
            <span>Search in Multi-GB File</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="p-4 border-b border-[#30363d] bg-[#0d1117] flex gap-2">
          <input
            type="text"
            placeholder="Search text or pattern (scanned via memory-mapped disk stream)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-3 py-2 rounded bg-[#161b22] border border-[#30363d] text-white text-xs font-mono outline-none focus:border-[#58a6ff]"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-semibold rounded transition-colors disabled:opacity-50"
          >
            {isSearching ? 'Scanning...' : 'Search'}
          </button>
        </form>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          <div className="text-[#8b949e] flex justify-between items-center text-[11px]">
            <span>Target: <strong className="text-white font-mono">{filePath || 'No file selected'}</strong></span>
            {matches.length > 0 && (
              <span className="text-emerald-400 font-medium">Found {matches.length} matches</span>
            )}
          </div>

          {matches.length === 0 ? (
            <div className="text-center py-10 text-[#8b949e]">
              Enter a search query to scan without loading into RAM.
            </div>
          ) : (
            <div className="space-y-2">
              {matches.map((offset, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] flex items-center justify-between hover:border-[#58a6ff] transition-colors"
                >
                  <div className="flex items-center space-x-2 font-mono text-[11px]">
                    <span className="text-[#8b949e]">Match #{idx + 1}</span>
                    <span className="text-white">Byte Offset: <strong className="text-[#58a6ff]">{offset.toLocaleString()}</strong></span>
                  </div>
                  <button
                    onClick={() => handleInspectOffset(offset)}
                    className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <span>Open Context</span>
                    <CornerDownRight className="w-3 h-3 text-[#58a6ff]" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Context Snippet Preview */}
          {previewSnippet && (
            <div className="mt-4 p-3 rounded bg-[#0d1117] border border-[#58a6ff]/40">
              <div className="text-[11px] text-[#58a6ff] font-mono mb-1 font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Context around byte offset {previewSnippet.offset.toLocaleString()}:</span>
              </div>
              <pre className="p-2 bg-[#161b22] text-[#c9d1d9] rounded text-[11px] font-mono overflow-x-auto whitespace-pre-wrap max-h-40 border border-[#30363d]">
                {previewSnippet.text}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
