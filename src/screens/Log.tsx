import { useMemo, useState } from 'react';
import { MODE_META } from '../engine/exercises';
import { dayNumber, sessionTotals, weekNumber } from '../engine/game';
import type { AppState, Exercise } from '../engine/types';
import { actions } from '../store';
import { Heatmap, Panel, SystemTag } from '../components/ui';
import { fmt, fmtDate, fmtSet, fmtTime, fmtVolume } from '../util';

export function Log({ state, exMap }: { state: AppState; exMap: Map<string, Exercise> }) {
  const [open, setOpen] = useState<string | null>(null);
  const unit = state.profile.unit;
  const sessions = [...state.sessions].reverse();

  const { days, thisWeek, lastWeek } = useMemo(() => {
    const days = new Map<number, number>();
    const wk = weekNumber(dayNumber(Date.now()));
    const agg = { thisWeek: { n: 0, xp: 0, sets: 0 }, lastWeek: { n: 0, xp: 0, sets: 0 } };
    for (const s of state.sessions) {
      const d = dayNumber(s.startedAt);
      days.set(d, (days.get(d) ?? 0) + s.xp);
      const w = weekNumber(d);
      const bucket = w === wk ? agg.thisWeek : w === wk - 1 ? agg.lastWeek : null;
      if (bucket) {
        bucket.n++; bucket.xp += s.xp;
        bucket.sets += sessionTotals(s, exMap).sets;
      }
    }
    return { days, ...agg };
  }, [state.sessions, exMap]);

  const delta = (a: number, b: number) => (b === 0 ? '' : a >= b ? `▲ ${Math.round(((a - b) / b) * 100)}%` : `▼ ${Math.round(((b - a) / b) * 100)}%`);

  return (
    <div className="screen stagger">
      <Panel glow>
        <SystemTag>GATE RECORDS</SystemTag>
        <h2 className="h2">{sessions.length} Gate{sessions.length === 1 ? '' : 's'} cleared</h2>
        <Heatmap days={days} />
      </Panel>

      <div className="grid-2">
        <Panel title="This week" className="mini">
          <div className="big-stat">{fmt(thisWeek.xp)}<small> XP</small></div>
          <div className="muted small">
            {thisWeek.n} gates · {thisWeek.sets} sets{' '}
            <span className={thisWeek.xp >= lastWeek.xp ? 'up' : 'down'}>{delta(thisWeek.xp, lastWeek.xp)}</span>
          </div>
        </Panel>
        <Panel title="Last week" className="mini">
          <div className="big-stat">{fmt(lastWeek.xp)}<small> XP</small></div>
          <div className="muted small">{lastWeek.n} gates · {lastWeek.sets} sets</div>
        </Panel>
      </div>

      {!sessions.length && (
        <Panel className="empty">
          <div className="empty-portal" />
          <p className="muted center">No records yet. Your story starts with the first Gate.</p>
        </Panel>
      )}
      {sessions.map((s) => {
        const t = sessionTotals(s, exMap);
        const isOpen = open === s.id;
        return (
          <Panel key={s.id} className={`log-item log-${s.mode} ${isOpen ? 'open' : ''}`}>
            <button className="log-head" onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen}>
              <span className="log-icon">{MODE_META[s.mode].icon}</span>
              <span className="log-main">
                <strong>{MODE_META[s.mode].gate}{s.prs.length > 0 && <span className="pr-pill">⚡ {s.prs.length}</span>}</strong>
                <span className="muted small">{fmtDate(s.startedAt)} · {fmtTime(s.startedAt)} · {t.minutes} min · {t.sets} sets</span>
              </span>
              <span className="log-xp mono">+{fmt(s.xp)}</span>
              <span className="chev" aria-hidden="true">›</span>
            </button>
            {isOpen && (
              <div className="log-detail">
                <div className="muted small">
                  {fmt(t.reps)} reps{t.volume > 0 && ` · ${fmtVolume(t.volume, unit)}`}
                  {t.seconds > 0 && ` · ${Math.round(t.seconds / 60)} min timed`}
                </div>
                {s.exercises.map((we, i) => {
                  const ex = exMap.get(we.exerciseId);
                  const pr = s.prs.some((p) => p.exerciseId === we.exerciseId);
                  return (
                    <div key={i} className="log-ex">
                      <strong>{ex?.name ?? 'Deleted exercise'}{pr && ' ⚡'}</strong>
                      <span className="muted small">
                        {ex ? we.sets.map((set) => fmtSet(set, ex.track, unit).replace(` ${unit}`, '')).join(' · ') : ''}
                      </span>
                    </div>
                  );
                })}
                <button className="btn btn-ghost danger small" onClick={() => actions.deleteSession(s.id)}>Delete record</button>
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
}
