import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { TIER_COLOR } from '../engine/badges';
import type { RankId } from '../engine/game';
import { dismissToast, useToasts } from '../store';

export function Panel({ title, right, children, glow, className = '', style }: {
  title?: ReactNode; right?: ReactNode; children: ReactNode; glow?: boolean; className?: string; style?: CSSProperties;
}) {
  return (
    <section className={`panel ${glow ? 'panel-glow' : ''} ${className}`} style={style}>
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

/** Progress bar that animates from empty on first paint, then tweens on change. */
export function Bar({ value, max, color, thin }: { value: number; max: number; color?: string; thin?: boolean }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const r = requestAnimationFrame(() => setShown(pct));
    return () => cancelAnimationFrame(r);
  }, [pct]);
  return (
    <div className={`bar ${thin ? 'bar-thin' : ''} ${pct >= 100 ? 'bar-full' : ''}`}>
      <div className="bar-fill" style={{ width: `${shown}%`, ...(color ? { background: color, boxShadow: `0 0 10px ${color}` } : {}) }} />
    </div>
  );
}

export function RankEmblem({ rank, size = 56, pulse }: { rank: RankId; size?: number; pulse?: boolean }) {
  const c = TIER_COLOR[rank];
  return (
    <div className={`rank-emblem ${pulse ? 'pulse' : ''}`} style={{ width: size, height: size, '--c': c, fontSize: size * 0.46 } as CSSProperties}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <polygon points="50,4 92,27 92,73 50,96 8,73 8,27" fill={`${c}22`} stroke={c} strokeWidth="5" />
      </svg>
      <span>{rank}</span>
    </div>
  );
}

/** Stops the page behind a sheet/overlay from scrolling on iOS. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const y = window.scrollY;
    const b = document.body.style;
    const prev = { position: b.position, top: b.top, width: b.width };
    Object.assign(b, { position: 'fixed', top: `-${y}px`, width: '100%' });
    return () => {
      Object.assign(b, prev);
      window.scrollTo(0, y);
    };
  }, [active]);
}

export function Sheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
}) {
  useScrollLock(open);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="sheet-grip" />
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

/**
 * Numeric text input that keeps what you type ("22.", "", "0.5") while editing and only
 * hands parsed numbers upward. Fixes decimals being swallowed by controlled number inputs.
 */
export function NumInput({ value, onChange, decimal, label }: {
  value: number | undefined; onChange: (n: number) => void; decimal?: boolean; label: string;
}) {
  const fmt = (v: number | undefined) => (v == null ? '' : String(Math.round(v * 10) / 10));
  const [text, setText] = useState(fmt(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(fmt(value));
  }, [value]);
  return (
    <input
      className="set-in" type="text" inputMode={decimal ? 'decimal' : 'numeric'} aria-label={label}
      autoComplete="off" enterKeyHint="done" value={text}
      onFocus={(e) => { focused.current = true; e.currentTarget.select(); }}
      onBlur={() => { focused.current = false; setText(fmt(value)); }}
      onChange={(e) => {
        const raw = e.target.value.replace(',', '.');
        const ok = decimal ? /^\d*\.?\d{0,2}$/ : /^\d*$/;
        if (!ok.test(raw)) return;
        setText(raw);
        const n = raw === '' || raw === '.' ? 0 : Number(raw);
        if (Number.isFinite(n)) onChange(n);
      }}
    />
  );
}

/** Animates a number from 0 (or its previous value) to the target. */
export function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setV(target); return; }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(a + (target - a) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export function Toasts() {
  const list = useToasts();
  return (
    <div className="toasts" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className="toast" style={{ '--ttl': `${t.ttl}ms` } as CSSProperties}>
          <span className="sys-tag">[ SYSTEM ]</span>
          <span className="toast-text">{t.text}</span>
          {t.action && (
            <button className="toast-btn" onClick={() => { t.action!.run(); dismissToast(t.id); }}>{t.action.label}</button>
          )}
          <i className="toast-timer" />
        </div>
      ))}
    </div>
  );
}

/** GitHub-style training calendar: last N weeks, Monday-first rows. */
export function Heatmap({ days, weeks = 15 }: { days: Map<number, number>; weeks?: number }) {
  const today = new Date();
  const todayNum = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86_400_000);
  const dow = (todayNum + 3) % 7; // 0 = Monday
  const start = todayNum - dow - (weeks - 1) * 7;
  const cells = [];
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const n = start + w * 7 + d;
      const xp = days.get(n) ?? 0;
      const lvl = n > todayNum ? -1 : xp === 0 ? 0 : xp < 150 ? 1 : xp < 300 ? 2 : 3;
      cells.push(<i key={n} className={`hm hm-${lvl} ${n === todayNum ? 'hm-today' : ''}`} style={{ gridColumn: w + 1, gridRow: d + 1 }} />);
    }
  }
  return (
    <div className="heatmap-wrap">
      <div className="heatmap" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>{cells}</div>
      <div className="hm-legend muted small">
        <span>{weeks} weeks</span>
        <span className="hm-scale">less <i className="hm hm-0" /><i className="hm hm-1" /><i className="hm hm-2" /><i className="hm hm-3" /> more</span>
      </div>
    </div>
  );
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
