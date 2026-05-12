import type { BusType, LineType } from '../../types/index.js';

export const DRAG_TYPE = 'application/gridmaster-component';

export type ComponentKind = 'bus' | 'line' | 'transformer' | 'generator' | 'compensator';

export interface ComponentDef {
  id: string;
  label: string;
  description: string;
  emoji: string;
  section: string;
  kind: ComponentKind;
  busType?: BusType;
  lineType?: LineType;
}

export const PALETTE: ComponentDef[] = [
  {
    id: 'bus-slack',
    label: 'Slack',
    description: 'Referansebuss — holder spenning og frekvens fast',
    emoji: '⚡',
    section: 'BUSSER',
    kind: 'bus',
    busType: 'slack',
  },
  {
    id: 'bus-pv',
    label: 'PV-buss',
    description: 'Generatorbuss — spenning og aktiv effekt fast',
    emoji: '🔋',
    section: 'BUSSER',
    kind: 'bus',
    busType: 'PV',
  },
  {
    id: 'bus-pq',
    label: 'PQ-buss',
    description: 'Lastbuss — aktiv og reaktiv effekt fast',
    emoji: '🏭',
    section: 'BUSSER',
    kind: 'bus',
    busType: 'PQ',
  },
  {
    id: 'line-overhead',
    label: 'Luftlinje',
    description: 'Overhead line — koble to busser med luftlinje',
    emoji: '〰',
    section: 'LINJER',
    kind: 'line',
    lineType: 'overhead',
  },
  {
    id: 'line-cable',
    label: 'Jordkabel',
    description: 'Jordkabel — koble to busser med kabel',
    emoji: '🔌',
    section: 'LINJER',
    kind: 'line',
    lineType: 'cable',
  },
  {
    id: 'transformer',
    label: 'Transformator',
    description: 'To-viklet transformator mellom to spenningsnivåer',
    emoji: '🔄',
    section: 'STASJONER',
    kind: 'transformer',
  },
  {
    id: 'generator',
    label: 'Generator',
    description: 'Kobles til PV- eller Slack-buss',
    emoji: '⚙',
    section: 'PRODUKSJON',
    kind: 'generator',
  },
  {
    id: 'compensator',
    label: 'Kondensator',
    description: 'Shunt-kondensatorbank for reaktiv kompensering',
    emoji: '🔵',
    section: 'KOMPENSERING',
    kind: 'compensator',
  },
];

export const SECTIONS = ['BUSSER', 'LINJER', 'STASJONER', 'PRODUKSJON', 'KOMPENSERING'] as const;

export function bySection(section: string): ComponentDef[] {
  return PALETTE.filter((c) => c.section === section);
}
