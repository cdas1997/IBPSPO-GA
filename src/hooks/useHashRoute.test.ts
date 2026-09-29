import { describe, expect, it } from 'vitest';
import { SetFilter } from '@/lib/types';
import { parseRoute, routeHref } from './useHashRoute';

describe('hash routes', () => {
  it('round-trips every route', () => {
    const routes = [
      { name: 'analysis' },
      { name: 'bank' },
      { name: 'set', key: 'rbi-policy', filter: SetFilter.All },
      { name: 'set', key: 'sep-2026', filter: SetFilter.Wrong },
      { name: 'mocks' },
      { name: 'mock' },
      { name: 'review', id: 'm123' },
      { name: 'qa', key: null },
      { name: 'qa', key: 'rbi-circulars' },
    ] as const;
    for (const r of routes) expect(parseRoute(routeHref(r))).toEqual(r);
  });

  it('falls back to analysis and to the unfiltered set', () => {
    expect(parseRoute('')).toEqual({ name: 'analysis' });
    expect(parseRoute('#set-top~nonsense')).toEqual({ name: 'set', key: 'top', filter: SetFilter.All });
    expect(parseRoute('#qa-all')).toEqual({ name: 'qa', key: null });
  });
});
