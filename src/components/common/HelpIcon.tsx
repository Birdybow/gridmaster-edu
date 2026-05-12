import { useState } from 'react';

interface HelpIconProps {
  text: string;
  title?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  size?: number;
}

export function HelpIcon({ text, title, placement = 'top', size = 14 }: HelpIconProps) {
  const [visible, setVisible] = useState(false);

  const offsets: Record<string, React.CSSProperties> = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 6 },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 6 },
  };

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: '#1E3A5F',
          color: '#4FC3F7',
          fontSize: size * 0.7,
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'help',
          flexShrink: 0,
          border: '1px solid #4FC3F7',
          userSelect: 'none',
        }}
      >
        ?
      </span>

      {visible && (
        <div
          style={{
            position: 'absolute',
            ...offsets[placement],
            background: '#0F2A45',
            border: '1px solid #1E3A5F',
            borderRadius: 6,
            padding: '8px 12px',
            minWidth: 200,
            maxWidth: 300,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          {title && (
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4FC3F7', marginBottom: 4 }}>
              {title}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#CFD8DC', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
            {text}
          </div>
        </div>
      )}
    </span>
  );
}
