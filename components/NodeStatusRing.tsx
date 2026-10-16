'use client';

import { NodeStatus } from '@/store/workflowStore';

interface Props {
  status: NodeStatus;
}

const statusConfig = {
  IDLE: { ring: 'border-white/20', dot: 'bg-white/30', pulse: false, label: 'IDLE' },
  RUNNING: { ring: 'border-amber-400/80', dot: 'bg-amber-400', pulse: true, label: 'RUNNING' },
  COMPLETED: { ring: 'border-emerald-500/80', dot: 'bg-emerald-400', pulse: false, label: 'DONE' },
  ERROR: { ring: 'border-red-500/80', dot: 'bg-red-400', pulse: false, label: 'ERROR' },
};

export function NodeStatusRing({ status }: Props) {
  const config = statusConfig[status];
  return (
    <div className="flex items-center gap-1.5">
      <div className={`relative flex items-center justify-center w-5 h-5 rounded-full border ${config.ring} transition-all duration-300`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} transition-colors duration-300`} />
        {config.pulse && (
          <span className="absolute inset-0 rounded-full border border-amber-400/50 animate-ping" />
        )}
      </div>
      <span className={`text-[9px] font-mono tracking-widest ${
        status === 'RUNNING' ? 'text-amber-400/80' :
        status === 'COMPLETED' ? 'text-emerald-400/80' :
        status === 'ERROR' ? 'text-red-400/80' :
        'text-white/30'
      }`}>
        {config.label}
      </span>
    </div>
  );
}
