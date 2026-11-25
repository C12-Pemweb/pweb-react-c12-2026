import type { JobListing } from "../types/job";

const REMOTIVE_API_URL =   "https://remotive.com/api/remote-jobs?category=software-dev&limit=30";
const FALLBACK_URL = "/magang-fallback.json";

interface RemotiveResponse {
    jobs: JobListing[];
}

export async function fetchRemoteJobs(
    signal?: AbortSignal ) : Promise<JobListing[]> {
        const response = await fetch(REMOTIVE_API_URL, { signal });

    if(!response.ok){
        throw new Error("Gagal mengambil data dari Remotive API.");
    }

    const data = (await response.json()) as RemotiveResponse;
    return data.jobs;
}

export async function fetchFallbackJobs(
    signal?: AbortSignal ) : Promise<JobListing[]> {
        const response = await fetch(FALLBACK_URL, { signal });

    if(!response.ok){
        throw new Error("Gagal mengambil dataset fallback lokal.");
    }

    const data = (await response.json()) as JobListing[];

    if(!Array.isArray(data)){
        throw new Error("Format dataset fallback tidak valid.");
    }

    return data;
}

    