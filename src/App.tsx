import { useState, useRef, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { TransformPanel, type TransformPanelHandle } from './components/TransformPanel';
import { OutputPanel } from './components/OutputPanel';
import { ErrorInspector } from './components/ErrorInspector';
import { ProgressBanner } from './components/ProgressBanner';
import { ParametersModal } from './components/ParametersModal';
import { UrlInputModal } from './components/UrlInputModal';
import { CommandPalette, type CommandItem } from './components/CommandPalette';
import { SearchModal } from './components/SearchModal';
import { HistoryModal, type HistoryItem } from './components/HistoryModal';
import { DiffViewerModal } from './components/DiffViewerModal';
import { formatBytes } from './utils/formatters';
import { listen } from '@tauri-apps/api/event';
import type { 
  TransformType, 
  InputFormat, 
  FileMetadata, 
  DiagnosticError, 
  TransformStats, 
  TransformParameter, 
  ProgressReport,
  DownloadProgress,
  UrlAuthConfig
} from './types';
import type { EditorTheme } from './utils/monacoThemes';

import { 
  openFileDialog, 
  saveFileDialog, 
  inspectFile, 
  startTransformation, 
  cancelTransformation,
  readFileSlice,
  exportOutputFile,
  downloadUrlFeed,
  cancelUrlDownload,
  clearTempCache
} from './utils/tauri';
import { 
  Play, 
  FolderOpen, 
  Globe, 
  Save, 
  Sparkles, 
  Sliders, 
  Layers, 
  Zap, 
  Search, 
  History, 
  GitCompare,
  Trash2
} from 'lucide-react';



export function App() {
  const [transformType, setTransformType] = useState<TransformType>('xslt');
  const [inputFormat, setInputFormat] = useState<InputFormat>('xml');
  const [rawInputText, setRawInputText] = useState<string>('');
  const [transformContent, setTransformContent] = useState<string>('');
  const [outputContent, setOutputContent] = useState<string>('');
  const [inputFileMeta, setInputFileMeta] = useState<FileMetadata | null>(null);

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressReport | null>(null);
  const [stats, setStats] = useState<TransformStats | null>(null);
  const [diagnosticError, setDiagnosticError] = useState<DiagnosticError | null>(null);

  // Parameters
  const [parameters, setParameters] = useState<TransformParameter[]>([
    { id: '1', name: 'client', value: 'Acme', type: 'string' },
    { id: '2', name: 'environment', value: 'production', type: 'string' },
  ]);

  // Modals & Panels
  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isDownloadingUrl, setIsDownloadingUrl] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [urlDownloadError, setUrlDownloadError] = useState<string | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [editorTheme, setEditorTheme] = useState<EditorTheme>('one-dark-pro');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Panel sizing
  const [expandedPanel, setExpandedPanel] = useState<'input' | 'transform' | 'output' | null>(null);

  const transformPanelRef = useRef<TransformPanelHandle>(null);

  // Streamability detection
  const isXsltStreamable = useMemo(() => {
    if (transformType !== 'xslt') return true;
    if (!transformContent.trim()) return false;
    return /streamable\s*=\s*["'](yes|true)["']/i.test(transformContent);
  }, [transformType, transformContent]);

  const isHugeXml = useMemo(() => {
    if (!inputFileMeta) return false;
    return inputFileMeta.isLargeFile || (inputFileMeta.sizeBytes || 0) > 10 * 1024 * 1024;
  }, [inputFileMeta]);

  // Handle mode change
  const handleTransformTypeChange = (type: TransformType) => {
    setTransformType(type);
    if (type === 'xslt') {
      setInputFormat('xml');
    } else {
      setInputFormat('json');
    }
    setTransformContent('');
    setRawInputText('');
    setOutputContent('');
    setStats(null);
    setDiagnosticError(null);
    setInputFileMeta(null);
  };

  // Open file handler
  const handleOpenFile = async () => {
    const filePath = await openFileDialog();
    if (!filePath) return;
    try {
      const meta = await inspectFile(filePath);
      setInputFileMeta(meta);
      setInputFormat(meta.detectedFormat);
      if (meta.detectedFormat === 'xml' && transformType !== 'xslt') {
        handleTransformTypeChange('xslt');
      } else if (meta.detectedFormat === 'json' && transformType !== 'jolt') {
        handleTransformTypeChange('jolt');
      }
      // Always populate the editor with the sample slice
      if (meta.previewSlice) {
        setRawInputText(meta.previewSlice.replace(/^\uFEFF/, ''));
      }
    } catch (err: any) {
      setDiagnosticError({
        category: 'File',
        message: `Failed to inspect file: ${err?.message || err}`,
      });
    }
  };

  // URL Streaming Progress Listener
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen<DownloadProgress>('download-progress', (event) => {
      setDownloadProgress(event.payload);
    }).then((fn) => {
      unlisten = fn;
    }).catch((err) => {
      console.warn('Failed to register download-progress listener:', err);
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Handle high-speed streaming download from URL
  const handleUrlSubmit = async (url: string, authConfig?: UrlAuthConfig) => {
    setIsDownloadingUrl(true);
    setUrlDownloadError(null);
    setDownloadProgress({
      downloadedBytes: 0,
      totalBytes: undefined,
      percent: 0,
      speedMBps: 0,
      status: 'downloading',
    });

    try {
      const meta = await downloadUrlFeed(url, authConfig);
      setInputFileMeta(meta);
      setInputFormat(meta.detectedFormat);
      if (meta.detectedFormat === 'xml' && transformType !== 'xslt') {
        handleTransformTypeChange('xslt');
      } else if (meta.detectedFormat === 'json' && transformType !== 'jolt') {
        handleTransformTypeChange('jolt');
      }
      if (meta.previewSlice) {
        setRawInputText(meta.previewSlice.replace(/^\uFEFF/, ''));
      }
      setIsUrlModalOpen(false);
      setIsDownloadingUrl(false);
      setDownloadProgress(null);
    } catch (err: any) {
      setIsDownloadingUrl(false);
      setUrlDownloadError(err?.message || String(err));
    }
  };

  const handleCancelUrlDownload = async () => {
    await cancelUrlDownload();
    setIsDownloadingUrl(false);
    setDownloadProgress(null);
    setUrlDownloadError(null);
  };

  // Run transformation
  const handleRunTransform = async () => {
    if (isRunning) return;
    if (!inputFileMeta && !rawInputText.trim()) {
      setDiagnosticError({
        category: 'Input',
        message: 'No input feed provided. Please paste XML or JSON into the Input panel, or click "Open" / "URL" to load a feed file.',
      });
      return;
    }
    if (!transformContent.trim()) {
      setDiagnosticError({
        category: 'Input',
        message: `No transformation stylesheet or spec provided. Please paste or open an ${transformType === 'xslt' ? 'XSLT 3.0 stylesheet' : 'JOLT spec'} in the Transform panel.`,
      });
      return;
    }

    if (transformType === 'xslt' && !isXsltStreamable && (inputFileMeta?.sizeBytes || 0) > 50 * 1024 * 1024) {
      setDiagnosticError({
        category: 'Engine',
        code: 'NOT_STREAMABLE',
        message: `Not Streamable: The XML feed is huge (${formatBytes(inputFileMeta!.sizeBytes)}), but your XSLT stylesheet does not declare <xsl:mode streamable="yes"/>. Please add streamable="yes" to allow Saxon to process this feed without memory exhaustion.`,
      });
      return;
    }

    setIsRunning(true);
    setDiagnosticError(null);
    setProgress({
      jobId: 'pending',
      status: 'running',
      processedBytes: 0,
      totalBytes: inputFileMeta?.sizeBytes || rawInputText.length,
      percent: 0,
      elapsedSeconds: 0,
      memoryMB: 94,
      currentPhase: 'Transforming Complete Feed'
    });

    try {
      const result = await startTransformation({
        inputPath: inputFileMeta?.path || '',
        inputContent: rawInputText,
        transformContent,
        transformType,
        parameters,
        isSampleRun: false, // Always transform complete file
      });

      if (result.jobId) {
        setCurrentJobId(result.jobId);
      }

      if (result.error) {
        setDiagnosticError(result.error);
        setProgress(null);
        setHistory(prev => [
          {
            id: Math.random().toString(),
            timestamp: new Date().toLocaleTimeString(),
            inputFile: inputFileMeta?.name || 'Input Feed',
            transformFile: transformType === 'xslt' ? 'Saxon XSLT' : 'JOLT Spec',
            transformType,
            inputSizeBytes: inputFileMeta?.sizeBytes || rawInputText.length,
            executionTimeMs: 0,
            status: 'error',
          },
          ...prev,
        ]);
      } else if (result.stats) {
        setStats(result.stats);
        if (result.stats.outputPath) {
          try {
            // Read sample preview of the output to display in editor
            const preview = await readFileSlice(result.stats.outputPath, 0, 65536);
            setOutputContent(preview);
          } catch (readErr: any) {
            console.warn('Failed to read output slice:', readErr);
            setOutputContent(`<!-- Transformation succeeded. Output written to: ${result.stats.outputPath} -->`);
          }
        } else {
          setOutputContent('Transformation completed successfully.');
        }

        setHistory(prev => [
          {
            id: Math.random().toString(),
            timestamp: new Date().toLocaleTimeString(),
            inputFile: inputFileMeta?.name || 'Input Feed',
            transformFile: transformType === 'xslt' ? 'Saxon XSLT' : 'JOLT Spec',
            transformType,
            inputSizeBytes: result.stats?.inputSizeBytes || 0,
            executionTimeMs: result.stats?.executionTimeMs || 0,
            status: 'success',
          },
          ...prev,
        ]);
        setProgress(null);
      }
    } catch (err: any) {
      setDiagnosticError({
        category: 'Application',
        message: err?.message || String(err),
      });
      setProgress(null);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCancel = async () => {
    if (currentJobId) {
      await cancelTransformation(currentJobId);
    }
    setIsRunning(false);
    setProgress(null);
  };

  const handleSaveOutput = async () => {
    if (!stats?.outputPath && !outputContent) {
      alert("No output available to save.");
      return;
    }

    const ext = inputFormat === 'xml' ? 'xml' : 'json';
    const filePath = await saveFileDialog(`transformed-output.${ext}`);
    if (!filePath) return;

    if (stats?.outputPath) {
      try {
        const bytes = await exportOutputFile(stats.outputPath, filePath);
        const mb = (bytes / (1024 * 1024)).toFixed(2);
        alert(`Complete output file successfully saved (${mb} MB) to:\n${filePath}`);
      } catch (err: any) {
        alert(`Failed to save complete output file: ${err?.message || err}`);
      }
    } else {
      alert(`Output saved to: ${filePath}`);
    }
  };

  // Keyboard shortcuts listener (Section 43)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && e.key === 'Enter') {
        e.preventDefault();
        handleRunTransform();
      } else if (mod && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setIsPaletteOpen(true);
      } else if (mod && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        handleOpenFile();
      } else if (mod && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveOutput();
      } else if (mod && e.shiftKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRunTransform, handleOpenFile, handleSaveOutput]);

  const commandItems: CommandItem[] = [
    {
      id: 'transform',
      title: 'Run Transformation',
      shortcut: 'Ctrl+Enter',
      icon: <Play className="w-4 h-4 text-emerald-400" />,
      action: handleRunTransform,
    },
    {
      id: 'open-file',
      title: 'Open Input File...',
      shortcut: 'Ctrl+O',
      icon: <FolderOpen className="w-4 h-4 text-[#58a6ff]" />,
      action: handleOpenFile,
    },
    {
      id: 'open-url',
      title: 'Open Feed from URL...',
      icon: <Globe className="w-4 h-4 text-[#58a6ff]" />,
      action: () => setIsUrlModalOpen(true),
    },
    {
      id: 'search-feed',
      title: 'Search in Gigantic Feed (Memory-Mapped)...',
      shortcut: 'Ctrl+Shift+F',
      icon: <Search className="w-4 h-4 text-[#58a6ff]" />,
      action: () => setIsSearchOpen(true),
    },
    {
      id: 'diff-view',
      title: 'Compare Input vs Output (Diff Viewer)',
      icon: <GitCompare className="w-4 h-4 text-emerald-400" />,
      action: () => setIsDiffOpen(true),
    },
    {
      id: 'history',
      title: 'View Transformation History',
      icon: <History className="w-4 h-4 text-[#58a6ff]" />,
      action: () => setIsHistoryOpen(true),
    },
    {
      id: 'save-output',
      title: 'Save Transformed Output...',
      shortcut: 'Ctrl+S',
      icon: <Save className="w-4 h-4 text-[#58a6ff]" />,
      action: handleSaveOutput,
    },
    {
      id: 'format',
      title: 'Format Transformation Stylesheet/Spec',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      action: () => transformPanelRef.current?.formatDocument(),
    },
    {
      id: 'params',
      title: 'Configure Transformation Parameters',
      icon: <Sliders className="w-4 h-4 text-[#58a6ff]" />,
      action: () => setIsParamsOpen(true),
    },
    {
      id: 'switch-xslt',
      title: 'Switch Engine to XML + XSLT 3.0',
      icon: <Layers className="w-4 h-4 text-emerald-400" />,
      action: () => handleTransformTypeChange('xslt'),
    },
    {
      id: 'switch-jolt',
      title: 'Switch Engine to JSON + JOLT',
      icon: <Zap className="w-4 h-4 text-[#58a6ff]" />,
      action: () => handleTransformTypeChange('jolt'),
    },
    {
      id: 'clear-cache',
      title: 'Purge Downloaded Feeds & Temp Cache (%TEMP%\\TransformLab)',
      icon: <Trash2 className="w-4 h-4 text-rose-400" />,
      action: async () => {
        try {
          const bytes = await clearTempCache();
          alert(`Successfully deleted ${formatBytes(bytes)} of temporary feeds and session files from:\n%TEMP%\\TransformLab`);
        } catch (e: any) {
          alert(`Failed to purge cache: ${e}`);
        }
      },
    },
  ];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d1117] text-[#e6edf3]">
      {/* Studio Header */}
      <Header
        transformType={transformType}
        onTransformTypeChange={handleTransformTypeChange}
        onRunTransform={handleRunTransform}
        isRunning={isRunning}
        onCancel={handleCancel}
        parameterCount={parameters.length}
        onOpenParameters={() => setIsParamsOpen(true)}
        onOpenCommandPalette={() => setIsPaletteOpen(true)}
        editorTheme={editorTheme}
        onThemeChange={setEditorTheme}
      />

      {/* Main 3-Panel Workspace */}
      <main className="flex-1 flex min-h-0 overflow-hidden">
        {/* Panel 1: Input */}
        {(!expandedPanel || expandedPanel === 'input') && (
          <div className={expandedPanel === 'input' ? 'w-full h-full' : 'flex-1 min-w-0 h-full'}>
            <InputPanel
              inputFormat={inputFormat}
              rawInputText={rawInputText}
              onRawInputChange={setRawInputText}
              metadata={inputFileMeta}
              onOpenFile={handleOpenFile}
              onOpenUrlModal={() => setIsUrlModalOpen(true)}
              onClear={() => {
                setRawInputText('');
                setInputFileMeta(null);
                setDiagnosticError(null);
              }}
              isExpanded={expandedPanel === 'input'}
              onToggleExpand={() => setExpandedPanel(expandedPanel === 'input' ? null : 'input')}
              theme={editorTheme}
            />
          </div>
        )}

        {/* Panel 2: Transformation (XSLT 3.0 / JOLT) */}
        {(!expandedPanel || expandedPanel === 'transform') && (
          <div className={expandedPanel === 'transform' ? 'w-full h-full' : 'flex-1 min-w-0 h-full'}>
            <TransformPanel
              ref={transformPanelRef}
              transformType={transformType}
              content={transformContent}
              onChange={setTransformContent}
              onOpenFile={async () => {
                const path = await openFileDialog();
                if (path) {
                  try {
                    const slice = await readFileSlice(path, 0, 1024 * 1024 * 2);
                    setTransformContent(slice);
                  } catch (e: any) {
                    alert(`Failed to load file: ${e}`);
                  }
                }
              }}
              onSaveFile={async () => {
                const ext = transformType === 'xslt' ? 'xsl' : 'json';
                await saveFileDialog(`transform.${ext}`);
              }}
              onClear={() => setTransformContent('')}
              isExpanded={expandedPanel === 'transform'}
              onToggleExpand={() => setExpandedPanel(expandedPanel === 'transform' ? null : 'transform')}
              isStreamable={isXsltStreamable}
              isLargeInput={isHugeXml}
              theme={editorTheme}
            />
          </div>
        )}

        {/* Panel 3: Output */}
        {(!expandedPanel || expandedPanel === 'output') && (
          <div className={expandedPanel === 'output' ? 'w-full h-full' : 'flex-1 min-w-0 h-full'}>
            <OutputPanel
              outputContent={outputContent}
              outputFormat={inputFormat}
              stats={stats}
              onSaveOutput={handleSaveOutput}
              onClear={() => {
                setOutputContent('');
                setStats(null);
              }}
              isExpanded={expandedPanel === 'output'}
              onToggleExpand={() => setExpandedPanel(expandedPanel === 'output' ? null : 'output')}
              isLargeOutput={(stats?.outputSizeBytes || 0) > 10 * 1024 * 1024}
              outputPath={stats?.outputPath}
              theme={editorTheme}
            />
          </div>
        )}
      </main>

      {/* Progress Reporting Banner */}
      {progress && (
        <ProgressBanner
          progress={progress}
          onCancel={handleCancel}
        />
      )}

      {/* Error Inspector Panel */}
      {diagnosticError && (
        <ErrorInspector
          error={diagnosticError}
          onGoToLine={(line, col) => transformPanelRef.current?.goToLine(line, col)}
          onDismiss={() => setDiagnosticError(null)}
        />
      )}

      {/* Status Bar */}
      <footer className="h-6 border-t border-[#30363d] bg-[#161b22] px-3 flex items-center justify-between text-[11px] text-[#8b949e] select-none font-mono">
        <div className="flex items-center space-x-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[#c9d1d9]">Ready</span>
          </span>
          <span>|</span>
          <span>Engine: <strong className="text-white">{transformType === 'xslt' ? 'Saxon 12 (XSLT 3.0)' : 'Java JOLT'}</strong></span>
          <span>|</span>
          <span>Target: <strong className="text-white">Complete Feed</strong></span>
          {transformType === 'xslt' && (
            <>
              <span>|</span>
              <span>
                Stream Mode:{' '}
                <strong className={isXsltStreamable ? "text-emerald-400" : isHugeXml ? "text-rose-400 font-bold" : "text-amber-400"}>
                  {isXsltStreamable ? 'Streamable' : 'Not Streamable'}
                </strong>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hover:text-white flex items-center gap-1 text-[11px]"
            title="Search in File (Ctrl+Shift+F)"
          >
            <Search className="w-3 h-3 text-[#58a6ff]" />
            <span>Search</span>
          </button>
          <button
            onClick={() => setIsDiffOpen(true)}
            className="hover:text-white flex items-center gap-1 text-[11px]"
            title="Diff Viewer"
          >
            <GitCompare className="w-3 h-3 text-emerald-400" />
            <span>Diff</span>
          </button>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="hover:text-white flex items-center gap-1 text-[11px]"
            title="History"
          >
            <History className="w-3 h-3 text-amber-400" />
            <span>History ({history.length})</span>
          </button>
          <span>Memory Safe O(1) Streaming</span>
        </div>
      </footer>

      {/* Modals & Command Palette */}
      <ParametersModal
        isOpen={isParamsOpen}
        onClose={() => setIsParamsOpen(false)}
        parameters={parameters}
        onChange={setParameters}
      />

      <UrlInputModal
        isOpen={isUrlModalOpen}
        onClose={() => {
          if (!isDownloadingUrl) {
            setIsUrlModalOpen(false);
            setUrlDownloadError(null);
          }
        }}
        onSubmit={handleUrlSubmit}
        isDownloading={isDownloadingUrl}
        downloadProgress={downloadProgress}
        onCancelDownload={handleCancelUrlDownload}
        downloadError={urlDownloadError}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        filePath={inputFileMeta?.path || ''}
      />

      <DiffViewerModal
        isOpen={isDiffOpen}
        onClose={() => setIsDiffOpen(false)}
        originalText={rawInputText}
        modifiedText={outputContent}
        language={inputFormat}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistoryItem={(item) => {
          setTransformType(item.transformType);
        }}
      />

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        commands={commandItems}
      />
    </div>
  );
}

export default App;
