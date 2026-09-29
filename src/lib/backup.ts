import { parseProfile } from './profile';
import type { Profile } from './types';

const VERSION = 1;

export class BackupError extends Error {
  readonly code = 'backup/unreadable';
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function fromBase64(code: string): string {
  const binary = atob(code);
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

export function encodeBackup(profile: Profile): string {
  return toBase64(JSON.stringify({ v: VERSION, answers: profile.answers, mocks: profile.mocks }));
}

export function decodeBackup(code: string, knownIds: ReadonlySet<string>): Profile {
  let data: unknown;
  try {
    data = JSON.parse(fromBase64(code.trim()));
  } catch {
    throw new BackupError('That code could not be read. Copy the whole code again and paste it here.');
  }
  if (typeof data !== 'object' || data === null || !('answers' in data) || !('mocks' in data)) {
    throw new BackupError('That text is not a backup code from this site.');
  }
  return parseProfile(data, knownIds);
}
