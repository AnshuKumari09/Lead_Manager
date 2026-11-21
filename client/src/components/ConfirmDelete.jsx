import { useState } from 'react';
import Modal from './Modal.jsx';

export default function ConfirmDelete({ lead, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function go() {
    setBusy(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title="Delete this lead?" onClose={onClose}>
      <p>
        <strong>{lead.name}</strong> ({lead.company}) will be removed permanently. This cannot be undone.
      </p>
      {error && <div className="banner banner-error" role="alert">{error}</div>}
      <div className="actions">
        <button className="btn" onClick={onClose}>Keep lead</button>
        <button className="btn btn-danger" onClick={go} disabled={busy} autoFocus>
          {busy ? 'Deleting…' : 'Delete lead'}
        </button>
      </div>
    </Modal>
  );
}
