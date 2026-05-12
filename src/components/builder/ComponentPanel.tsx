import { useState } from 'react';
import { SECTIONS, bySection, DRAG_TYPE } from './ComponentPalette.js';
import type { ComponentDef } from './ComponentPalette.js';
import { useNetworkStore } from '../../store/useNetworkStore.js';


function PaletteItem({ def }: { def: ComponentDef }) {
  const lineDrawingMode = useNetworkStore((s) => s.lineDrawingMode);
  const placingMode = useNetworkStore((s) => s.placingMode);
  const setLineDrawingMode = useNetworkStore((s) => s.setLineDrawingMode);
  const setPlacingMode = useNetworkStore((s) => s.setPlacingMode);

  const isLineActive =
    def.kind === 'line' && def.lineType != null && lineDrawingMode === def.lineType;

  const isBusActive =
    def.kind === 'bus' &&
    placingMode !== null &&
    placingMode.kind === 'bus' &&
    placingMode.busType === def.busType;

  const isActive = isLineActive || isBusActive;

  function handleClick() {
    if (def.kind === 'line' && def.lineType) {
      if (lineDrawingMode === def.lineType) {
        setLineDrawingMode(null);
      } else {
        setLineDrawingMode(def.lineType);
        setPlacingMode(null);
      }
    } else if (def.kind === 'bus' && def.busType) {
      if (isBusActive) {
        setPlacingMode(null);
      } else {
        setPlacingMode({ kind: 'bus', busType: def.busType });
        setLineDrawingMode(null);
      }
    } else if (def.kind === 'transformer') {
      const pm = placingMode;
      if (pm && pm.kind === 'transformer') {
        setPlacingMode(null);
      } else {
        setPlacingMode({ kind: 'transformer' });
        setLineDrawingMode(null);
      }
    } else if (def.kind === 'generator') {
      const pm = placingMode;
      if (pm && pm.kind === 'generator') {
        setPlacingMode(null);
      } else {
        setPlacingMode({ kind: 'generator' });
        setLineDrawingMode(null);
      }
    } else if (def.kind === 'compensator') {
      const pm = placingMode;
      if (pm && pm.kind === 'compensator') {
        setPlacingMode(null);
      } else {
        setPlacingMode({ kind: 'compensator' });
        setLineDrawingMode(null);
      }
    }
  }

  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData(DRAG_TYPE, def.id);
    e.dataTransfer.effectAllowed = 'copy';
  }

  return (
    <div
      title={`${def.label}: ${def.description}`}
      draggable
      onDragStart={onDragStart}
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        borderRadius: 6,
        cursor: 'grab',
        userSelect: 'none',
        background: isActive ? '#0F3B66' : '#131F2E',
        border: `1px solid ${isActive ? '#4FC3F7' : '#1E3A5F'}`,
        marginBottom: 4,
        transition: 'background 0.15s',
        fontSize: 12,
        color: '#E8F0FE',
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#1A2A3A'; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = '#131F2E'; }}
    >
      <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{def.emoji}</span>
      <span style={{ fontWeight: isActive ? 700 : 400, color: isActive ? '#4FC3F7' : '#E8F0FE' }}>
        {def.label}
      </span>
    </div>
  );
}

export function ComponentPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const lineDrawingMode = useNetworkStore((s) => s.lineDrawingMode);
  const placingMode = useNetworkStore((s) => s.placingMode);

  return (
    <div
      style={{
        width: collapsed ? 32 : 200,
        minWidth: collapsed ? 32 : 200,
        background: '#0D1B2A',
        borderRight: '1px solid #1E3A5F',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.2s, min-width 0.2s',
        zIndex: 10,
        position: 'relative',
      }}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        title={collapsed ? 'Vis panel' : 'Skjul panel'}
        style={{
          position: 'absolute',
          top: 8,
          right: collapsed ? 4 : 8,
          background: '#1A2A3A',
          border: '1px solid #1E3A5F',
          borderRadius: 4,
          color: '#4FC3F7',
          cursor: 'pointer',
          padding: '2px 6px',
          fontSize: 11,
          zIndex: 20,
          whiteSpace: 'nowrap',
        }}
      >
        {collapsed ? '▶' : '◀'}
      </button>

      {!collapsed && (
        <div style={{ overflowY: 'auto', padding: '8px 8px 8px', paddingTop: 36, flex: 1 }}>
          {/* Mode indicator */}
          {(lineDrawingMode || (placingMode && placingMode.kind !== 'bus')) && (
            <div
              style={{
                background: '#0F3B55',
                border: '1px solid #4FC3F7',
                borderRadius: 5,
                padding: '4px 8px',
                fontSize: 11,
                color: '#4FC3F7',
                marginBottom: 8,
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              {lineDrawingMode
                ? <>Klikk buss 1 → buss 2</>
                : placingMode?.kind === 'transformer'
                ? <>Klikk buss 1 → buss 2<br />(for transformator)</>
                : placingMode?.kind === 'generator'
                ? <>Klikk på en buss<br />(koble til generator)</>
                : <>Klikk på en buss<br />(koble til kondensator)</>}
              <br />
              <span style={{ color: '#9E9E9E' }}>ESC for å avbryte</span>
            </div>
          )}

          {SECTIONS.map((section) => {
            const items = bySection(section);
            if (items.length === 0) return null;
            return (
              <div key={section} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#4FC3F7',
                    letterSpacing: '0.08em',
                    marginBottom: 6,
                    paddingBottom: 3,
                    borderBottom: '1px solid #1E3A5F',
                  }}
                >
                  {section}
                </div>
                {items.map((def) => (
                  <PaletteItem key={def.id} def={def} />
                ))}
              </div>
            );
          })}

          <div
            style={{
              fontSize: 10,
              color: '#4A5568',
              marginTop: 8,
              lineHeight: 1.5,
              paddingTop: 8,
              borderTop: '1px solid #1E3A5F',
            }}
          >
            Dra til canvas, eller klikk for plassering
          </div>
        </div>
      )}
    </div>
  );
}

