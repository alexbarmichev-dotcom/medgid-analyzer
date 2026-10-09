import { compressImage } from '@/components/site/start-flow/fileHelpers';

export const ANALYZE_URL = 'https://functions.poehali.dev/b4dfdccf-8880-4501-b296-550516223859';

export const MAX_FILES = 12;
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
const CHUNK_BYTES = 1.5 * 1024 * 1024;

export const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
];

export const LIMIT_TEXT = `Не больше ${MAX_FILES} файлов общим объёмом до 50 МБ`;

export const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} МБ`;
};

export const totalSize = (files: File[]) => files.reduce((sum, f) => sum + f.size, 0);

const guessType = (file: File) => {
  if (file.type) return file.type.toLowerCase();
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'heic') return 'image/heic';
  if (ext === 'heif') return 'image/heif';
  if (ext === 'pdf') return 'application/pdf';
  return '';
};

export const isAllowedFile = (file: File) => ALLOWED_TYPES.includes(guessType(file));

export class UploadFailed extends Error {
  reupload: boolean;
  constructor(message: string, reupload = false) {
    super(message);
    this.reupload = reupload;
  }
}

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const post = async (action: string, token: string, body: unknown) => {
  const res = await fetch(`${ANALYZE_URL}?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Authorization': token },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
};

export const abortUpload = (token: string, sessionId: string, reason?: string, notify = false) =>
  post('upload_abort', token, { sessionId, reason, notify }).catch(() => undefined);

export const fetchResume = async (sessionId: string) => {
  const { ok, data } = await post('resume', '', { sessionId });
  return ok ? (data as UploadProfile & { age: number | null }) : null;
};

export interface UploadProfile {
  gender: string;
  age: string;
  complaints: string;
  conditions: string;
  meds: string;
  email: string;
}

export const uploadFiles = async (
  token: string,
  files: File[],
  profile: UploadProfile,
  onProgress: (percent: number, fileIndex: number) => void,
  resumeOf?: string | null,
): Promise<string> => {
  onProgress(0, 0);
  const prepared = await Promise.all(files.map(compressImage));
  const types = prepared.map((f, i) => guessType(f) || guessType(files[i]));

  const start = await post('upload_start', token, {
    ...profile,
    siteUrl: window.location.origin,
    resumeOf: resumeOf || undefined,
    files: prepared.map((f, i) => ({ name: f.name, type: types[i], size: f.size })),
  });
  if (!start.ok) {
    throw new UploadFailed(start.data.error || 'Не удалось начать загрузку');
  }
  const sessionId: string = start.data.sessionId;
  const total = prepared.reduce((s, f) => s + f.size, 0) || 1;
  let sent = 0;

  try {
    for (let i = 0; i < prepared.length; i++) {
      const file = prepared[i];
      const chunks = Math.max(1, Math.ceil(file.size / CHUNK_BYTES));
      for (let c = 0; c < chunks; c++) {
        const part = file.slice(c * CHUNK_BYTES, Math.min(file.size, (c + 1) * CHUNK_BYTES));
        const data = await blobToBase64(part);
        const res = await post('upload_chunk', token, {
          sessionId,
          fileIndex: i,
          chunkIndex: c,
          totalChunks: chunks,
          name: file.name,
          type: types[i],
          data,
        });
        if (!res.ok) {
          throw new UploadFailed(
            res.data.error || 'Не удалось загрузить файл. Загруженные файлы удалены',
            true,
          );
        }
        sent += part.size;
        onProgress(Math.min(100, Math.round((sent / total) * 100)), i);
      }
    }
  } catch (e) {
    await abortUpload(token, sessionId, 'Загрузка прервалась — файлы удалены', true);
    if (e instanceof UploadFailed) throw e;
    throw new UploadFailed('Связь прервалась. Загруженные файлы удалены — повторите загрузку', true);
  }

  return sessionId;
};
