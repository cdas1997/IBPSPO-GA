import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { checkUsername, listUsers } from '@/services/storage';

type LoginPageProps = { questionCount: number; examLabel: string | null; onLogin: (name: string) => void };

export function LoginPage({ questionCount, examLabel, onLogin }: LoginPageProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const users = listUsers();

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const check = checkUsername(name);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    onLogin(check.name);
  }

  return (
    <main className="wrap login">
      <div className="login-card">
        <div className="stack-sm">
          <p className="label">IBPS PO Mains 2026 · GA section</p>
          <h1>PO Mains GA Prep</h1>
          <p className="muted">
            {questionCount} fact-checked questions on General, Economy, Banking, Digital &amp; Financial Awareness, timed mocks, and an
            analysis of your weak spots.
          </p>
          <p className="specline">50 Q · 60 marks · 35 min · −0.30 per wrong answer{examLabel ? ` · Exam ${examLabel}` : ''}</p>
        </div>
        {users.length ? (
          <div className="stack-sm">
            <p className="label">Continue as</p>
            <div className="userlist">
              {users.map((u) => (
                <button key={u} type="button" className="userchip" onClick={() => onLogin(u)}>
                  <span className="avatar" aria-hidden="true">
                    {u.slice(0, 1)}
                  </span>
                  {u}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <form className="stack-sm" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="username">{users.length ? 'Or start as someone new' : 'Your name'}</label>
            <input
              id="username"
              name="username"
              autoComplete="nickname"
              placeholder="e.g. Chandan"
              value={name}
              maxLength={24}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'username-error' : undefined}
            />
            {error ? (
              <p className="error" id="username-error">
                {error}
              </p>
            ) : null}
          </div>
          <Button type="submit" variant="primary">
            Start practising
          </Button>
        </form>
        <p className="small muted">
          No password needed. Your progress is saved in this browser under this name, so each person on this device gets their own
          analysis.
        </p>
      </div>
    </main>
  );
}
