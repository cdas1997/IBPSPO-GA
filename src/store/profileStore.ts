import { useSyncExternalStore } from 'react';
import { bank, knownQuestionIds } from '@/data';
import { accrueTime, createLiveMock, finishLiveMock, goToQuestion } from '@/lib/mock';
import { emptyProfile } from '@/lib/profile';
import type { LiveMock, MockRecord, MockType, Profile, StudyMode } from '@/lib/types';
import { getCurrentUser, loadProfile, saveProfile, setCurrentUser } from '@/services/storage';

const MAX_MOCKS_KEPT = 30;

export type ProfileState = { user: string | null; profile: Profile; storageOk: boolean };

function initialState(): ProfileState {
  const user = getCurrentUser();
  return { user, profile: user ? loadProfile(user, knownQuestionIds) : emptyProfile(), storageOk: true };
}

let state: ProfileState = initialState();
const listeners = new Set<() => void>();

function commit(profile: Profile): void {
  const storageOk = state.user ? saveProfile(state.user, profile) : true;
  state = { ...state, profile, storageOk };
  listeners.forEach((l) => l());
}

function update(fn: (p: Profile) => Profile): void {
  commit(fn(state.profile));
}

export const profileStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getState(): ProfileState {
    return state;
  },
  login(name: string): void {
    setCurrentUser(name);
    state = { user: name, profile: loadProfile(name, knownQuestionIds), storageOk: true };
    listeners.forEach((l) => l());
  },
  logout(): void {
    setCurrentUser(null);
    state = { user: null, profile: emptyProfile(), storageOk: true };
    listeners.forEach((l) => l());
  },
  answer(questionId: string, choice: number): void {
    const now = Date.now();
    update((p) => (p.answers[questionId] ? p : { ...p, answers: { ...p.answers, [questionId]: [choice, now] } }));
  },
  clearAnswers(questionIds: readonly string[]): void {
    const drop = new Set(questionIds);
    update((p) => ({ ...p, answers: Object.fromEntries(Object.entries(p.answers).filter(([id]) => !drop.has(id))) }));
  },
  setMode(mode: StudyMode): void {
    update((p) => ({ ...p, mode }));
  },
  startMock(type: MockType): void {
    const now = Date.now();
    update((p) => ({ ...p, live: createLiveMock({ type, bank, answers: p.answers, random: Math.random, now }) }));
  },
  updateLive(fn: (live: LiveMock) => LiveMock): void {
    update((p) => (p.live ? { ...p, live: fn(p.live) } : p));
  },
  goToQuestion(index: number): void {
    const now = Date.now();
    update((p) => (p.live ? { ...p, live: goToQuestion(p.live, index, now) } : p));
  },
  accrueLiveTime(): void {
    const now = Date.now();
    update((p) => (p.live ? { ...p, live: accrueTime(p.live, now) } : p));
  },
  finishLive(): MockRecord | null {
    const live = state.profile.live;
    if (!live) return null;
    const record = finishLiveMock(live, bank, Date.now());
    update((p) => ({ ...p, live: null, mocks: [record, ...p.mocks].slice(0, MAX_MOCKS_KEPT) }));
    return record;
  },
  quitLive(): void {
    update((p) => ({ ...p, live: null }));
  },
  replace(profile: Profile): void {
    commit(profile);
  },
  resetAll(): void {
    commit(emptyProfile());
  },
};

export function useProfileState<T>(selector: (s: ProfileState) => T): T {
  return useSyncExternalStore(profileStore.subscribe, () => selector(profileStore.getState()));
}
