import { BADGES, TIER_COLOR, badgeById } from '../engine/badges';
import { MODE_META, MUSCLE_LABEL } from '../engine/exercises';
import { dailyQuests, dateKey, nextRank, questBonus, type Summary } from '../engine/game';
import { muscleRest } from '../engine/recommend';
import type { AppState, Exercise, Muscle } from '../engine/types';
import { actions, toast } from '../store';
import { Bar, Panel, RankEmblem, SystemTag, useCountUp } from '../components/ui';
import { buzz, chime, fmt } from '../util';

const RECOVERY_MUSCLES: Muscle[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];

function greeting(name: string) {
  const h = new Date().getHours();
  if (h >= 22 || h < 4) return `Night shift, ${name}. The Gates never close.`;
  if (h < 12) return `Morning, ${name}. A new day of quests awaits.`;
  if (h < 17) return `Afternoon, ${name}. Your stats won't raise themselves.`;
  return `Evening, ${name}. One more Gate before rest?`;
}

export function Home({ state, summary, exMap, onTrain }: {
  state: AppState; summary: Summary; exMap: Map<string, Exercise>; onTrain: () => void;
}) {
  const { level, rank } = summary;
  const key = dateKey(Date.now());
  const quests = dailyQuests(key, summary.questLevel, summary.today);
  const allDone = quests.every((q) => q.progress >= q.target);
  const claimed = !!state.questClaims[key];
  const nr = nextRank(level.level);
  const name = state.profile.name || 'Hunter';
  const title = state.profile.title ? badgeById(state.profile.title)?.name : rank.title;
  const xpInto = useCountUp(level.into, 800);
  const rest = muscleRest(state.sessions, exMap, Date.now());

  const milestones = BADGES.filter((b) => !state.badges[b.id] && b.group !== 'Secret')
    .map((b) => ({ b, pct: Math.min(1, b.metric(summary) / b.target) }))
    .sort((x, y) => y.pct - x.pct)
    .slice(0, 3);

  const recentPrs = [...state.sessions].reverse().flatMap((s) => s.prs.map((p) => ({ ...p, at: s.endedAt }))).slice(0, 3);

  const claim = () => {
    const xp = actions.claimQuests(summary);
    if (!xp) return;
    if (state.profile.sound) chime('quest');
    buzz(80);
    toast(`Daily quest complete. +${xp} XP`);
  };

  return (
    <div className="screen stagger">
      <p className="greeting muted small">{greeting(name)}</p>

      <Panel glow className="hero">
        <div className="hero-row">
          <RankEmblem rank={rank.id} size={68} pulse />
          <div className="hero-id">
            <SystemTag>PLAYER</SystemTag>
            <h1 className="hero-name">{name}</h1>
            <div className="hero-title" style={{ color: TIER_COLOR[rank.id] }}>{title}</div>
          </div>
          <div className="hero-level">
            <span className="muted small">LV</span>
            <span className="hero-lv">{level.level}</span>
          </div>
        </div>
        <div className="xp-row">
          <Bar value={level.into} max={level.need} />
          <div className="xp-meta">
            <span>{fmt(xpInto)} / {fmt(level.need)} XP</span>
            {nr && <span className="muted">{nr.id}-Rank at LV {nr.minLevel}</span>}
          </div>
        </div>
      </Panel>

      <Panel title={<SystemTag>DAILY QUEST</SystemTag>} right={<span className="muted small">resets midnight</span>}
        className={`quest-panel ${allDone && !claimed ? 'claimable' : ''}`}>
        <ul className="quests">
          {quests.map((q) => {
            const done = q.progress >= q.target;
            return (
              <li key={q.kind} className={done ? 'done' : ''}>
                <div className="quest-top">
                  <span><span className="q-box">{done ? '✓' : ''}</span>{q.label}</span>
                  <span className="mono">{fmt(q.progress)}/{fmt(q.target)} {q.unit}</span>
                </div>
                <Bar value={q.progress} max={q.target} thin />
              </li>
            );
          })}
        </ul>
        {claimed ? (
          <div className="quest-claimed">✔ Reward claimed · +{state.questClaims[key]} XP</div>
        ) : (
          <button className={`btn block ${allDone ? 'btn-primary shimmer' : 'btn-locked'}`} disabled={!allDone} onClick={claim}>
            {allDone ? `Claim reward · +${questBonus(summary.questLevel)} XP` : `Reward: +${questBonus(summary.questLevel)} XP`}
          </button>
        )}
      </Panel>

      <button className="btn btn-gate block" onClick={onTrain}>
        {state.active ? `⚔ Resume ${MODE_META[state.active.mode].gate}` : '⚔ Enter a Gate'}
      </button>

      <div className="grid-2">
        <Panel title="Streak" className="mini">
          <div className={`big-stat ${summary.streak >= 3 ? 'flame' : ''}`}>
            <span className="flame-icon">🔥</span> {summary.streak}<small> {summary.streak === 1 ? 'day' : 'days'}</small>
          </div>
          <div className="muted small">Best {summary.longestStreak} · 1 rest day allowed</div>
        </Panel>
        <Panel title="Weekly Raid" className="mini">
          <div className="big-stat">{summary.thisWeekDays}<small> / {state.profile.weeklyGoal} days</small></div>
          <Bar value={summary.thisWeekDays} max={state.profile.weeklyGoal} thin />
        </Panel>
      </div>

      <Panel title="Recovery" right={<span className="muted small">since last trained</span>}>
        <div className="recovery">
          {RECOVERY_MUSCLES.map((m) => {
            const h = rest[m];
            const status = h === Infinity || h >= 48 ? 'ready' : h >= 24 ? 'recovering' : 'fatigued';
            return (
              <div key={m} className={`rec rec-${status}`}>
                <span className="rec-dot" />
                <span className="rec-name">{MUSCLE_LABEL[m]}</span>
                <span className="rec-h mono">{h === Infinity ? '—' : h < 24 ? `${Math.floor(h)}h` : `${Math.floor(h / 24)}d`}</span>
              </div>
            );
          })}
        </div>
        <p className="muted small rec-legend"><i className="rec-dot r" /> ready 48h+ <i className="rec-dot y" /> 24–48h <i className="rec-dot f" /> &lt;24h</p>
      </Panel>

      {milestones.length > 0 && (
        <Panel title="Next Milestones">
          <ul className="milestones">
            {milestones.map(({ b }) => (
              <li key={b.id}>
                <span className="ms-icon" style={{ borderColor: TIER_COLOR[b.tier] }}>{b.icon}</span>
                <div className="ms-body">
                  <div className="ms-top">
                    <strong>{b.name}</strong>
                    <span className="mono small">{fmt(Math.min(b.metric(summary), b.target))}/{fmt(b.target)}</span>
                  </div>
                  <Bar value={b.metric(summary)} max={b.target} thin color={TIER_COLOR[b.tier]} />
                  <div className="muted small">{b.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {recentPrs.length > 0 && (
        <Panel title="Recent Limit Breaks">
          <ul className="list">
            {recentPrs.map((p, i) => (
              <li key={i}>
                <span>⚡ {exMap.get(p.exerciseId)?.name ?? 'Exercise'}</span>
                <span className="muted small">{p.kind === 'e1rm' ? 'new est. 1RM' : p.kind === 'reps' ? `${p.value} reps` : `${p.value}s`}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
