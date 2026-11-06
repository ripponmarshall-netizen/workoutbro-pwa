import { useState } from 'react';
import { MODE_META } from '../engine/exercises';
import { sessionTotals } from '../engine/game';
import type { AppState, Exercise } from '../engine/types';
import { actions } from '../store';
import { Panel, Sheet, SystemTag } from '../components/ui';
import { fmt, fmtDate, fmtTime, fmtVolume, toUnit } from '../util';

export function Log({ state, exMap }: { state: AppState; exMap: Map<string, Exercise> }) {
  const [open, setOpen] = useState<string | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const unit = state.profile.unit;
  const sessions = [...state.sessions].reverse();

  return (
    <div className="screen">
      <Panel glow>
        <SystemTag>GATE RECORDS</SystemTag>
        <h2 className="h2">{sessions.length} Gate{sessions.length === 1 ? '' : 's'} cleared</h2>
      </Panel>
      {!sessions.length && <p className="muted center">No records yet. Your story starts with the first Gate.</p>}
      {sessions.map((s) => {
        const t = sessionTotals(s, exMap);
        const isOpen = open === s.id;
        return (
          <Panel key={s.id} className="log-item">
            <button className="log-head" onClick={() => setOpen(isOpen ? null : s.id)}>
              <span className="log-icon">{MODE_META[s.mode].icon}</span>
              <span className="log-main">
                <strong>{MODE_META[s.mode].gate}</strong>
                <span className="muted small">{fmtDate(s.startedAt)} · {fmtTime(s.startedAt)} · {t.minutes} min</span>
              </span>
              <span className="log-xp mono">+{fmt(s.xp)}</span>
            </button>
            {isOpen && (
              <div className="log-detail">
                <div className="muted small">
                  {t.sets} sets · {fmt(t.reps)} reps{t.volume > 0 && ` · ${fmtVolume(t.volume, unit)}`}
                  {t.seconds > 0 && ` · ${Math.round(t.seconds / 60)} min timed`}
                  {s.prs.length > 0 && ` · ⚡ ${s.prs.length} PR`}
                </div>
                {s.exercises.map((we, i) => {
                  const ex = exMap.get(we.exerciseId);
                  return (
                    <div key={i} className="log-ex">
                      <strong>{ex?.name ?? 'Deleted exercise'}</strong>
                      <span className="muted small">
                        {we.sets.map((set) =>
                          ex?.track === 'time' ? `${set.seconds}s`
                            : ex?.track === 'weight' ? `${toUnit(set.weight, unit)}×${set.reps}`
                              : `${set.reps}`,
                        ).join(' · ')}
                      </span>
                    </div>
                  );
                })}
                <button className="btn btn-ghost danger small" onClick={() => setDel(s.id)}>Delete record</button>
              </div>
            )}
          </Panel>
        );
      })}
      <Sheet open={!!del} onClose={() => setDel(null)} title="Delete this record?">
        <p className="muted">The workout and its XP are removed. Badges you already earned stay unlocked.</p>
        <button className="btn btn-danger block" onClick={() => { actions.deleteSession(del!); setDel(null); }}>Delete</button>
      </Sheet>
    </div>
  );
}
