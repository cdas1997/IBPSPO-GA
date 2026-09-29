import { MockType, StudyMode, type AnswerRecord, type Answers, type LiveMock, type MockRecord, type Profile } from './types';

export function emptyProfile(): Profile {
  return { answers: {}, mocks: [], live: null, mode: StudyMode.Practice };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNumberMap(v: unknown): v is Record<string, number> {
  return isRecord(v) && Object.values(v).every((x) => typeof x === 'number');
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

function isMockType(v: unknown): v is MockType {
  return v === MockType.Full || v === MockType.Quick || v === MockType.Weak;
}

function parseAnswers(v: unknown): Answers {
  if (!isRecord(v)) return {};
  const out: Record<string, AnswerRecord> = {};
  for (const [id, rec] of Object.entries(v)) {
    if (Array.isArray(rec) && typeof rec[0] === 'number' && typeof rec[1] === 'number') out[id] = [rec[0], rec[1]];
  }
  return out;
}

function num(v: Record<string, unknown>, key: string): number | null {
  const x = v[key];
  return typeof x === 'number' && Number.isFinite(x) ? x : null;
}

function parseMock(v: unknown): MockRecord | null {
  if (!isRecord(v) || typeof v.id !== 'string' || !isMockType(v.type) || !isStringArray(v.questionIds)) return null;
  if (!isNumberMap(v.responses) || !isNumberMap(v.seconds)) return null;
  const startedAt = num(v, 'startedAt');
  const right = num(v, 'right');
  const wrong = num(v, 'wrong');
  const skipped = num(v, 'skipped');
  const net = num(v, 'net');
  const maxMarks = num(v, 'maxMarks');
  const usedMs = num(v, 'usedMs');
  const limitSecs = num(v, 'limitSecs');
  if (startedAt === null || right === null || wrong === null || skipped === null) return null;
  if (net === null || maxMarks === null || usedMs === null || limitSecs === null) return null;
  return {
    id: v.id,
    type: v.type,
    questionIds: v.questionIds,
    responses: v.responses,
    seconds: v.seconds,
    startedAt,
    right,
    wrong,
    skipped,
    net,
    maxMarks,
    usedMs,
    limitSecs,
  };
}

function parseLive(v: unknown): LiveMock | null {
  if (!isRecord(v) || typeof v.id !== 'string' || !isMockType(v.type) || !isStringArray(v.questionIds)) return null;
  if (!isNumberMap(v.responses) || !isNumberMap(v.seconds) || !isRecord(v.marked) || !Array.isArray(v.visited)) return null;
  const index = num(v, 'index');
  const startedAt = num(v, 'startedAt');
  const endsAt = num(v, 'endsAt');
  const limitSecs = num(v, 'limitSecs');
  const questionShownAt = num(v, 'questionShownAt');
  if (index === null || startedAt === null || endsAt === null || limitSecs === null || questionShownAt === null) return null;
  const marked: Record<string, true> = {};
  for (const k of Object.keys(v.marked)) marked[k] = true;
  return {
    id: v.id,
    type: v.type,
    questionIds: v.questionIds,
    responses: v.responses,
    seconds: v.seconds,
    marked,
    visited: v.visited.filter((x): x is number => typeof x === 'number'),
    index,
    startedAt,
    endsAt,
    limitSecs,
    questionShownAt,
  };
}

/** Validates data read from storage or a backup code; drops anything malformed or unknown to this bank. */
export function parseProfile(v: unknown, knownIds: ReadonlySet<string>): Profile {
  if (!isRecord(v)) return emptyProfile();
  const answers = Object.fromEntries(Object.entries(parseAnswers(v.answers)).filter(([id]) => knownIds.has(id)));
  const mocks = Array.isArray(v.mocks)
    ? v.mocks.map(parseMock).filter((m): m is MockRecord => m !== null && m.questionIds.every((id) => knownIds.has(id)))
    : [];
  const live = parseLive(v.live);
  return {
    answers,
    mocks,
    live: live && live.questionIds.every((id) => knownIds.has(id)) ? live : null,
    mode: v.mode === StudyMode.Revision ? StudyMode.Revision : StudyMode.Practice,
  };
}
