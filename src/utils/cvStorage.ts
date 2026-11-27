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

export function dataUrlToBlobUrl(dataUrl: string): string | null {
  try {
    const [header, base64] = dataUrl.split(',');
    if (!header || !base64) return null;
    const mimeMatch = /data:([^;]+);base64/.exec(header);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  } catch {
    return null;
  }
}

function escapePdfText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/** Builds a minimal valid 1-page PDF data URL so demo CVs render live in preview. */
export function createSamplePdfDataUrl(title: string, lines: readonly string[]): string {
  const streamLines = [
    'BT',
    '/F1 18 Tf',
    '56 760 Td',
    `(${escapePdfText(title)}) Tj`,
    '/F1 11 Tf',
    '0 -26 Td',
    ...lines.flatMap((line) => [`(${escapePdfText(line)}) Tj`, '0 -18 Td']),
    'ET',
  ].join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${streamLines.length} >>\nstream\n${streamLines}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return `data:application/pdf;base64,${window.btoa(pdf)}`;
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
