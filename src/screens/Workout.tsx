import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { MODE_META, MUSCLE_LABEL, allExercises } from '../engine/exercises';
import { COMPLETION_XP, PR_XP, setXp, sessionTotals, type Summary } from '../engine/game';
import { progression, recommendPlan } from '../engine/recommend';
import type { AppState, Exercise, Mode, Muscle, Session, SetEntry, Track, TrainStat } from '../engine/types';
import { actions } from '../store';
import { NumInput, Panel, Sheet, SystemTag, useCountUp } from '../components/ui';
import { buzz, chime, fmt, fmtClock, fmtSet, fmtVolume, fromUnit, inUnit, toUnit } from '../util';

/* ------------------------------------------------------------------ */
/* Gate selection                                                      */
/* ------------------------------------------------------------------ */

export function GateSelect({ state, summary, exMap }: { state: AppState; summary: Summary; exMap: Map<string, Exercise> }) {
  const [mode, setMode] = useState<Mode>(() => lastMode(state) ?? 'gym');
  const plan = useMemo(
    () => recommendPlan(mode, state.sessions, allExercises(state.customExercises), exMap, Date.now()),
    [mode, state.sessions, state.customExercises, exMap],
  );

  const start = (ids: string[] = []) => {
    if (state.profile.sound) chime('gate');
    buzz(40);
    actions.startWorkout(mode, ids);
  };

  return (
    <div className="screen stagger">
      <Panel glow>
        <SystemTag>GATE DETECTED</SystemTag>
        <h2 className="h2">Choose your Gate</h2>
        <p className="muted small">Every completed set grants XP. Beat a previous best for a Limit Break bonus.</p>
      </Panel>

      <div className="gate-list">
        {(Object.keys(MODE_META) as Mode[]).map((m) => (
          <button key={m} className={`gate-card gate-${m} ${mode === m ? 'on' : ''}`} onClick={() => { setMode(m); buzz(10); }}>
            <span className="gate-portal"><span>{MODE_META[m].icon}</span></span>
            <span className="gate-text">
              <strong>{MODE_META[m].gate}</strong>
              <span className="muted small">{MODE_META[m].label} · {MODE_META[m].blurb}</span>
            </span>
            <span className="gate-count mono">{summary.byMode[m]}</span>
          </button>
        ))}
      </div>

      <Panel title={<SystemTag>RECOMMENDED RAID</SystemTag>} right={<span className="muted small">{plan.focus.map((f) => MUSCLE_LABEL[f]).join(' · ')}</span>} className="plan">
        <p className="muted small plan-reason">{plan.reason}</p>
        <ol className="plan-list">
          {plan.exerciseIds.map((id) => {
            const ex = exMap.get(id)!;
            const p = progression(id, state.sessions, exMap);
            return (
              <li key={id}>
                <span>{ex.name}</span>
                <span className="muted small mono">{p ? fmtSet(p.next, ex.track, state.profile.unit) : MUSCLE_LABEL[ex.muscle]}</span>
              </li>
            );
          })}
        </ol>
        <button className="btn btn-gate block" onClick={() => start(plan.exerciseIds)}>⚔ Accept raid</button>
        <button className="btn btn-ghost block small" onClick={() => start()}>Enter empty {MODE_META[mode].gate}</button>
      </Panel>
    </div>
  );
}

function lastMode(state: AppState): Mode | undefined {
  return state.sessions[state.sessions.length - 1]?.mode;
}

/* ------------------------------------------------------------------ */
/* Active workout                                                      */
/* ------------------------------------------------------------------ */

function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    const vis = () => setNow(Date.now());
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); };
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
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [floats, setFloats] = useState<{ id: number; xp: number; key: string }[]>([]);

  const liveXp = a.exercises.reduce(
    (sum, we) => sum + we.sets.reduce((s, set) => s + setXp(set, exMap.get(we.exerciseId)), 0), 0,
  );
  const doneSets = a.exercises.reduce((n, we) => n + we.sets.filter((s) => s.done).length, 0);
  const openSets = a.exercises.reduce((n, we) => n + we.sets.filter((s) => !s.done).length, 0);
  const shownXp = useCountUp(liveXp, 400);

  const restLeft = a.restEnd ? Math.ceil((a.restEnd - now) / 1000) : 0;
  useEffect(() => {
    if (a.restEnd && restLeft <= 0) {
      actions.setRest(null);
      if (state.profile.sound) chime('rest');
      buzz(200);
    }
  }, [a.restEnd, restLeft, state.profile.sound]);

  const toggleDone = (ei: number, si: number, set: SetEntry) => {
    const ex = exMap.get(a.exercises[ei].exerciseId);
    actions.updateSet(ei, si, { done: !set.done });
    if (!set.done) {
      buzz();
      if (state.profile.sound) chime('tap');
      actions.setRest(Date.now() + (a.mode === 'bodyweight' ? 60 : 90) * 1000);
      const xp = setXp({ ...set, done: true }, ex);
      if (xp > 0) {
        const f = { id: Date.now(), xp, key: `${ei}-${si}` };
        setFloats((l) => [...l, f]);
        setTimeout(() => setFloats((l) => l.filter((x) => x.id !== f.id)), 1100);
      }
    }
  };

  const finish = (tickAll = false) => {
    if (tickAll) {
      a.exercises.forEach((we, ei) => we.sets.forEach((s, si) => {
        if (!s.done && setXp({ ...s, done: true }, exMap.get(we.exerciseId)) > 0) actions.updateSet(ei, si, { done: true });
      }));
    }
    setConfirmFinish(false);
    const res = actions.finishWorkout();
    if (!res) return;
    if (state.profile.sound) chime('clear');
    onFinished(res.session);
  };

  const onFinishTap = () => {
    if (doneSets === 0 && openSets === 0) return;
    if (openSets > 0) setConfirmFinish(true);
    else finish();
  };

  const restTotal = a.mode === 'bodyweight' ? 60 : 90;

  return (
    <div className="screen workout">
      <div className="wk-head">
        <div>
          <SystemTag>{MODE_META[a.mode].gate.toUpperCase()}</SystemTag>
          <div className="wk-clock mono">{fmtClock((now - a.startedAt) / 1000)}</div>
        </div>
        <div className="wk-xp">
          <span className="mono">+{fmt(shownXp)}</span>
          <span className="muted small">XP · {doneSets} sets</span>
        </div>
      </div>

      {a.exercises.length === 0 && (
        <Panel className="empty-gate">
          <div className="empty-portal" />
          <p className="muted center">The Gate is open. Add your first exercise to begin.</p>
        </Panel>
      )}

      {a.exercises.map((we, ei) => {
        const ex = exMap.get(we.exerciseId);
        if (!ex) return null;
        const prog = progression(ex.id, state.sessions, exMap);
        const allDone = we.sets.length > 0 && we.sets.every((s) => s.done);
        return (
          <Panel key={`${we.exerciseId}-${ei}`} className={`ex-panel ${allDone ? 'ex-done' : ''}`} title={ex.name} right={
            <span className="ex-actions">
              <button className="icon-btn" aria-label="Move up" disabled={ei === 0} onClick={() => actions.moveExercise(ei, -1)}>↑</button>
              <button className="icon-btn" aria-label="Move down" disabled={ei === a.exercises.length - 1} onClick={() => actions.moveExercise(ei, 1)}>↓</button>
              <button className="icon-btn" aria-label="Remove exercise" onClick={() => actions.removeExercise(ei)}>✕</button>
            </span>
          }>
            {prog && (
              <button className="hint" onClick={() => { actions.applyToOpenSets(ei, prog.next); buzz(10); }}>
                <span className="hint-tag">SYSTEM</span>
                <span className="hint-body">
                  Last {fmtSet(prog.last, ex.track, unit)} → <strong>try {fmtSet(prog.next, ex.track, unit)}</strong>
                </span>
                <span className="hint-apply">Apply</span>
              </button>
            )}
            <div className={`set-grid track-${ex.track}`}>
              <span className="set-h">SET</span>
              {ex.track === 'weight' && <span className="set-h">{unit.toUpperCase()}</span>}
              {ex.track !== 'time' && <span className="set-h">REPS</span>}
              {ex.track === 'time' && <span className="set-h">SECONDS</span>}
              <span className="set-h">✓</span>
              {we.sets.map((s, si) => (
                <SetRow key={s.id} index={si} track={ex.track} unit={unit} set={s}
                  float={floats.find((f) => f.key === `${ei}-${si}`)?.xp}
                  onChange={(p) => actions.updateSet(ei, si, p)}
                  onToggle={() => toggleDone(ei, si, s)}
                  onRemove={() => actions.removeSet(ei, si)} />
              ))}
            </div>
            <button className="btn btn-ghost block small" onClick={() => actions.addSet(ei)}>+ Add set</button>
          </Panel>
        );
      })}

      <button className="btn btn-outline block" onClick={() => setPicker(true)}>+ Add exercise</button>
      <button className="btn btn-gate block" disabled={doneSets === 0 && openSets === 0} onClick={onFinishTap}>
        Clear the Gate{liveXp > 0 ? ` · +${fmt(liveXp + COMPLETION_XP)} XP` : ''}
      </button>
      <button className="btn btn-ghost block danger" onClick={() => setConfirmQuit(true)}>Abandon Gate</button>

      {a.restEnd && restLeft > 0 && (
        <div className="rest-bar" style={{ '--p': `${Math.max(0, Math.min(1, restLeft / restTotal)) * 100}%` } as CSSProperties}>
          <span className="rest-ring" />
          <span className="muted small">REST</span>
          <span className="mono rest-time">{fmtClock(restLeft)}</span>
          <button className="btn btn-ghost small" onClick={() => actions.setRest(a.restEnd! - 15_000)}>−15</button>
          <button className="btn btn-ghost small" onClick={() => actions.setRest(a.restEnd! + 15_000)}>+15</button>
          <button className="btn btn-primary small" onClick={() => actions.setRest(null)}>Skip</button>
        </div>
      )}

      <ExercisePicker open={picker} mode={a.mode} state={state} onClose={() => setPicker(false)}
        onPick={(id) => { actions.addExercise(id); setPicker(false); }} />

      <Sheet open={confirmFinish} onClose={() => setConfirmFinish(false)} title="Unticked sets">
        <p className="muted">
          {openSets} set{openSets === 1 ? ' is' : 's are'} not ticked. Unticked sets don't count toward XP or records.
        </p>
        <button className="btn btn-primary block" onClick={() => finish(true)}>Tick all & clear</button>
        <button className="btn btn-outline block" disabled={doneSets === 0} onClick={() => finish(false)}>
          Clear with ticked sets only
        </button>
        <button className="btn btn-ghost block" onClick={() => setConfirmFinish(false)}>Keep training</button>
      </Sheet>

      <Sheet open={confirmQuit} onClose={() => setConfirmQuit(false)} title="Abandon Gate?">
        <p className="muted">All sets in this workout will be lost and no XP is awarded.</p>
        <button className="btn btn-danger block" onClick={() => { actions.discardWorkout(); setConfirmQuit(false); }}>
          Abandon
        </button>
      </Sheet>
    </div>
  );
}

function SetRow({ index, track, unit, set, float, onChange, onToggle, onRemove }: {
  index: number; track: Track; unit: 'kg' | 'lb'; set: SetEntry; float?: number;
  onChange: (p: Partial<SetEntry>) => void; onToggle: () => void; onRemove: () => void;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 2500);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <>
      <button className={`set-idx mono ${armed ? 'armed' : ''} ${set.done ? 'done' : ''}`}
        onClick={() => (armed ? onRemove() : setArmed(true))}
        aria-label={armed ? `Confirm remove set ${index + 1}` : `Set ${index + 1}, tap twice to remove`}>
        {armed ? '✕' : index + 1}
      </button>
      {track === 'weight' && (
        <NumInput decimal label={`Set ${index + 1} weight`} value={set.weight == null ? undefined : inUnit(set.weight, unit)}
          onChange={(n) => onChange({ weight: fromUnit(n, unit) })} />
      )}
      {track !== 'time' && (
        <NumInput label={`Set ${index + 1} reps`} value={set.reps} onChange={(n) => onChange({ reps: Math.round(n) })} />
      )}
      {track === 'time' && (
        <NumInput label={`Set ${index + 1} seconds`} value={set.seconds} onChange={(n) => onChange({ seconds: Math.round(n) })} />
      )}
      <button className={`set-check ${set.done ? 'on' : ''}`} onClick={onToggle} aria-label="Complete set" aria-pressed={set.done}>
        ✓
        {float != null && <span className="xp-float mono">+{float}</span>}
      </button>
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

  useEffect(() => { if (open) { setQ(''); setCreating(false); } }, [open]);

  const inWorkout = useMemo(() => new Set(state.active?.exercises.map((e) => e.exerciseId)), [state.active]);
  const recentIds = useMemo(() => {
    const seen: string[] = [];
    for (let i = state.sessions.length - 1; i >= 0 && seen.length < 6; i--) {
      for (const we of state.sessions[i].exercises) if (!seen.includes(we.exerciseId)) seen.push(we.exerciseId);
    }
    return seen;
  }, [state.sessions]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return allExercises(state.customExercises)
      .filter((e) => all || e.modes.includes(mode))
      .filter((e) => muscle === 'all' || e.muscle === muscle)
      .filter((e) => !term || e.name.toLowerCase().includes(term))
      .sort((x, y) => x.name.localeCompare(y.name));
  }, [q, muscle, all, mode, state.customExercises]);

  const recent = !q.trim() && muscle === 'all' ? list.filter((e) => recentIds.includes(e.id)) : [];
  const rest = list.filter((e) => !recent.includes(e));

  const row = (e: Exercise) => (
    <li key={e.id}>
      <button onClick={() => onPick(e.id)} className={inWorkout.has(e.id) ? 'in-workout' : ''}>
        <span>{e.name}{e.custom && <span className="tag">custom</span>}{inWorkout.has(e.id) && <span className="tag tag-on">added</span>}</span>
        <span className="muted small">{MUSCLE_LABEL[e.muscle]} · {e.stat.toUpperCase()}</span>
      </button>
    </li>
  );

  return (
    <Sheet open={open} onClose={onClose} title="Add exercise">
      {creating ? (
        <CustomExerciseForm mode={mode} initialName={q} onCancel={() => setCreating(false)}
          onCreate={(id) => { setCreating(false); onPick(id); }} />
      ) : (
        <>
          <input className="search" type="search" placeholder="Search exercises…" value={q} onChange={(e) => setQ(e.target.value)} />
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
          {recent.length > 0 && (
            <>
              <div className="pick-head">Recent</div>
              <ul className="pick-list">{recent.map(row)}</ul>
              <div className="pick-head">All</div>
            </>
          )}
          <ul className="pick-list">
            {rest.map(row)}
            {!list.length && <li className="muted center">No match{!all ? ' — try "All gates"' : ''}.</li>}
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
  const xp = useCountUp(session.xp, 1200);
  return (
    <div className="screen stagger">
      <Panel glow className="cleared">
        <div className="cleared-rays" aria-hidden="true" />
        <SystemTag>GATE CLEARED</SystemTag>
        <div className="cleared-xp mono">+{fmt(xp)} XP</div>
        <div className="stat-row">
          <div><strong>{t.minutes < 1 ? '<1' : t.minutes}</strong><span>min</span></div>
          <div><strong>{t.sets}</strong><span>sets</span></div>
          <div><strong>{fmt(t.reps)}</strong><span>reps</span></div>
          {t.volume > 0 && <div><strong>{fmtVolume(t.volume, unit)}</strong><span>moved</span></div>}
        </div>
      </Panel>
      {session.prs.length > 0 && (
        <Panel title="⚡ Limit Breaks" className="prs">
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
      <Panel title="Loot">
        <ul className="list">
          {session.exercises.map((we, i) => {
            const ex = exMap.get(we.exerciseId);
            const xpEx = we.sets.reduce((s, set) => s + setXp(set, ex), 0);
            return (
              <li key={i}>
                <span>{ex?.name} <span className="muted small">× {we.sets.length}</span></span>
                <span className="mono small xp-text">+{xpEx}</span>
              </li>
            );
          })}
          <li><span className="muted">Clear bonus</span><span className="mono small xp-text">+{COMPLETION_XP}</span></li>
          {session.prs.length > 0 && <li><span className="muted">Limit Break bonus</span><span className="mono small xp-text">+{session.prs.length * PR_XP}</span></li>}
        </ul>
      </Panel>
      <button className="btn btn-primary block" onClick={onClose}>Return to base</button>
    </div>
  );
}
