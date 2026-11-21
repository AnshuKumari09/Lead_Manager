import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { STATUSES } from '../constants.js';
import { useDebounced } from '../hooks.js';
import StatsBar from './StatsBar.jsx';
import LeadTable from './LeadTable.jsx';
import LeadForm from './LeadForm.jsx';
import ConfirmDelete from './ConfirmDelete.jsx';

const PAGE_SIZE = 8;

export default function Dashboard({ user, onLogout }) {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [stats, setStats] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounced(searchInput);
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | lead
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const latest = useRef(0); // ignore responses from outdated requests

  const load = useCallback(async () => {
    const id = ++latest.current;
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        api.listLeads({ search, status, sort, order, page, limit: PAGE_SIZE }),
        api.stats(),
      ]);
      if (id !== latest.current) return;
      setLeads(list.data);
      setPagination(list.pagination);
      setStats(s);
      setError('');
      // If the last item on the last page was removed, step back a page.
      if (list.data.length === 0 && page > 1) setPage(page - 1);
    } catch (err) {
      if (id === latest.current) setError(err.message);
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, [search, status, sort, order, page]);

  useEffect(() => { load(); }, [load]);

  // Any change to the filters sends the user back to page 1.
  useEffect(() => { setPage(1); }, [search, status]);

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const toggleSort = (key) => {
    if (key === sort) setOrder(order === 'asc' ? 'desc' : 'asc');
    else { setSort(key); setOrder(key === 'created_at' ? 'desc' : 'asc'); }
    setPage(1);
  };

  async function saveLead(form) {
    const body = { ...form, email: form.email.trim() };
    if (editing === 'new') await api.createLead(body);
    else await api.updateLead(editing.id, body);
    flash(editing === 'new' ? 'Lead added' : 'Lead updated');
    setEditing(null);
    load();
  }

  async function changeStatus(lead, newStatus) {
    setBusyId(lead.id);
    try {
      await api.updateLead(lead.id, { ...lead, status: newStatus });
      flash(`${lead.name} marked ${newStatus}`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    await api.deleteLead(deleting.id);
    flash('Lead deleted');
    setDeleting(null);
    load();
  }

  const filtered = search || status;

  return (
    <div className="app">
      <header className="topbar">
        <h1>Lead Manager</h1>
        <div className="topbar-right">
          <span className="muted hide-sm">{user.name}</span>
          <button className="btn btn-sm" onClick={onLogout}>Log out</button>
        </div>
      </header>

      <main className="content">
        <StatsBar stats={stats} active={status} onPick={setStatus} />

        <div className="toolbar">
          <input
            className="search"
            type="search"
            placeholder="Search by name, email or company"
            aria-label="Search leads"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setEditing('new')}>Add lead</button>
        </div>

        {notice && <div className="banner banner-ok" role="status">{notice}</div>}
        {error && (
          <div className="banner banner-error" role="alert">
            {error} <button className="btn-link" onClick={load}>Try again</button>
          </div>
        )}

        {loading && leads.length === 0 && !error ? (
          <p className="empty">Loading leads…</p>
        ) : leads.length === 0 && !error ? (
          <div className="empty">
            {filtered ? (
              <>
                <p>No leads match your search.</p>
                <button className="btn" onClick={() => { setSearchInput(''); setStatus(''); }}>Clear filters</button>
              </>
            ) : (
              <>
                <p>No leads yet. Add your first one to start tracking.</p>
                <button className="btn btn-primary" onClick={() => setEditing('new')}>Add lead</button>
              </>
            )}
          </div>
        ) : (
          <div className={loading ? 'is-loading' : ''}>
            <LeadTable
              leads={leads}
              sort={sort}
              order={order}
              onSort={toggleSort}
              onStatusChange={changeStatus}
              onEdit={setEditing}
              onDelete={setDeleting}
              busyId={busyId}
            />
            <nav className="pager" aria-label="Pagination">
              <span className="muted">{pagination.total} lead{pagination.total === 1 ? '' : 's'}</span>
              <div>
                <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                <span className="pager-pos">Page {pagination.page} of {pagination.totalPages}</span>
                <button className="btn btn-sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            </nav>
          </div>
        )}
      </main>

      {editing && (
        <LeadForm lead={editing === 'new' ? null : editing} onSave={saveLead} onClose={() => setEditing(null)} />
      )}
      {deleting && <ConfirmDelete lead={deleting} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />}
    </div>
  );
}
