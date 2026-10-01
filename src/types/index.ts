export type TransformType = 'xslt' | 'jolt';
export type InputFormat = 'xml' | 'json';
export type ContainerType = 'none' | 'gzip' | 'zip';

export interface FileMetadata {
  path: string;
  name: string;
  sizeBytes: number;
  uncompressedSizeBytes?: number;
  container: ContainerType;
  detectedFormat: InputFormat;
  estimatedRecords?: number;
  zipEntries?: ZipEntry[];
  selectedZipEntry?: string;
  previewSlice?: string;
  isLargeFile: boolean; // > 10MB
}

export interface ZipEntry {
  name: string;
  sizeBytes: number;
  compressedSizeBytes: number;
  detectedFormat?: InputFormat;
}

export interface TransformParameter {
  id: string;
  name: string;
  value: string;
  type: 'string' | 'number' | 'boolean';
}

export type ErrorSeverity = 'error' | 'warning' | 'info';
export type ErrorCategory = 'Engine' | 'Application' | 'Network' | 'File' | 'Archive' | 'Input';

export interface DiagnosticError {
  category: ErrorCategory;
  code?: string; // e.g. XTSE0010, XPTY0004, JoltException
  message: string;
  file?: string;
  line?: number;
  column?: number;
  contextSnippet?: string;
  nestedCause?: string;
  rawError?: string;
}

export interface TransformStats {
  inputSizeBytes: number;
  outputSizeBytes: number;
  inputRecords?: number;
  outputRecords?: number;
  recordsRemoved?: number;
  executionTimeMs: number;
  averageSpeedMBps: number;
  peakMemoryMB: number;
  outputPath?: string;
}

export interface ProgressReport {
  jobId: string;
  status: 'idle' | 'running' | 'completed' | 'cancelled' | 'failed';
  processedBytes: number;
  totalBytes?: number;
  percent?: number;
  processedRecords?: number;
  speedMBps?: number;
  elapsedSeconds: number;
  etaSeconds?: number;
  memoryMB: number;
  currentPhase: string;
}

export interface TransformLabProject {
  id: string;
  name: string;
  inputSource: {
    type: 'file' | 'url';
    pathOrUrl: string;
    zipEntry?: string;
  };
  transformType: TransformType;
  transformContent: string;
  transformPath?: string;
  parameters: TransformParameter[];
  outputSettings: {
    compression: 'none' | 'gzip';
    format: 'xml' | 'json' | 'auto';
  };
  updatedAt: string;
}

export interface DownloadProgress {
  downloadedBytes: number;
  totalBytes?: number;
  percent?: number;
  speedMBps: number;
  status: 'downloading' | 'completed' | 'error';
}

export interface UrlAuthConfig {
  type: 'none' | 'bearer' | 'basic' | 'apikey';
  token?: string;
  username?: string;
  password?: string;
  headerName?: string;
  headerValue?: string;
}

