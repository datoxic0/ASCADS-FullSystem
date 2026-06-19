import type { AnalogProject } from '@/lib/analog-types';
import type { Circuit } from '@/lib/types';
import AdvancedAnalogEditor from './AdvancedAnalogEditor';

interface Props {
  project: AnalogProject;
  onProjectChange: (p: AnalogProject) => void;
  onBack: () => void;
  onBridgeToDigital?: (circuit: Circuit) => void;
}

export default function AnalogEditor({ project, onProjectChange, onBack, onBridgeToDigital }: Props) {
  // AnalogEditor now strictly routes to the Advanced Matrix Simulator as the single source of truth
  return (
    <div className="flex flex-col h-full w-full bg-slate-950 relative overflow-hidden">
      <AdvancedAnalogEditor 
        project={project} 
        onProjectChange={onProjectChange} 
        onBack={onBack} 
        onBridgeToDigital={onBridgeToDigital} 
      />
    </div>
  );
}
