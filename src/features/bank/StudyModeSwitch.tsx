import { Segmented } from '@/components/ui/Segmented';
import { StudyMode } from '@/lib/types';

const OPTIONS = [
  { value: StudyMode.Practice, label: 'Practice' },
  { value: StudyMode.Revision, label: 'Revision' },
] as const;

type StudyModeSwitchProps = { mode: StudyMode; onChange: (mode: StudyMode) => void };

export function StudyModeSwitch({ mode, onChange }: StudyModeSwitchProps) {
  return <Segmented label="Study mode" value={mode} options={OPTIONS} onChange={onChange} />;
}
