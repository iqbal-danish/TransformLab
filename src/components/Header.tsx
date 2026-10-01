import { 
  Play, 
  Settings, 
  Command, 
  Sliders, 
  Zap, 
  Layers,
  Palette
} from 'lucide-react';
import type { TransformType } from '../types';
import type { EditorTheme } from '../utils/monacoThemes';
import appLogo from '../assets/logo.png';

interface HeaderProps {
  transformType: TransformType;
  onTransformTypeChange: (type: TransformType) => void;
  onRunTransform: () => void;
  isRunning: boolean;
  onCancel: () => void;
  parameterCount: number;
  onOpenParameters: () => void;
  onOpenCommandPalette: () => void;
  editorTheme: EditorTheme;
  onThemeChange: (theme: EditorTheme) => void;
}

export const Header: React.FC<HeaderProps> = ({
  transformType,
  onTransformTypeChange,
  onRunTransform,
  isRunning,
  onCancel,
  parameterCount,
  onOpenParameters,
  onOpenCommandPalette,
  editorTheme,
  onThemeChange,
}) => {
  return (
    <header className="h-14 border-b border-[#30363d] bg-[#161b22] px-4 flex items-center justify-between select-none">
      {/* Brand & Project Info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <img 
            src={appLogo} 
            alt="TransformLab Logo" 
            className="w-8 h-8 rounded-lg shadow-md object-contain"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white tracking-tight text-sm">TransformLab</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d]">
                v0.1.0
              </span>
            </div>
            <span className="text-[11px] text-[#8b949e] flex items-center gap-1">
              Feed Transformation Studio
            </span>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-[#30363d] mx-2" />

        {/* Engine / Pipeline Selector */}
        <div className="flex items-center space-x-2 bg-[#0d1117] p-1 rounded-md border border-[#30363d]">
          <button
            onClick={() => onTransformTypeChange('xslt')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
              transformType === 'xslt'
                ? 'bg-[#238636] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>XML + XSLT 3.0</span>
          </button>
          <button
            onClick={() => onTransformTypeChange('jolt')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
              transformType === 'jolt'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>JSON + JOLT</span>
          </button>
        </div>
      </div>

      {/* Middle Run Controls */}
      <div className="flex items-center space-x-3">
        {isRunning ? (
          <button
            onClick={onCancel}
            className="px-4 py-1.5 bg-[#da3633] hover:bg-[#b62324] text-white text-xs font-semibold rounded-md shadow-sm transition-all flex items-center gap-1.5 animate-pulse"
          >
            <span className="w-2 h-2 rounded-full bg-white" />
            <span>Cancel</span>
          </button>
        ) : (
          <button
            onClick={onRunTransform}
            className="px-4 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-md shadow-sm transition-all flex items-center gap-2"
            title="Ctrl + Enter"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>TRANSFORM</span>
            <kbd className="hidden sm:inline-block bg-[#1f6f2c] px-1.5 py-0.5 text-[10px] rounded font-mono border border-green-700/50">
              ^↵
            </kbd>
          </button>
        )}
      </div>

      {/* Right Action Tools: Parameters, Palette, Settings */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenParameters}
          className={`px-2.5 py-1.5 rounded-md border text-xs flex items-center gap-1.5 transition-colors ${
            parameterCount > 0
              ? 'border-[#58a6ff] text-[#58a6ff] bg-[#58a6ff]/10'
              : 'border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'
          }`}
          title="Transformation Parameters"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Params</span>
          {parameterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#1f6feb] text-white text-[10px] font-bold flex items-center justify-center">
              {parameterCount}
            </span>
          )}
        </button>

        <div className="flex items-center space-x-1.5 bg-[#0d1117] border border-[#30363d] rounded-md px-2 py-1 text-xs">
          <Palette className="w-3.5 h-3.5 text-[#58a6ff]" />
          <select
            value={editorTheme}
            onChange={(e) => onThemeChange(e.target.value as EditorTheme)}
            className="bg-transparent text-xs text-white outline-none cursor-pointer"
            title="Editor Syntax Color Theme"
          >
            <option value="one-dark-pro" className="bg-[#161b22] text-white">One Dark Pro</option>
            <option value="github-dark-pro" className="bg-[#161b22] text-white">GitHub Dark Pro</option>
            <option value="dracula-cyber" className="bg-[#161b22] text-white">Dracula Cyber</option>
            <option value="nord-frost" className="bg-[#161b22] text-white">Nord Frost</option>
            <option value="vs-dark" className="bg-[#161b22] text-white">VS Code Classic</option>
          </select>
        </div>

        <button
          onClick={onOpenCommandPalette}
          className="p-1.5 rounded-md border border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] transition-colors"
          title="Command Palette (Ctrl+P)"
        >
          <Command className="w-4 h-4" />
        </button>

        <button
          className="p-1.5 rounded-md border border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
