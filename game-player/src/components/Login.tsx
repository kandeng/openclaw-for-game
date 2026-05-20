import { useState } from 'react';
import { login, saveCreds } from '../matrix/client';
import { useStore } from '../state/store';

export default function Login() {
  const setCreds = useStore((s) => s.setCreds);
  const [hs, setHs] = useState('http://localhost:8008');
  const [user, setUser] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const creds = await login(hs, user, pw);
      saveCreds(creds);
      setCreds(creds);
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-screen bg-gray-100" style={{ height: '100dvh' }}>
      <form
        onSubmit={submit}
        className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-lg p-6 space-y-4"
      >
        <h1 className="text-xl font-semibold text-gray-800 text-center">Sign in</h1>
        <label className="block">
          <span className="block text-xs text-gray-500 mb-1">Homeserver</span>
          <input
            value={hs}
            onChange={(e) => setHs(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="block">
          <span className="block text-xs text-gray-500 mb-1">Username</span>
          <input
            value={user}
            onChange={(e) => {
              const v = e.target.value;
              setUser(v);
              if (v === 'alice') setPw('alice_pass');
              else if (v === 'bob') setPw('bob_pass');
            }}
            required
            placeholder="alice"
            className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="block">
          <span className="block text-xs text-gray-500 mb-1">Password</span>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 active:bg-blue-600"
        >
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
        {err && <p className="text-xs text-red-500 text-center">{err}</p>}
      </form>
    </div>
  );
}
