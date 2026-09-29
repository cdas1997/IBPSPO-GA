import { loadBank } from '@/lib/bank';
import raw from './bank.json';

export const bank = loadBank(raw);
export const knownQuestionIds: ReadonlySet<string> = new Set(bank.byId.keys());
