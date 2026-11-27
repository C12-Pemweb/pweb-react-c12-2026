import type { Application } from '../types/application';
import { isGhostingRisk } from './ghosting';

export interface PipelineStats {
  total: number;
  activeCount: number;
  respondedCount: number;
  responseRate: number;
  interviewCount: number;
  interviewRate: number;
  ghostingRiskCount: number;
  offerCount: number;
}

export function computePipelineStats(
  applications: readonly Application[],
  nowMs: number,
): PipelineStats {
  const total = applications.length;
  let activeCount = 0;
  let respondedCount = 0;
  let interviewCount = 0;
  let ghostingRiskCount = 0;
  let offerCount = 0;

  for (const app of applications) {
    if (
      app.status === 'WISHLIST' ||
      app.status === 'APPLIED' ||
      app.status === 'SCREENING' ||
      app.status === 'INTERVIEW'
    ) {
      activeCount++;
    }

    if (
      app.status === 'SCREENING' ||
      app.status === 'INTERVIEW' ||
      app.status === 'OFFER' ||
      app.status === 'REJECTED'
    ) {
      respondedCount++;
    }

    if (
      app.status === 'INTERVIEW' ||
      app.status === 'OFFER' ||
      Boolean(app.interviewDateTime)
    ) {
      interviewCount++;
    }

    if (isGhostingRisk(app, nowMs)) {
      ghostingRiskCount++;
    }

    if (app.status === 'OFFER') {
      offerCount++;
    }
  }

  return {
    total,
    activeCount,
    respondedCount,
    responseRate: total === 0 ? 0 : Math.round((respondedCount / total) * 100),
    interviewCount,
    interviewRate: total === 0 ? 0 : Math.round((interviewCount / total) * 100),
    ghostingRiskCount,
    offerCount,
  };
}
