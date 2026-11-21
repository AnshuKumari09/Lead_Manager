import { STATUSES } from '../constants.js';

const COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'company', label: 'Company', sortable: true },
  { key: 'contact', label: 'Contact' },
  { key: 'source', label: 'Source' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'created_at', label: 'Added', sortable: true },
];

const fmtDate = (s) => new Date(`${s.replace(' ', 'T')}Z`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export default function LeadTable({ leads, sort, order, onSort, onStatusChange, onEdit, onDelete, busyId }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c.key} aria-sort={sort === c.key ? (order === 'asc' ? 'ascending' : 'descending') : undefined}>
                {c.sortable ? (
                  <button className="th-btn" onClick={() => onSort(c.key)}>
                    {c.label}
                    <span aria-hidden="true" className="sort-mark">{sort === c.key ? (order === 'asc' ? '▲' : '▼') : ''}</span>
                  </button>
                ) : (
                  c.label
                )}
              </th>
            ))}
            <th><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id}>
              <td data-label="Name"><strong>{l.name}</strong></td>
              <td data-label="Company">{l.company}</td>
              <td data-label="Contact">
                <a href={`mailto:${l.email}`}>{l.email}</a>
                <div className="muted">{l.phone}</div>
              </td>
              <td data-label="Source">{l.source}</td>
              <td data-label="Status">
                <select
                  className={`status-select badge-${l.status.toLowerCase()}`}
                  value={l.status}
                  disabled={busyId === l.id}
                  aria-label={`Status for ${l.name}`}
                  onChange={(e) => onStatusChange(l, e.target.value)}
                >
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </td>
              <td data-label="Added" className="muted">{fmtDate(l.created_at)}</td>
              <td className="row-actions">
                <button className="btn btn-sm" onClick={() => onEdit(l)}>Edit</button>
                <button className="btn btn-sm btn-danger-ghost" onClick={() => onDelete(l)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
