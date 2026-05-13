export type FlowState = 'normal' | 'opposing' | 'reversed' | 'idle';

export interface FlowColorInput {
  currentA: number;
  isOpposing?: boolean;
}

export const FLOW_COLORS: Record<FlowState, string> = {
  normal:   '#2E7D32',
  opposing: '#F57C00',
  reversed: '#C62828',
  idle:     '#90A4AE',
};

export function getFlowState({ currentA, isOpposing = false }: FlowColorInput): FlowState {
  if (Math.abs(currentA) < 0.1) return 'idle';
  if (isOpposing) return 'opposing';
  if (currentA < 0) return 'reversed';
  return 'normal';
}

export function getFlowColor(input: FlowColorInput): string {
  return FLOW_COLORS[getFlowState(input)];
}
