import { STATUSES } from '../constants.js';

// Doubles as a quick filter: click a status to filter the table by it.
export default function StatsBar({ stats, active, onPick }) {
  const items = [{ key: '', label: 'All leads', n: stats?.total ?? 0 }, ...STATUSES.map((s) => ({ key: s, label: s, n: stats?.byStatus[s] ?? 0 }))];
  return (
    <div className="stats" role="group" aria-label="Filter by status">
      {items.map((i) => (
        <button
          key={i.key || 'all'}
          className={`stat stat-${(i.key || 'all').toLowerCase()} ${active === i.key ? 'is-active' : ''}`}
          aria-pressed={active === i.key}
          onClick={() => onPick(i.key)}
        >
          <span className="stat-n">{i.n}</span>
          <span className="stat-label">{i.label}</span>
        </button>
      ))}
    </div>
  );
}
