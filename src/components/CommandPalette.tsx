import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';


export interface CommandItem {
  id: string;
  title: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-start justify-center z-50 pt-[15vh] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl w-full max-w-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="h-12 border-b border-[#30363d] px-3 flex items-center space-x-2 bg-[#0d1117]">
          <Search className="w-4 h-4 text-[#8b949e]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white text-xs outline-none placeholder-[#484f58]"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d] text-[10px] font-mono">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#8b949e]">
              No matching commands.
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <div
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between px-3 py-2 rounded text-xs cursor-pointer transition-colors ${
                  idx === selectedIndex
                    ? 'bg-[#1f6feb] text-white'
                    : 'text-[#c9d1d9] hover:bg-[#21262d]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className={idx === selectedIndex ? 'text-white' : 'text-[#8b949e]'}>
                    {cmd.icon}
                  </div>
                  <span>{cmd.title}</span>
                </div>
                {cmd.shortcut && (
                  <kbd className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    idx === selectedIndex 
                      ? 'bg-blue-700/60 text-white' 
                      : 'bg-[#21262d] text-[#8b949e] border border-[#30363d]'
                  }`}>
                    {cmd.shortcut}
                  </kbd>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
