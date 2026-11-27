export function formatRupiah(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}

export function formatDateTime(isoOrLocal: string): string {
  const date = new Date(isoOrLocal);
  if (Number.isNaN(date.getTime())) return isoOrLocal;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatCompactDateTime(isoOrLocal: string): string {
  const date = new Date(isoOrLocal);
  if (Number.isNaN(date.getTime())) return isoOrLocal;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatDate(isoOrYmd: string): string {
  const date = new Date(isoOrYmd);
  if (Number.isNaN(date.getTime())) return isoOrYmd;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function getTodayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getCompanyInitials(company: string): string {
  const words = company
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return 'AM';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}
