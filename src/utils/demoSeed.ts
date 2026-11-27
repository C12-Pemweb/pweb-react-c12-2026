import type { Application } from '../types/application';
import type { CvDocument } from '../types/cv';
import { createSamplePdfDataUrl } from './cvStorage';
import { simulateBackdateDays } from './ghosting';

export const DEFAULT_KAPTEN_SKILLS: string[] = ['React', 'TypeScript', 'CSS'];

export const CHECKLIST_TEMPLATES: readonly string[] = [
  'Sesuaikan CV dengan tech stack lowongan',
  'Riset produk, budaya tim, dan engineering blog perusahaan',
  'Latihan soal teknis React Hooks, State, dan REST API',
  'Siapkan 3 pertanyaan balik untuk pewawancara',
];

function formatFutureLocalDateTime(baseMs: number, addDays: number, hour: number, minute: number): string {
  const d = new Date(baseMs + addDays * 24 * 60 * 60 * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function createDemoDataset(nowMs: number): {
  skills: string[];
  cvs: CvDocument[];
  applications: Application[];
} {
  const nowIso = new Date(nowMs).toISOString();
  const appliedDate = nowIso.slice(0, 10);
  const ghostedIso = simulateBackdateDays(nowIso, 16);

  const cvs: CvDocument[] = [
    {
      id: crypto.randomUUID(),
      name: 'Kapten-CV-Frontend-v2.pdf',
      label: 'Frontend React & TypeScript',
      fileSize: 248_320,
      mimeType: 'application/pdf',
      uploadedAt: nowIso,
      isDefault: true,
      dataUrl: createSamplePdfDataUrl('KAPTEN - FRONTEND ENGINEERING INTERN', [
        'Surabaya, Indonesia  |  github.com/kapten-dev  |  kapten@student.its.ac.id',
        '--------------------------------------------------------------------------------',
        'RINGKASAN',
        'Mahasiswa Teknik Informatika berfokus pada React 19, TypeScript strict, dan UI bersih.',
        '',
        'SKILL UTAMA',
        'React, TypeScript, CSS, HTML, JavaScript, Git, REST API, Testing',
        '',
        'PROYEK UNGGULAN',
        '1. Aku Mw Magang - Pelacak lamaran magang berbasis state machine & Offer Comparator.',
        '2. Campus Event Hub - Platform penjadwalan mahasiswa dengan pencarian debounced.',
      ]),
    },
    {
      id: crypto.randomUUID(),
      name: 'Kapten-CV-Fullstack-v1.pdf',
      label: 'Full-Stack & Cloud',
      fileSize: 312_840,
      mimeType: 'application/pdf',
      uploadedAt: nowIso,
      isDefault: false,
      dataUrl: createSamplePdfDataUrl('KAPTEN - FULL-STACK & CLOUD INTERN', [
        'Surabaya, Indonesia  |  github.com/kapten-dev  |  kapten@student.its.ac.id',
        '--------------------------------------------------------------------------------',
        'RINGKASAN',
        'Pengembang web full-stack berfokus pada integrasi API, database relasional, dan Docker.',
        '',
        'SKILL UTAMA',
        'React, TypeScript, Node.js, PostgreSQL, Docker, Linux, REST API, Git',
        '',
        'PROYEK UNGGULAN',
        '1. Sistem Manajemen Inventaris Lab - REST API PostgreSQL + frontend TypeScript.',
        '2. CI/CD Sandbox Pipeline - Otomatisasi build & deploy container Docker.',
      ]),
    },
  ];

  const applications: Application[] = [
    {
      id: crypto.randomUUID(),
      company: 'Bintang Commerce',
      role: 'Software Engineer Intern — Web Platform',
      workMode: 'Remote',
      status: 'OFFER',
      requiredSkills: ['React', 'TypeScript', 'CSS', 'Testing', 'REST API'],
      cvVersion: 'Kapten-CV-Frontend-v2.pdf',
      appliedDate,
      interviewDateTime: formatFutureLocalDateTime(nowMs, -3, 14, 0),
      salaryOffer: 6_000_000,
      createdAt: simulateBackdateDays(nowIso, 12),
      lastUpdatedAt: nowIso,
      checklist: [
        { id: crypto.randomUUID(), text: 'Review kontrak & tunjangan magang', done: true },
        { id: crypto.randomUUID(), text: 'Konfirmasi tanggal mulai onboarding', done: true },
        { id: crypto.randomUUID(), text: 'Bandingkan skor di Offer Comparator', done: false },
      ],
      activityLogs: [
        { id: crypto.randomUUID(), timestamp: nowIso, message: 'Status Interview -> Offer (Rp 6.000.000, Remote)' },
        { id: crypto.randomUUID(), timestamp: simulateBackdateDays(nowIso, 4), message: 'Lolos tahap technical interview' },
        { id: crypto.randomUUID(), timestamp: simulateBackdateDays(nowIso, 12), message: 'Lamaran dikirim (CV: Kapten-CV-Frontend-v2.pdf)' },
      ],
    },
    {
      id: crypto.randomUUID(),
      company: 'Nusantara Cloud Tech',
      role: 'Frontend Engineering Intern (React & TypeScript)',
      workMode: 'Hybrid',
      status: 'OFFER',
      requiredSkills: ['React', 'TypeScript', 'CSS', 'Git'],
      cvVersion: 'Kapten-CV-Frontend-v2.pdf',
      appliedDate,
      interviewDateTime: formatFutureLocalDateTime(nowMs, -2, 10, 0),
      salaryOffer: 4_500_000,
      createdAt: simulateBackdateDays(nowIso, 10),
      lastUpdatedAt: nowIso,
      checklist: [
        { id: crypto.randomUUID(), text: 'Tanyakan jadwal WFO Surabaya per minggu', done: true },
        { id: crypto.randomUUID(), text: 'Review mentor & proyek magang', done: false },
      ],
      activityLogs: [
        { id: crypto.randomUUID(), timestamp: nowIso, message: 'Status Interview -> Offer (Rp 4.500.000, Hybrid)' },
        { id: crypto.randomUUID(), timestamp: simulateBackdateDays(nowIso, 10), message: 'Lamaran dikirim (CV: Kapten-CV-Frontend-v2.pdf)' },
      ],
    },
    {
      id: crypto.randomUUID(),
      company: 'Garuda FinTech',
      role: 'Full-Stack Web Developer Intern',
      workMode: 'Remote',
      status: 'INTERVIEW',
      requiredSkills: ['React', 'TypeScript', 'PostgreSQL', 'Express', 'Docker'],
      cvVersion: 'Kapten-CV-Fullstack-v1.pdf',
      appliedDate,
      interviewDateTime: formatFutureLocalDateTime(nowMs, 2, 10, 0),
      createdAt: simulateBackdateDays(nowIso, 6),
      lastUpdatedAt: nowIso,
      checklist: [
        { id: crypto.randomUUID(), text: 'Sesuaikan CV dengan proyek React + TypeScript', done: true },
        { id: crypto.randomUUID(), text: 'Riset produk & stack Garuda FinTech', done: true },
        { id: crypto.randomUUID(), text: 'Latihan soal teknis React Hooks & REST API', done: true },
        { id: crypto.randomUUID(), text: 'Siapkan pertanyaan balik untuk pewawancara', done: false },
      ],
      activityLogs: [
        { id: crypto.randomUUID(), timestamp: nowIso, message: 'Status Screening -> Interview (jadwal terjadwal)' },
        { id: crypto.randomUUID(), timestamp: simulateBackdateDays(nowIso, 6), message: 'Lamaran dikirim (CV: Kapten-CV-Fullstack-v1.pdf)' },
      ],
    },
    {
      id: crypto.randomUUID(),
      company: 'KaryaPay Digital',
      role: 'Backend Engineer Intern (Go & Microservices)',
      workMode: 'Hybrid',
      status: 'INTERVIEW',
      requiredSkills: ['Go', 'PostgreSQL', 'Docker', 'REST API', 'Redis'],
      cvVersion: 'Kapten-CV-Fullstack-v1.pdf',
      appliedDate,
      interviewDateTime: formatFutureLocalDateTime(nowMs, 2, 10, 30),
      createdAt: simulateBackdateDays(nowIso, 5),
      lastUpdatedAt: nowIso,
      checklist: [
        { id: crypto.randomUUID(), text: 'Minta reschedule karena bentrok dengan Garuda FinTech', done: false },
      ],
      activityLogs: [
        { id: crypto.randomUUID(), timestamp: nowIso, message: 'Status Screening -> Interview (selisih 30 menit dengan Garuda FinTech)' },
      ],
    },
    {
      id: crypto.randomUUID(),
      company: 'AwanMerdeka Cloud',
      role: 'DevOps & Cloud Infrastructure Intern',
      workMode: 'Remote',
      status: 'APPLIED',
      requiredSkills: ['Docker', 'Linux', 'CI/CD', 'PostgreSQL', 'Git'],
      cvVersion: 'Kapten-CV-Fullstack-v1.pdf',
      appliedDate: ghostedIso.slice(0, 10),
      createdAt: ghostedIso,
      lastUpdatedAt: ghostedIso,
      checklist: [
        { id: crypto.randomUUID(), text: 'Kirim email follow-up ke HRD AwanMerdeka', done: false },
      ],
      activityLogs: [
        { id: crypto.randomUUID(), timestamp: ghostedIso, message: 'Lamaran dikirim (belum ada respons > 14 hari)' },
      ],
    },
  ];

  return {
    skills: ['React', 'TypeScript', 'CSS', 'Git'],
    cvs,
    applications,
  };
}
