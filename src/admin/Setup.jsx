import { useState } from 'react';
import { api } from '../lib/api.js';
import { Link, ROUTES } from '../lib/router.jsx';
import { Icon } from '../components/Icons.jsx';
import { AuthCard, PasswordInput } from './Login.jsx';
import { Field, Spinner } from './ui.jsx';

// Birinchi administratorni brauzer orqali yaratish.
// Bir martalik kod faqat server logida chiqadi va admin yaratilgach bekor bo'ladi.
export default function Setup({ query, onDone }) {
  const [token, setToken] = useState(query.get('token') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const local = {};
    if (!token.trim()) local.token = 'Server logidagi bir martalik kodni kiriting';
    if (password.length < 10) local.password = 'Parol kamida 10 belgidan iborat bo‘lsin';
    if (password !== confirm) local.confirm = 'Parollar mos kelmadi';
    setErrors(local);
    setError('');
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      const { admin } = await api('/api/admin/setup', {
        method: 'POST',
        body: { token: token.trim(), username: username.trim(), password },
      });
      onDone(admin);
    } catch (err) {
      setErrors(err.fields || {});
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Birinchi administrator"
      lead="Bu sahifa faqat bir marta, administrator hali yo‘q bo‘lganda ishlaydi. Bir martalik kod server ishga tushganda uning logida (terminal yoki hosting “Logs” bo‘limi) chiqadi."
    >
      <form className="a-form" onSubmit={submit} noValidate>
        <Field id="setup-token" label="Bir martalik sozlash kodi" error={errors.token}>
          <input
            id="setup-token"
            className="a-input a-mono"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
        </Field>
        <Field id="setup-username" label="Login" hint="3–32 belgi: lotin harflari, raqamlar, nuqta, _ yoki -" error={errors.username}>
          <input
            id="setup-username"
            className="a-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
          />
        </Field>
        <Field id="setup-password" label="Parol" hint="Kamida 10 belgi. Uzun ibora eslab qolish oson va ishonchli" error={errors.password}>
          <PasswordInput id="setup-password" value={password} onChange={setPassword} autoComplete="new-password" />
        </Field>
        <Field id="setup-confirm" label="Parolni takrorlang" error={errors.confirm}>
          <PasswordInput id="setup-confirm" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        </Field>
        {error && !Object.keys(errors).length && (
          <p className="a-form-error" role="alert">
            <Icon name="warning" size={16} /> {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-lg a-submit" disabled={busy}>
          {busy ? <Spinner /> : <Icon name="check" size={18} />} Administratorni yaratish
        </button>
        <Link to={ROUTES.adminLogin} className="a-auth-alt">
          Administrator bormi? Kirish
        </Link>
      </form>
    </AuthCard>
  );
}
