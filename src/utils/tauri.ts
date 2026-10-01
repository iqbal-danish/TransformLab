import { invoke } from '@tauri-apps/api/core';
import type { FileMetadata, DiagnosticError, TransformStats, TransformParameter } from '../types';

export const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export async function openFileDialog(): Promise<string | null> {
  if (isTauri()) {
    return await invoke<string | null>('open_file_dialog');
  }
  return null;
}

export async function saveFileDialog(defaultName: string): Promise<string | null> {
  if (isTauri()) {
    return await invoke<string | null>('save_file_dialog', { defaultName });
  }
  return null;
}

export async function inspectFile(path: string): Promise<FileMetadata> {
  if (isTauri()) {
    return await invoke<FileMetadata>('inspect_file', { path });
  }
  // Mock metadata for browser dev
  return {
    path,
    name: path.split(/[/\\]/).pop() || path,
    sizeBytes: 1024 * 1024 * 4.2,
    container: path.endsWith('.gz') ? 'gzip' : path.endsWith('.zip') ? 'zip' : 'none',
    detectedFormat: path.includes('json') ? 'json' : 'xml',
    estimatedRecords: 4500,
    isLargeFile: false,
    previewSlice: '<feed>\n  <job id="101">\n    <title>Senior Software Engineer</title>\n  </job>\n</feed>'
  };
}

export async function readFileSlice(path: string, offset: number, length: number): Promise<string> {
  if (isTauri()) {
    return await invoke<string>('read_file_slice', { path, offset, length });
  }
  return `<!-- Slice from offset ${offset} to ${offset + length} -->\n<job id="sample">\n  <title>Sample Job</title>\n</job>`;
}

export async function startTransformation(payload: {
  inputPath: string;
  inputContent?: string;
  transformContent: string;
  transformType: 'xslt' | 'jolt';
  parameters: TransformParameter[];
  isSampleRun: boolean;
  sampleRecordCount?: number;
  outputCompression?: 'none' | 'gzip';
}): Promise<{ jobId: string; stats?: TransformStats; error?: DiagnosticError }> {
  if (isTauri()) {
    return await invoke('start_transformation', { payload });
  }
  return {
    jobId: 'mock-job-1',
    stats: {
      inputSizeBytes: 4200000,
      outputSizeBytes: 3800000,
      inputRecords: 1200,
      outputRecords: 1200,
      executionTimeMs: 450,
      averageSpeedMBps: 9.3,
      peakMemoryMB: 128,
      outputPath: 'mock-output.xml'
    }
  };
}

export async function cancelTransformation(jobId: string): Promise<boolean> {
  if (isTauri()) {
    return await invoke<boolean>('cancel_transformation', { jobId });
  }
  return true;
}

export async function exportOutputFile(sourcePath: string, destinationPath: string): Promise<number> {
  if (isTauri()) {
    return await invoke<number>('export_output_file', { sourcePath, destinationPath });
  }
  return 0;
}

export async function downloadUrlFeed(
  url: string,
  authConfig?: {
    type: 'none' | 'bearer' | 'basic' | 'apikey';
    token?: string;
    username?: string;
    password?: string;
    headerName?: string;
    headerValue?: string;
  }
): Promise<FileMetadata> {
  if (isTauri()) {
    return await invoke<FileMetadata>('download_url_feed', {
      url,
      authType: authConfig?.type,
      token: authConfig?.token,
      username: authConfig?.username,
      password: authConfig?.password,
      headerName: authConfig?.headerName,
      headerValue: authConfig?.headerValue,
    });
  }
  return {
    path: url,
    name: url.split('/').pop() || 'streamed_feed.xml',
    sizeBytes: 1024 * 1024 * 12.5,
    container: 'none',
    detectedFormat: 'xml',
    isLargeFile: true,
    previewSlice: '<feed>\n  <job id="101">\n    <title>Streamed Job</title>\n  </job>\n</feed>'
  };
}

export async function cancelUrlDownload(): Promise<boolean> {
  if (isTauri()) {
    return await invoke<boolean>('cancel_url_download');
  }
  return true;
}

export async function clearTempCache(): Promise<number> {
  if (isTauri()) {
    return await invoke<number>('clear_temp_cache');
  }
  return 0;
}

export async function getTempCachePath(): Promise<string> {
  if (isTauri()) {
    return await invoke<string>('get_temp_cache_path');
  }
  return 'C:\\Users\\AppData\\Local\\Temp\\TransformLab';
}


