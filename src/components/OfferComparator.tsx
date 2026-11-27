import { useMemo, useState } from 'react';
import type { Application } from '../types/application';
import { scoreOffer } from '../utils/offerCompare';

interface Props { applications: Application[]; ownedSkills: string[] }

export default function OfferComparator({ applications, ownedSkills }: Props) {
  const offers = useMemo(() => applications.filter(a => a.status === 'OFFER'), [applications]);
  const [aId, setAId] = useState('');
  const [bId, setBId] = useState('');

  if (offers.length < 2)
    return <section className="comparator card"><h2>Offer Comparator</h2><p className="empty">Butuh minimal 2 lamaran berstatus OFFER untuk dibandingkan.</p></section>;

  const A = offers.find(o => o.id === aId);
  const B = offers.find(o => o.id === bId);
  const max = Math.max(...offers.map(o => o.salaryOffer ?? 0));
  const sA = A ? scoreOffer(A, max, ownedSkills) : null;
  const sB = B ? scoreOffer(B, max, ownedSkills) : null;
  const best = sA && sB ? (sA.total >= sB.total ? 'A' : 'B') : null;

  const col = (label: 'A' | 'B', app?: Application, s?: ReturnType<typeof scoreOffer> | null) => (
    <div className={`offer-col ${best === label ? 'best' : ''}`}>
      {best === label && <span className="best-badge">★ Rekomendasi Terbaik</span>}
      {app && s ? (<>
        <h3>{app.company} — {app.role}</h3>
        <p>Gaji: Rp {(app.salaryOffer ?? 0).toLocaleString('id-ID')}</p>
        <p>Mode kerja: {app.workMode}</p>
        <p>Skill Match: {s.skillMatch}%</p>
        <p><strong>Skor: {s.total.toFixed(1)}</strong></p>
      </>) : <p className="empty">Pilih offer {label}</p>}
    </div>
  );

  return (
    <section className="comparator card">
      <h2>Offer Comparator</h2>
      <div className="selectors">
        <select value={aId} onChange={e => setAId(e.target.value)}>
          <option value="">Offer A…</option>
          {offers.filter(o => o.id !== bId).map(o => <option key={o.id} value={o.id}>{o.company} — {o.role}</option>)}
        </select>
        <select value={bId} onChange={e => setBId(e.target.value)}>
          <option value="">Offer B…</option>
          {offers.filter(o => o.id !== aId).map(o => <option key={o.id} value={o.id}>{o.company} — {o.role}</option>)}
        </select>
      </div>
      <div className="offer-cols">{col('A', A, sA)}{col('B', B, sB)}</div>
    </section>
  );
}
