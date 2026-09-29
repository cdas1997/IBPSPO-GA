import { useSyncExternalStore } from 'react';
import { SetFilter } from '@/lib/types';

export type Route =
  | { name: 'analysis' }
  | { name: 'bank' }
  | { name: 'set'; key: string; filter: SetFilter }
  | { name: 'mocks' }
  | { name: 'mock' }
  | { name: 'review'; id: string }
  | { name: 'qa'; key: string | null };

const FILTERS: readonly string[] = Object.values(SetFilter);

function toFilter(v: string | undefined): SetFilter {
  switch (v) {
    case SetFilter.Todo:
    case SetFilter.Wrong:
    case SetFilter.Right:
    case SetFilter.Hot:
      return v;
    default:
      return SetFilter.All;
  }
}

export function parseRoute(hash: string): Route {
  const h = hash.replace(/^#/, '');
  if (h === 'bank') return { name: 'bank' };
  if (h === 'mocks') return { name: 'mocks' };
  if (h === 'mock') return { name: 'mock' };
  if (h === 'qa') return { name: 'qa', key: null };
  if (h.startsWith('qa-')) {
    const key = h.slice('qa-'.length);
    return { name: 'qa', key: key && key !== 'all' ? key : null };
  }
  if (h.startsWith('review-')) return { name: 'review', id: h.slice('review-'.length) };
  if (h.startsWith('set-')) {
    const [key = '', filter] = h.slice('set-'.length).split('~');
    return { name: 'set', key, filter: FILTERS.includes(filter ?? '') ? toFilter(filter) : SetFilter.All };
  }
  return { name: 'analysis' };
}

export function routeHref(route: Route): string {
  switch (route.name) {
    case 'analysis':
      return '#analysis';
    case 'bank':
      return '#bank';
    case 'mocks':
      return '#mocks';
    case 'mock':
      return '#mock';
    case 'review':
      return `#review-${route.id}`;
    case 'qa':
      return route.key ? `#qa-${route.key}` : '#qa';
    case 'set':
      return `#set-${route.key}${route.filter === SetFilter.All ? '' : `~${route.filter}`}`;
  }
}

export function navigate(route: Route): void {
  window.location.hash = routeHref(route).slice(1);
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

export function useHash(): string {
  return useSyncExternalStore(subscribe, () => window.location.hash);
}
