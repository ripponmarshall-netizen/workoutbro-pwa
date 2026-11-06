import type { CSSProperties, ReactNode } from 'react';
import { TIER_COLOR } from '../engine/badges';
import type { RankId } from '../engine/game';

export function Panel({ title, right, children, glow, className = '' }: {
  title?: ReactNode; right?: ReactNode; children: ReactNode; glow?: boolean; className?: string;
}) {
  return (
    <section className={`panel ${glow ? 'panel-glow' : ''} ${className}`}>
      {title && (
        <header className="panel-head">
          <span className="panel-title">{title}</span>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function Bar({ value, max, color, thin }: { value: number; max: number; color?: string; thin?: boolean }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`bar ${thin ? 'bar-thin' : ''}`}>
      <div className="bar-fill" style={{ width: `${pct}%`, ...(color ? { background: color, boxShadow: `0 0 10px ${color}` } : {}) }} />
    </div>
  );
}

export function RankEmblem({ rank, size = 56 }: { rank: RankId; size?: number }) {
  const c = TIER_COLOR[rank];
  return (
    <div className="rank-emblem" style={{ width: size, height: size, '--c': c, fontSize: size * 0.46 } as CSSProperties}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <polygon points="50,4 92,27 92,73 50,96 8,73 8,27" fill={`${c}22`} stroke={c} strokeWidth="5" />
      </svg>
      <span>{rank}</span>
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <header className="sheet-head">
          <span className="panel-title">{title}</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

export function SystemTag({ children = 'SYSTEM' }: { children?: ReactNode }) {
  return <span className="sys-tag">[ {children} ]</span>;
}

type IconName = 'home' | 'gate' | 'log' | 'award' | 'user';
const PATHS: Record<IconName, string> = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  gate: 'M5 21V8a7 7 0 0 1 14 0v13M9 21v-9a3 3 0 0 1 6 0v9M3 21h18',
  log: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  award: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9L7 22l5-3 5 3-1.2-8.1',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
};

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
