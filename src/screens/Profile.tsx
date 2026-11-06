import { useRef, useState } from 'react';
import { TIER_COLOR } from '../engine/badges';
import { computeBests, type Summary } from '../engine/game';
import type { AppState, Exercise } from '../engine/types';
import { actions, toast } from '../store';
import { Panel, RankEmblem, Sheet, SystemTag } from '../components/ui';
import { fmt, fmtDate, fmtVolume, toUnit } from '../util';

const STAT_INFO: Record<keyof Summary['stats'], { label: string; hint: string }> = {
  str: { label: 'STR', hint: 'Strength — weighted lifts & pulls' },
  agi: { label: 'AGI', hint: 'Agility — cardio & explosive work' },
  end: { label: 'END', hint: 'Endurance — high reps, holds, bands' },
  vit: { label: 'VIT', hint: 'Vitality — Gates cleared' },
  wil: { label: 'WIL', hint: 'Willpower — streaks & daily quests' },
};

export function Profile({ state, summary, exMap }: { state: AppState; summary: Summary; exMap: Map<string, Exercise> }) {
  const p = state.profile;
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [reset, setReset] = useState(false);
  const bests = [...computeBests(state.sessions, exMap)]
    .map(([id, b]) => ({ ex: exMap.get(id), b }))
    .filter((x) => x.ex && (x.b.e1rm || x.b.reps || x.b.time))
    .sort((x, y) => x.ex!.name.localeCompare(y.ex!.name));
  const backupStale = state.sessions.length >= 3 && (!p.lastBackup || Date.now() - p.lastBackup > 14 * 86_400_000);
  const maxStat = Math.max(...Object.values(summary.stats), 20);

  const exportFile = () => {
    const blob = new Blob([actions.exportData()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `workoutbro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    actions.updateProfile({ lastBackup: Date.now() });
    toast('Backup exported. Save it to Files or iCloud Drive.');
  };

  const importFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      actions.importData(await f.text());
      setMsg('Backup restored.');
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message}`);
    }
  };

  return (
    <div className="screen stagger">
      <Panel glow>
        <SystemTag>STATUS</SystemTag>
        <div className="status-head">
          <RankEmblem rank={summary.rank.id} size={52} />
          <div>
            <div className="h2">{p.name || 'Hunter'}</div>
            <div className="small" style={{ color: TIER_COLOR[summary.rank.id] }}>Level {summary.level.level} · {summary.rank.title}</div>
          </div>
        </div>
        <ul className="stats">
          {(Object.keys(STAT_INFO) as (keyof Summary['stats'])[]).map((k) => (
            <li key={k}>
              <span className="stat-key mono">{STAT_INFO[k].label}</span>
              <div className="stat-bar"><div style={{ width: `${(summary.stats[k] / maxStat) * 100}%` }} /></div>
              <span className="stat-val mono">{summary.stats[k]}</span>
              <span className="stat-hint muted small">{STAT_INFO[k].hint}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Lifetime">
        <div className="stat-row wrap">
          <div><strong>{fmt(summary.totalXp)}</strong><span>total XP</span></div>
          <div><strong>{summary.sessions}</strong><span>gates</span></div>
          <div><strong>{fmtVolume(summary.volume, p.unit)}</strong><span>moved</span></div>
          <div><strong>{fmt(summary.reps)}</strong><span>reps</span></div>
          <div><strong>{Math.round(summary.seconds / 60)}</strong><span>min timed</span></div>
          <div><strong>{summary.prs}</strong><span>PRs</span></div>
        </div>
      </Panel>

      {bests.length > 0 && (
        <Panel title="Personal Records">
          <ul className="list">
            {bests.map(({ ex, b }) => (
              <li key={ex!.id}>
                <span>{ex!.name}</span>
                <span className="mono small">
                  {ex!.track === 'weight' ? `e1RM ${toUnit(b.e1rm, p.unit)} ${p.unit}` : ex!.track === 'reps' ? `${b.reps} reps` : `${b.time}s`}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="Settings">
        <div className="form">
          <label>Hunter name
            <input value={p.name} maxLength={24} placeholder="Hunter" onChange={(e) => actions.updateProfile({ name: e.target.value })} />
          </label>
          <label>Weight unit
            <div className="seg">
              {(['kg', 'lb'] as const).map((u) => (
                <button key={u} className={p.unit === u ? 'on' : ''} onClick={() => actions.updateProfile({ unit: u })}>{u}</button>
              ))}
            </div>
          </label>
          <label>Weekly raid goal (training days)
            <div className="seg">
              {[2, 3, 4, 5, 6].map((n) => (
                <button key={n} className={p.weeklyGoal === n ? 'on' : ''} onClick={() => actions.updateProfile({ weeklyGoal: n })}>{n}</button>
              ))}
            </div>
          </label>
          <label className="row between">Sound effects
            <input type="checkbox" checked={p.sound} onChange={(e) => actions.updateProfile({ sound: e.target.checked })} />
          </label>
        </div>
      </Panel>

      <Panel title="Data">
        <p className="muted small">
          Everything is stored on this device only. Last backup:{' '}
          <strong className={backupStale ? 'warn-text' : ''}>{p.lastBackup ? fmtDate(p.lastBackup) : 'never'}</strong>
        </p>
        <div className="row gap wrap">
          <button className="btn btn-outline" onClick={exportFile}>Export backup</button>
          <button className="btn btn-outline" onClick={() => fileRef.current?.click()}>Import backup</button>
          <button className="btn btn-ghost danger" onClick={() => setReset(true)}>Reset all</button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => importFile(e.target.files?.[0])} />
        {msg && <p className="small">{msg}</p>}
      </Panel>

      <Sheet open={reset} onClose={() => setReset(false)} title="Reset everything?">
        <p className="muted">Deletes all workouts, XP, badges and settings on this device. Export a backup first.</p>
        <button className="btn btn-danger block" onClick={() => { actions.resetAll(); setReset(false); }}>Reset</button>
      </Sheet>
    </div>
  );
}
