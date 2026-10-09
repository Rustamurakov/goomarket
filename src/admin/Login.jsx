import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { PREVIEW } from '../lib/env.js';
import { PREVIEW_LOGIN } from '../preview/mockServer.js';
import { Link, ROUTES, hrefFor } from '../lib/router.jsx';
import { LogoMark } from '../components/Logo.jsx';
import { Icon } from '../components/Icons.jsx';
import { Spinner } from './ui.jsx';

export function AuthCard({ title, lead, children }) {
  return (
    <div className="a-auth">
      <div className="a-auth-card">
        <a href={hrefFor(ROUTES.home)} className="a-auth-brand">
          <LogoMark size={40} />
          <span>GooMarket</span>
        </a>
        <h1>{title}</h1>
        {lead && <p className="a-auth-lead">{lead}</p>}
        {children}
      </div>
    </div>
  );
}

export function PasswordInput({ id, value, onChange, autoComplete, invalid }) {
  const [show, setShow] = useState(false);
  return (
    <div className="a-input-wrap">
      <input
        id={id}
        className="a-input"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        required
      />
      <button type="button" className="a-input-btn" onClick={() => setShow((v) => !v)} aria-label={show ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}>
        <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </div>
  );
}

export default function Login({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);

  useEffect(() => {
    api('/api/admin/setup-status')
      .then((d) => setSetupRequired(d.setupRequired))
      .catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Login va parolni kiriting');
      return;
    }
    setBusy(true);
    try {
      const { admin } = await api('/api/admin/login', { method: 'POST', body: { username: username.trim(), password } });
      onLoggedIn(admin);
    } catch (err) {
      setError(err.message);
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Admin panelga kirish" lead="Mahsulotlarni boshqarish uchun login va parolingizni kiriting.">
      {setupRequired && (
        <div className="a-callout">
          <Icon name="info" size={18} />
          <span>
            Hali administrator yaratilmagan.{' '}
            <Link to={ROUTES.adminSetup}>Birinchi administratorni yaratish</Link>
          </span>
        </div>
      )}
      {PREVIEW && (
        <div className="a-callout a-callout-warn">
          <Icon name="info" size={18} />
          <span>
            Ko‘rgazma rejimi. Kirish uchun: login <b>{PREVIEW_LOGIN.username}</b>, parol <b>{PREVIEW_LOGIN.password}</b>
          </span>
        </div>
      )}
      <form className="a-form" onSubmit={submit} noValidate>
        <div className="a-field">
          <label className="a-label" htmlFor="login-username">
            Login
          </label>
          <input
            id="login-username"
            className="a-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            required
          />
        </div>
        <div className="a-field">
          <label className="a-label" htmlFor="login-password">
            Parol
          </label>
          <PasswordInput id="login-password" value={password} onChange={setPassword} autoComplete="current-password" />
        </div>
        {error && (
          <p className="a-form-error" role="alert">
            <Icon name="warning" size={16} /> {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-lg a-submit" disabled={busy}>
          {busy ? <Spinner /> : <Icon name="lock" size={18} />} Kirish
        </button>
      </form>
    </AuthCard>
  );
}
