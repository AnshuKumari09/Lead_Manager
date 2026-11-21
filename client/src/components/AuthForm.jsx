import { useState } from 'react';
import { api, tokenStore } from '../api.js';
import { validateAuth } from '../validation.js';
import Field from './Field.jsx';

export default function AuthForm({ onAuthed }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const isSignup = mode === 'signup';

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const switchMode = () => {
    setMode(isSignup ? 'login' : 'signup');
    setErrors({});
    setFormError('');
  };

  async function submit(e) {
    e.preventDefault();
    const v = validateAuth(form, isSignup);
    setErrors(v);
    setFormError('');
    if (Object.keys(v).length) return;

    setBusy(true);
    try {
      const body = { ...form, email: form.email.trim() };
      const { token, user } = isSignup ? await api.signup(body) : await api.login(body);
      tokenStore.set(token);
      onAuthed(user);
    } catch (err) {
      setErrors(err.details || {});
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <div className="auth-brand">
        <h1>Lead Manager</h1>
        <p>Every lead, one clear status. Capture them, follow up, and see what is moving.</p>
      </div>
      <form className="auth-card" onSubmit={submit} noValidate>
        <h2>{isSignup ? 'Create your account' : 'Log in'}</h2>
        {formError && <div className="banner banner-error" role="alert">{formError}</div>}
        {isSignup && (
          <Field label="Your name" error={errors.name}>
            <input value={form.name} onChange={set('name')} autoComplete="name" />
          </Field>
        )}
        <Field label="Email" error={errors.email}>
          <input type="email" value={form.email} onChange={set('email')} autoComplete="email" />
        </Field>
        <Field label="Password" error={errors.password}>
          <input
            type="password"
            value={form.password}
            onChange={set('password')}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />
        </Field>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
        </button>
        <button type="button" className="btn-link" onClick={switchMode}>
          {isSignup ? 'Already have an account? Log in' : 'New here? Create an account'}
        </button>
      </form>
    </main>
  );
}
