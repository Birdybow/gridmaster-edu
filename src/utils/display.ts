import type { Bus, Line } from '../types/index.js';

export function getBusName(busId: string, buses: Bus[]): string {
  return buses.find((b) => b.id === busId)?.name ?? busId;
}

export function getLineName(lineId: string, lines: Line[]): string {
  return lines.find((l) => l.id === lineId)?.name ?? lineId;
}
