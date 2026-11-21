import { useCallback, useEffect, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from './api.js';
import AuthForm from './components/AuthForm.jsx';
import Dashboard from './components/Dashboard.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(!!tokenStore.get());

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) return;
    api.me().then(({ user }) => setUser(user)).catch(() => {}).finally(() => setChecking(false));
  }, [logout]);

  if (checking) return <p className="center-msg">Loading…</p>;
  return user ? <Dashboard user={user} onLogout={logout} /> : <AuthForm onAuthed={setUser} />;
}


