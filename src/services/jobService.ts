import type { JobListing } from '../types/job';

const REMOTIVE_API_URL =
  'https://remotive.com/api/remote-jobs?category=software-dev&limit=30';
const FALLBACK_URL = '/magang-fallback.json';

interface RemotiveResponse {
  jobs?: unknown;
}

function sanitizeJob(raw: unknown): JobListing | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const item = raw as Record<string, unknown>;
  if (
    typeof item.id !== 'number' ||
    typeof item.title !== 'string' ||
    typeof item.company_name !== 'string'
  ) {
    return null;
  }

  const rawTags = Array.isArray(item.tags) ? item.tags : [];
  const seenTags = new Set<string>();
  const tags: string[] = [];
  for (const tag of rawTags) {
    if (typeof tag !== 'string') continue;
    const trimmed = tag.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (seenTags.has(lower)) continue;
    seenTags.add(lower);
    tags.push(trimmed);
  }

  return {
    id: item.id,
    title: item.title.trim(),
    company_name: item.company_name.trim(),
    category:
      typeof item.category === 'string' && item.category.trim()
        ? item.category.trim()
        : 'Software Development',
    candidate_required_location:
      typeof item.candidate_required_location === 'string' &&
      item.candidate_required_location.trim()
        ? item.candidate_required_location.trim()
        : 'Remote',
    salary:
      typeof item.salary === 'string' && item.salary.trim()
        ? item.salary.trim()
        : 'Gaji tidak dicantumkan',
    tags,
  };
}

export async function fetchRemoteJobs(signal?: AbortSignal): Promise<JobListing[]> {
  const response = await fetch(REMOTIVE_API_URL, { signal });

  if (!response.ok) {
    throw new Error(`Remotive API merespons HTTP ${response.status}.`);
  }

  const data = (await response.json()) as RemotiveResponse;
  if (!Array.isArray(data.jobs)) {
    throw new Error('Format respons Remotive API tidak valid.');
  }

  return data.jobs
    .map(sanitizeJob)
    .filter((job): job is JobListing => job !== null);
}

export async function fetchFallbackJobs(signal?: AbortSignal): Promise<JobListing[]> {
  const response = await fetch(FALLBACK_URL, { signal });

  if (!response.ok) {
    throw new Error('Gagal memuat dataset fallback lokal.');
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Format dataset fallback lokal tidak valid.');
  }

  return data
    .map(sanitizeJob)
    .filter((job): job is JobListing => job !== null);
}
