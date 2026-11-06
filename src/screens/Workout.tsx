import { useEffect, useMemo, useState } from 'react';
import { MODE_META, MUSCLE_LABEL, allExercises } from '../engine/exercises';
import { setXp, sessionTotals, type Summary } from '../engine/game';
import type { AppState, Exercise, Mode, Muscle, Session, SetEntry, Track, TrainStat } from '../engine/types';
import { actions } from '../store';
import { Panel, Sheet, SystemTag } from '../components/ui';
import { buzz, chime, fmt, fmtClock, fmtVolume, fromUnit, toUnit } from '../util';

/* ------------------------------------------------------------------ */
/* Gate selection                                                      */
/* ------------------------------------------------------------------ */

export function GateSelect({ summary }: { summary: Summary }) {
  return (
    <div className="screen">
      <Panel glow>
        <SystemTag>GATE DETECTED</SystemTag>
        <h2 className="h2">Choose your Gate</h2>
        <p className="muted">Every completed set grants XP. Beat a previous best for a Limit Break bonus.</p>
      </Panel>
      {(Object.keys(MODE_META) as Mode[]).map((m) => (
        <button key={m} className={`gate-card gate-${m}`} onClick={() => { chime('tap'); actions.startWorkout(m); }}>
          <span className="gate-icon">{MODE_META[m].icon}</span>
          <span className="gate-text">
            <strong>{MODE_META[m].gate}</strong>
            <span className="muted small">{MODE_META[m].label} · {MODE_META[m].blurb}</span>
          </span>
          <span className="gate-count mono">{summary.byMode[m]} cleared</span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Active workout                                                      */
/* ------------------------------------------------------------------ */

function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function ActiveWorkout({ state, exMap, onFinished }: {
  state: AppState; exMap: Map<string, Exercise>; onFinished: (s: Session) => void;
}) {
  const a = state.active!;
  const unit = state.profile.unit;
  const now = useNow();
  const [picker, setPicker] = useState(false);
  const [restEnd, setRestEnd] = useState<number | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [warn, setWarn] = useState('');

  const liveXp = a.exercises.reduce(
    (sum, we) => sum + we.sets.reduce((s, set) => s + setXp(set, exMap.get(we.exerciseId)), 0), 0,
  );
  const doneSets = a.exercises.reduce((n, we) => n + we.sets.filter((s) => s.done).length, 0);

  const restLeft = restEnd ? Math.ceil((restEnd - now) / 1000) : 0;
  useEffect(() => {
    if (restEnd && restLeft <= 0) {
      setRestEnd(null);
      if (state.profile.sound) chime('rest');
      buzz(200);
    }
  }, [restEnd, restLeft, state.profile.sound]);

  const toggleDone = (ei: number, si: number, done: boolean) => {
    actions.updateSet(ei, si, { done: !done });
    if (!done) {
      buzz();
      if (state.profile.sound) chime('tap');
      setRestEnd(Date.now() + (a.mode === 'bodyweight' ? 60 : 90) * 1000);
    }
  };

  const finish = () => {
    const res = actions.finishWorkout();
    if (!res) { setWarn('Tick at least one completed set before clearing the Gate.'); return; }
    if (state.profile.sound) chime('level');
    onFinished(res.session);
  };

  return (
    <div className="screen workout">
      <div className="wk-head">
        <div>
          <SystemTag>{MODE_META[a.mode].gate.toUpperCase()}</SystemTag>
          <div className="wk-clock mono">{fmtClock((now - a.startedAt) / 1000)}</div>
        </div>
        <div className="wk-xp">
          <span className="mono">+{fmt(liveXp)}</span>
          <span className="muted small">XP · {doneSets} sets</span>
        </div>
      </div>

      {a.exercises.length === 0 && (
        <Panel>
          <p className="muted center">The Gate is open. Add your first exercise to begin.</p>
        </Panel>
      )}

      {a.exercises.map((we, ei) => {
        const ex = exMap.get(we.exerciseId);
        if (!ex) return null;
        return (
          <Panel key={ei} title={ex.name} right={
            <button className="icon-btn" aria-label="Remove exercise" onClick={() => actions.removeExercise(ei)}>✕</button>
          }>
            <div className={`set-grid track-${ex.track}`}>
              <span className="set-h">SET</span>
              {ex.track === 'weight' && <span className="set-h">{unit.toUpperCase()}</span>}
              {ex.track !== 'time' && <span className="set-h">REPS</span>}
              {ex.track === 'time' && <span className="set-h">SECONDS</span>}
              <span className="set-h">✓</span>
              {we.sets.map((s, si) => (
                <SetRow key={s.id} index={si} track={ex.track} unit={unit} set={s}
                  onChange={(p) => actions.updateSet(ei, si, p)}
                  onToggle={() => toggleDone(ei, si, s.done)}
                  onRemove={() => actions.removeSet(ei, si)} />
              ))}
            </div>
            <button className="btn btn-ghost block small" onClick={() => actions.addSet(ei)}>+ Add set</button>
          </Panel>
        );
      })}

      <button className="btn btn-outline block" onClick={() => setPicker(true)}>+ Add exercise</button>
      {warn && <p className="warn">{warn}</p>}
      <button className="btn btn-gate block" onClick={finish}>Clear the Gate</button>
      <button className="btn btn-ghost block danger" onClick={() => setConfirmQuit(true)}>Abandon Gate</button>

      {restEnd && (
        <div className="rest-bar">
          <span className="muted small">REST</span>
          <span className="mono rest-time">{fmtClock(restLeft)}</span>
          <button className="btn btn-ghost small" onClick={() => setRestEnd(restEnd - 15_000)}>−15</button>
          <button className="btn btn-ghost small" onClick={() => setRestEnd(restEnd + 15_000)}>+15</button>
          <button className="btn btn-primary small" onClick={() => setRestEnd(null)}>Skip</button>
        </div>
      )}

      <ExercisePicker open={picker} mode={a.mode} state={state} onClose={() => setPicker(false)}
        onPick={(id) => { actions.addExercise(id); setPicker(false); }} />

      <Sheet open={confirmQuit} onClose={() => setConfirmQuit(false)} title="Abandon Gate?">
        <p className="muted">All sets in this workout will be lost and no XP is awarded.</p>
        <button className="btn btn-danger block" onClick={() => { actions.discardWorkout(); setConfirmQuit(false); }}>
          Abandon
        </button>
      </Sheet>
    </div>
  );
}

function SetRow({ index, track, unit, set, onChange, onToggle, onRemove }: {
  index: number; track: Track; unit: 'kg' | 'lb';
  set: SetEntry;
  onChange: (p: { weight?: number; reps?: number; seconds?: number }) => void;
  onToggle: () => void; onRemove: () => void;
}) {
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v)));
  return (
    <>
      <button className="set-idx mono" onClick={onRemove} aria-label={`Remove set ${index + 1}`} title="Tap to remove">
        {index + 1}
      </button>
      {track === 'weight' && (
        <input className="set-in" type="number" inputMode="decimal" min={0} step="0.5"
          value={toUnit(set.weight, unit)} onFocus={(e) => e.target.select()}
          onChange={(e) => onChange({ weight: fromUnit(num(e.target.value), unit) })} />
      )}
      {track !== 'time' && (
        <input className="set-in" type="number" inputMode="numeric" min={0}
          value={set.reps ?? ''} onFocus={(e) => e.target.select()}
          onChange={(e) => onChange({ reps: Math.round(num(e.target.value)) })} />
      )}
      {track === 'time' && (
        <input className="set-in" type="number" inputMode="numeric" min={0}
          value={set.seconds ?? ''} onFocus={(e) => e.target.select()}
          onChange={(e) => onChange({ seconds: Math.round(num(e.target.value)) })} />
      )}
      <button className={`set-check ${set.done ? 'on' : ''}`} onClick={onToggle} aria-label="Complete set">✓</button>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Exercise picker                                                     */
/* ------------------------------------------------------------------ */

function ExercisePicker({ open, mode, state, onClose, onPick }: {
  open: boolean; mode: Mode; state: AppState; onClose: () => void; onPick: (id: string) => void;
}) {
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState<Muscle | 'all'>('all');
  const [all, setAll] = useState(false);
  const [creating, setCreating] = useState(false);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return allExercises(state.customExercises)
      .filter((e) => all || e.modes.includes(mode))
      .filter((e) => muscle === 'all' || e.muscle === muscle)
      .filter((e) => !term || e.name.toLowerCase().includes(term))
      .sort((x, y) => x.name.localeCompare(y.name));
  }, [q, muscle, all, mode, state.customExercises]);

  return (
    <Sheet open={open} onClose={onClose} title="Add exercise">
      {creating ? (
        <CustomExerciseForm mode={mode} initialName={q} onCancel={() => setCreating(false)}
          onCreate={(id) => { setCreating(false); onPick(id); }} />
      ) : (
        <>
          <input className="search" placeholder="Search exercises…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="chips">
            <button className={`chip ${!all ? 'on' : ''}`} onClick={() => setAll(!all)}>
              {all ? 'All gates' : MODE_META[mode].label}
            </button>
            {(['all', ...Object.keys(MUSCLE_LABEL)] as (Muscle | 'all')[]).map((m) => (
              <button key={m} className={`chip ${muscle === m ? 'on' : ''}`} onClick={() => setMuscle(m)}>
                {m === 'all' ? 'Any' : MUSCLE_LABEL[m]}
              </button>
            ))}
          </div>
          <ul className="pick-list">
            {list.map((e) => (
              <li key={e.id}>
                <button onClick={() => onPick(e.id)}>
                  <span>{e.name}{e.custom && <span className="tag">custom</span>}</span>
                  <span className="muted small">{MUSCLE_LABEL[e.muscle]} · {e.stat.toUpperCase()}</span>
                </button>
              </li>
            ))}
            {!list.length && <li className="muted center">No match.</li>}
          </ul>
          <button className="btn btn-outline block" onClick={() => setCreating(true)}>+ Create custom exercise</button>
        </>
      )}
    </Sheet>
  );
}

function CustomExerciseForm({ mode, initialName, onCancel, onCreate }: {
  mode: Mode; initialName: string; onCancel: () => void; onCreate: (id: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const [track, setTrack] = useState<Track>(mode === 'bodyweight' ? 'reps' : 'weight');
  const [muscle, setMuscle] = useState<Muscle>('full');
  const stat: TrainStat = track === 'time' ? 'agi' : track === 'weight' ? 'str' : 'end';
  return (
    <div className="form">
      <label>Name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sandbag Carry" /></label>
      <label>Tracking
        <select value={track} onChange={(e) => setTrack(e.target.value as Track)}>
          <option value="weight">Weight × reps</option>
          <option value="reps">Reps only</option>
          <option value="time">Time (seconds)</option>
        </select>
      </label>
      <label>Muscle group
        <select value={muscle} onChange={(e) => setMuscle(e.target.value as Muscle)}>
          {Object.entries(MUSCLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <div className="row gap">
        <button className="btn btn-ghost" onClick={onCancel}>Back</button>
        <button className="btn btn-primary grow" disabled={!name.trim()}
          onClick={() => onCreate(actions.addCustomExercise({ name: name.trim(), modes: [mode], muscle, track, stat }))}>
          Create & add
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Gate cleared summary                                                */
/* ------------------------------------------------------------------ */

export function GateCleared({ session, exMap, unit, onClose }: {
  session: Session; exMap: Map<string, Exercise>; unit: 'kg' | 'lb'; onClose: () => void;
}) {
  const t = sessionTotals(session, exMap);
  return (
    <div className="screen">
      <Panel glow className="cleared">
        <SystemTag>GATE CLEARED</SystemTag>
        <div className="cleared-xp mono">+{fmt(session.xp)} XP</div>
        <div className="stat-row">
          <div><strong>{t.minutes}</strong><span>min</span></div>
          <div><strong>{t.sets}</strong><span>sets</span></div>
          <div><strong>{fmt(t.reps)}</strong><span>reps</span></div>
          {t.volume > 0 && <div><strong>{fmtVolume(t.volume, unit)}</strong><span>moved</span></div>}
        </div>
      </Panel>
      {session.prs.length > 0 && (
        <Panel title="⚡ Limit Breaks">
          <ul className="list">
            {session.prs.map((p, i) => (
              <li key={i}>
                <span>{exMap.get(p.exerciseId)?.name}</span>
                <span className="mono small">
                  {p.kind === 'e1rm' ? `e1RM ${toUnit(p.value, unit)} ${unit}` : p.kind === 'reps' ? `${p.value} reps` : `${p.value}s`}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <button className="btn btn-primary block" onClick={onClose}>Return to base</button>
    </div>
  );
}
