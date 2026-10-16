// ⚠️ Critical: @xyflow/react base styles MUST be imported here or the canvas breaks
import '@xyflow/react/dist/style.css';
import { WorkflowCanvas } from '@/components/WorkflowCanvas';

export default function Page() {
  return <WorkflowCanvas />;
}
