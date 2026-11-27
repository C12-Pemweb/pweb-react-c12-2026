import { useMemo, useState } from 'react';
import { Briefcase, Scale } from 'lucide-react';
import type { Application } from '../types/application';
import { scoreOffer } from '../utils/offerCompare';
import { formatRupiah } from '../utils/format';

interface OfferComparatorProps {
  applications: Application[];
  kaptenSkills: string[];
  onGoToPipeline?: () => void;
}

export default function OfferComparator({
  applications,
  kaptenSkills,
  onGoToPipeline,
}: OfferComparatorProps) {
  const offers = useMemo(
    () => applications.filter((app) => app.status === 'OFFER'),
    [applications],
  );

  const [selectedAId, setSelectedAId] = useState('');
  const [selectedBId, setSelectedBId] = useState('');

  if (offers.length < 2) {
    return (
      <section className="comparator-section" aria-labelledby="comparator-heading">
        <div>
          <h2 id="comparator-heading" className="section-heading">
            Perbandingan Skor Berbobot
          </h2>
          <p className="section-subtitle">
            Bobot penilaian: Uang Saku 50% · Mode Kerja 25% · Kecocokan Skill 25%
          </p>
        </div>

        <div className="surface state-box">
          <div className="state-box-icon">
            <Scale size={20} aria-hidden="true" />
          </div>
          <h3>Belum cukup offer untuk dibandingkan</h3>
          <p className="tabular-nums">
            Saat ini terdapat {offers.length} lamaran berstatus OFFER. Pindahkan minimal 2
            lamaran ke status OFFER di War Room Pipeline agar Offer Comparator dapat
            menghitung skor objektifnya.
          </p>
          {onGoToPipeline && (
            <div className="state-box-actions">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onGoToPipeline}
              >
                <Briefcase size={14} aria-hidden="true" />
                Buka Pipeline Lamaran
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  const resolvedAId = offers.some((o) => o.id === selectedAId)
    ? selectedAId
    : offers[0].id;
  const resolvedBId =
    offers.some((o) => o.id === selectedBId) && selectedBId !== resolvedAId
      ? selectedBId
      : (offers.find((o) => o.id !== resolvedAId)?.id ?? offers[1].id);

  const offerA = offers.find((o) => o.id === resolvedAId) ?? offers[0];
  const offerB = offers.find((o) => o.id === resolvedBId) ?? offers[1];

  const maxSalary = Math.max(offerA.salaryOffer ?? 0, offerB.salaryOffer ?? 0);
  const scoreA = scoreOffer(offerA, maxSalary, kaptenSkills);
  const scoreB = scoreOffer(offerB, maxSalary, kaptenSkills);

  const scoreDiff = scoreA.total - scoreB.total;
  const isTie = Math.abs(scoreDiff) < 0.05;
  const winner: 'A' | 'B' | 'TIE' = isTie ? 'TIE' : scoreDiff > 0 ? 'A' : 'B';

  const entries = [
    { key: 'A' as const, offer: offerA, score: scoreA },
    { key: 'B' as const, offer: offerB, score: scoreB },
  ];

  return (
    <section className="comparator-section" aria-labelledby="comparator-heading">
      <div className="comparator-bar">
        <div>
          <h2 id="comparator-heading" className="section-heading">
            Perbandingan Skor Berbobot
          </h2>
          <p className="section-subtitle">
            Bobot penilaian: Uang Saku 50% · Mode Kerja 25% · Kecocokan Skill 25%
          </p>
        </div>

        <div className="comparator-selectors">
          <label htmlFor="offer-a-select" className="sr-only">
            Pilih Offer A
          </label>
          <select
            id="offer-a-select"
            className="select toolbar-select"
            value={resolvedAId}
            onChange={(e) => setSelectedAId(e.target.value)}
          >
            {offers
              .filter((o) => o.id !== resolvedBId)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  Offer A: {o.company} — {o.role}
                </option>
              ))}
          </select>

          <span className="field-hint">vs</span>

          <label htmlFor="offer-b-select" className="sr-only">
            Pilih Offer B
          </label>
          <select
            id="offer-b-select"
            className="select toolbar-select"
            value={resolvedBId}
            onChange={(e) => setSelectedBId(e.target.value)}
          >
            {offers
              .filter((o) => o.id !== resolvedAId)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  Offer B: {o.company} — {o.role}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="comparator-grid">
        {entries.map(({ key, offer, score }) => {
          const isBest = winner === key;
          return (
            <article
              key={`${key}-${offer.id}`}
              className={`surface offer-card ${isBest ? 'is-recommended' : ''}`}
            >
              <div className="offer-card-head">
                <div>
                  <h3 className="job-title">{offer.company}</h3>
                  <p className="panel-desc">{offer.role}</p>
                </div>

                {isBest && (
                  <span className="status-stamp status-offer">
                    Rekomendasi Terbaik
                  </span>
                )}
                {winner === 'TIE' && (
                  <span className="status-stamp status-interview">
                    Skor Seimbang
                  </span>
                )}
              </div>

              <div className="offer-rows">
                <div className="offer-row">
                  <span className="offer-row-label">Uang Saku / Bulan</span>
                  <span className="offer-row-value tabular-nums">
                    {formatRupiah(offer.salaryOffer ?? 0)}
                  </span>
                  <span className="offer-row-pts mono tabular-nums">
                    {score.salaryWeighted.toFixed(1)} / 50
                  </span>
                </div>

                <div className="offer-row">
                  <span className="offer-row-label">Mode Kerja</span>
                  <span className="offer-row-value tabular-nums">
                    {offer.workMode} ({score.modeScore})
                  </span>
                  <span className="offer-row-pts mono tabular-nums">
                    {score.modeWeighted.toFixed(1)} / 25
                  </span>
                </div>

                <div className="offer-row">
                  <span className="offer-row-label">Kecocokan Skill</span>
                  <span className="offer-row-value tabular-nums">
                    {score.skillMatch}% ({score.matchedCount} dari {score.totalRequired}{' '}
                    skill)
                  </span>
                  <span className="offer-row-pts mono tabular-nums">
                    {score.skillWeighted.toFixed(1)} / 25
                  </span>
                </div>
              </div>

              <div className="offer-total">
                <span className="offer-total-label">Total Skor Berbobot</span>
                <span className="offer-total-score tabular-nums">
                  {score.total.toFixed(1)}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
