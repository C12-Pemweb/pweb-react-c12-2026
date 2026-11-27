import type { CvDocument } from '../types/cv';

export const MAX_INLINE_CV_BYTES = 1_500_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function deriveCvLabel(fileName: string): string {
  return fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim() || 'CV Kapten';
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Gagal membaca file CV.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file CV.'));
    reader.readAsDataURL(file);
  });
}

export async function createCvFromFile(
  file: File,
  isFirstCv: boolean,
): Promise<CvDocument> {
  let dataUrl: string | undefined;
  if (file.size <= MAX_INLINE_CV_BYTES) {
    try {
      dataUrl = await readFileAsDataUrl(file);
    } catch {
      dataUrl = undefined;
    }
  }

  return {
    id: crypto.randomUUID(),
    name: file.name.trim(),
    label: deriveCvLabel(file.name),
    fileSize: file.size,
    mimeType: file.type || 'application/pdf',
    uploadedAt: new Date().toISOString(),
    isDefault: isFirstCv,
    dataUrl,
  };
}

export function normalizeStoredCvs(raw: unknown): CvDocument[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isRecord)
    .filter(
      (item) =>
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.fileSize === 'number',
    )
    .map((item) => ({
      id: item.id as string,
      name: (item.name as string).trim(),
      label:
        typeof item.label === 'string' && item.label.trim()
          ? item.label.trim()
          : deriveCvLabel(item.name as string),
      fileSize: item.fileSize as number,
      mimeType:
        typeof item.mimeType === 'string' ? item.mimeType : 'application/pdf',
      uploadedAt:
        typeof item.uploadedAt === 'string'
          ? item.uploadedAt
          : new Date().toISOString(),
      isDefault: Boolean(item.isDefault),
      dataUrl: typeof item.dataUrl === 'string' ? item.dataUrl : undefined,
    }));
}
