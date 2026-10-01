import { X, Plus, Trash2, Sliders } from 'lucide-react';
import type { TransformParameter } from '../types';

interface ParametersModalProps {
  isOpen: boolean;
  onClose: () => void;
  parameters: TransformParameter[];
  onChange: (parameters: TransformParameter[]) => void;
}

export const ParametersModal: React.FC<ParametersModalProps> = ({
  isOpen,
  onClose,
  parameters,
  onChange,
}) => {
  if (!isOpen) return null;

  const handleAdd = () => {
    const newParam: TransformParameter = {
      id: Math.random().toString(36).substring(7),
      name: '',
      value: '',
      type: 'string',
    };
    onChange([...parameters, newParam]);
  };

  const handleUpdate = (id: string, field: keyof TransformParameter, value: any) => {
    onChange(
      parameters.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleRemove = (id: string) => {
    onChange(parameters.filter((p) => p.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="h-12 border-b border-[#30363d] px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white font-semibold text-sm">
            <Sliders className="w-4 h-4 text-[#58a6ff]" />
            <span>Transformation Parameters</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
          <p className="text-[#8b949e]">
            Parameters are passed into Saxon as top-level stylesheet parameters (<code className="text-amber-300">&lt;xsl:param&gt;</code>) or JOLT context variables.
          </p>

          {parameters.length === 0 ? (
            <div className="text-center py-8 text-[#8b949e] border border-dashed border-[#30363d] rounded-md">
              No parameters configured.
            </div>
          ) : (
            <div className="space-y-2">
              {parameters.map((param) => (
                <div key={param.id} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Parameter Name"
                    value={param.name}
                    onChange={(e) => handleUpdate(param.id, 'name', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded bg-[#0d1117] border border-[#30363d] text-white font-mono placeholder-[#484f58] outline-none focus:border-[#58a6ff]"
                  />
                  <select
                    value={param.type}
                    onChange={(e) => handleUpdate(param.id, 'type', e.target.value)}
                    className="px-2 py-1.5 rounded bg-[#0d1117] border border-[#30363d] text-[#8b949e] outline-none"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Value"
                    value={param.value}
                    onChange={(e) => handleUpdate(param.id, 'value', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded bg-[#0d1117] border border-[#30363d] text-white font-mono placeholder-[#484f58] outline-none focus:border-[#58a6ff]"
                  />
                  <button
                    onClick={() => handleRemove(param.id)}
                    className="p-1.5 rounded text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleAdd}
            className="w-full py-2 rounded border border-dashed border-[#30363d] hover:border-[#58a6ff] hover:text-[#58a6ff] text-[#8b949e] flex items-center justify-center gap-1.5 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Add Parameter</span>
          </button>
        </div>

        {/* Footer */}
        <div className="h-12 border-t border-[#30363d] px-4 bg-[#0d1117] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-medium text-xs shadow-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
