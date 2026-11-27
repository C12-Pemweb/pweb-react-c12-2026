export interface CvDocument {
  id: string;
  name: string;
  label: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  isDefault: boolean;
  dataUrl?: string;
}
