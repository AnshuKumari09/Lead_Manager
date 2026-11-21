import { useState } from 'react';
import { SOURCES, STATUSES } from '../constants.js';
import { validateLead } from '../validation.js';
import Field from './Field.jsx';
import Modal from './Modal.jsx';

const EMPTY = { name: '', email: '', phone: '', company: '', source: '', status: 'New' };

export default function LeadForm({ lead, onSave, onClose }) {
  const [form, setForm] = useState(lead ? { ...EMPTY, ...lead } : EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const v = validateLead(form);
    setErrors(v);
    setFormError('');
    if (Object.keys(v).length) return;

    setBusy(true);
    try {
      await onSave(form);
    } catch (err) {
      setErrors(err.details || {});
      setFormError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={lead ? 'Edit lead' : 'Add lead'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="form-grid">
        {formError && <div className="banner banner-error full" role="alert">{formError}</div>}
        <Field label="Name" error={errors.name}>
          <input value={form.name} onChange={set('name')} autoFocus />
        </Field>
        <Field label="Company" error={errors.company}>
          <input value={form.company} onChange={set('company')} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <input type="tel" value={form.phone} onChange={set('phone')} />
        </Field>
        <Field label="Source" error={errors.source}>
          <select value={form.source} onChange={set('source')}>
            <option value="">Choose a source</option>
            {SOURCES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Status" error={errors.status}>
          <select value={form.status} onChange={set('status')}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <div className="actions full">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : lead ? 'Save changes' : 'Add lead'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
