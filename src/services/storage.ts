import { emptyProfile, parseProfile } from '@/lib/profile';
import type { Profile } from '@/lib/types';

const PREFIX = 'pogp.v1.';
const USERS_KEY = `${PREFIX}users`;
const CURRENT_KEY = `${PREFIX}current`;
const NAME_MIN = 2;
const NAME_MAX = 24;

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function profileKey(name: string): string {
  return `${PREFIX}user.${encodeURIComponent(name.toLowerCase())}`;
}

export type UsernameCheck = { ok: true; name: string } | { ok: false; message: string };

export function checkUsername(raw: string): UsernameCheck {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (name.length < NAME_MIN) return { ok: false, message: `Use at least ${NAME_MIN} characters.` };
  if (name.length > NAME_MAX) return { ok: false, message: `Keep it to ${NAME_MAX} characters or fewer.` };
  return { ok: true, name };
}

export function listUsers(): string[] {
  const v = read(USERS_KEY);
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

export function getCurrentUser(): string | null {
  const v = read(CURRENT_KEY);
  return typeof v === 'string' ? v : null;
}

export function setCurrentUser(name: string | null): void {
  if (name === null) {
    try {
      localStorage.removeItem(CURRENT_KEY);
    } catch {
      /* storage blocked: nothing to clear */
    }
    return;
  }
  write(CURRENT_KEY, name);
  const users = listUsers().filter((u) => u.toLowerCase() !== name.toLowerCase());
  write(USERS_KEY, [name, ...users]);
}

export function loadProfile(name: string, knownIds: ReadonlySet<string>): Profile {
  const v = read(profileKey(name));
  return v ? parseProfile(v, knownIds) : emptyProfile();
}

/** Returns false when the browser refuses storage (private mode, full disk). */
export function saveProfile(name: string, profile: Profile): boolean {
  return write(profileKey(name), profile);
}
