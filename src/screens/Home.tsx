import { BADGES, TIER_COLOR, badgeById } from '../engine/badges';
import { MODE_META } from '../engine/exercises';
import { dailyQuests, dateKey, nextRank, questBonus, type Summary } from '../engine/game';
import type { AppState, Exercise } from '../engine/types';
import { actions } from '../store';
import { Bar, Panel, RankEmblem, SystemTag } from '../components/ui';
import { fmt } from '../util';

export function Home({ state, summary, exMap, onTrain }: {
  state: AppState; summary: Summary; exMap: Map<string, Exercise>; onTrain: () => void;
}) {
  const { level, rank } = summary;
  const key = dateKey(Date.now());
  const quests = dailyQuests(key, level.level, summary.today);
  const allDone = quests.every((q) => q.progress >= q.target);
  const claimed = !!state.questClaims[key];
  const nr = nextRank(level.level);
  const title = state.profile.title ? badgeById(state.profile.title)?.name : rank.title;

  const milestones = BADGES.filter((b) => !state.badges[b.id])
    .map((b) => ({ b, pct: Math.min(1, b.metric(summary) / b.target) }))
    .sort((x, y) => y.pct - x.pct)
    .slice(0, 3);

  const recentPrs = [...state.sessions].reverse().flatMap((s) => s.prs.map((p) => ({ ...p, at: s.endedAt }))).slice(0, 3);

  return (
    <div className="screen">
      <Panel glow className="hero">
        <div className="hero-row">
          <RankEmblem rank={rank.id} size={68} />
          <div className="hero-id">
            <SystemTag>PLAYER</SystemTag>
            <h1 className="hero-name">{state.profile.name || 'Hunter'}</h1>
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
            <span>{fmt(level.into)} / {fmt(level.need)} XP</span>
            {nr && <span className="muted">{nr.id}-Rank at LV {nr.minLevel}</span>}
          </div>
        </div>
      </Panel>

      <Panel title={<><SystemTag>DAILY QUEST</SystemTag></>} right={<span className="muted small">resets midnight</span>}>
        <ul className="quests">
          {quests.map((q) => {
            const done = q.progress >= q.target;
            return (
              <li key={q.kind} className={done ? 'done' : ''}>
                <div className="quest-top">
                  <span>{done ? '☑' : '☐'} {q.label}</span>
                  <span className="mono">{fmt(q.progress)}/{fmt(q.target)} {q.unit}</span>
                </div>
                <Bar value={q.progress} max={q.target} thin />
              </li>
            );
          })}
        </ul>
        {claimed ? (
          <div className="quest-claimed">✔ Quest reward claimed (+{state.questClaims[key]} XP)</div>
        ) : (
          <button className="btn btn-primary block" disabled={!allDone} onClick={() => actions.claimQuests(summary)}>
            {allDone ? `Claim reward · +${questBonus(level.level)} XP` : 'Complete all quests to claim'}
          </button>
        )}
      </Panel>

      <div className="grid-2">
        <Panel title="Streak">
          <div className="big-stat">🔥 {summary.streak}<small> {summary.streak === 1 ? "day" : "days"}</small></div>
          <div className="muted small">Best {summary.longestStreak} · 1 rest day allowed</div>
        </Panel>
        <Panel title="Weekly Raid">
          <div className="big-stat">{summary.thisWeekDays}<small> / {state.profile.weeklyGoal}</small></div>
          <Bar value={summary.thisWeekDays} max={state.profile.weeklyGoal} thin />
        </Panel>
      </div>

      <button className="btn btn-gate block" onClick={onTrain}>
        {state.active ? `⚔ Resume ${MODE_META[state.active.mode].gate}` : '⚔ Enter a Gate'}
      </button>

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
