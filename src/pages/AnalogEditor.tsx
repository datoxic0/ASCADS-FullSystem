import type { AnalogProject } from '@/lib/analog-types';
import type { Circuit } from '@/lib/types';
import AdvancedAnalogEditor from './AdvancedAnalogEditor';

interface Props {
  project: AnalogProject;
  onProjectChange: (p: AnalogProject) => void;
  onBack: () => void;
  onBridgeToDigital?: (circuit: Circuit) => void;
  onNavigate?: (mode: string) => void;
}

export default function AnalogEditor({ project, onProjectChange, onBack, onBridgeToDigital, onNavigate }: Props) {
  // AnalogEditor now strictly routes to the Advanced Matrix Simulator as the single source of truth
  return (
    <AdvancedAnalogEditor 
      project={project} 
      onProjectChange={onProjectChange} 
      onBack={onBack} 
      onBridgeToDigital={onBridgeToDigital} 
      onNavigate={onNavigate}
    />
  );
}
