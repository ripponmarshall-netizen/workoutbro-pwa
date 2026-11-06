import { useEffect, useMemo, useState } from 'react';
import { TIER_COLOR } from './engine/badges';
import { exerciseMap } from './engine/exercises';
import { summarise, type RankId } from './engine/game';
import type { Session } from './engine/types';
import { useRewards, useStore } from './store';
import { Icon, RankEmblem, SystemTag } from './components/ui';
import { Home } from './screens/Home';
import { ActiveWorkout, GateCleared, GateSelect } from './screens/Workout';
import { Log } from './screens/Log';
import { Awards } from './screens/Awards';
import { Profile } from './screens/Profile';
import { chime } from './util';

type Tab = 'home' | 'train' | 'log' | 'awards' | 'me';
const TABS: { id: Tab; label: string; icon: Parameters<typeof Icon>[0]['name'] }[] = [
  { id: 'home', label: 'Base', icon: 'home' },
  { id: 'train', label: 'Gate', icon: 'gate' },
  { id: 'log', label: 'Log', icon: 'log' },
  { id: 'awards', label: 'Awards', icon: 'award' },
  { id: 'me', label: 'Status', icon: 'user' },
];

export function App() {
  const state = useStore();
  const exMap = useMemo(() => exerciseMap(state.customExercises), [state.customExercises]);
  const summary = useMemo(() => summarise(state, exMap), [state, exMap]);
  const [tab, setTab] = useState<Tab>(state.active ? 'train' : 'home');
  const [cleared, setCleared] = useState<Session | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, [tab, cleared]);

  let body;
  if (cleared) {
    body = <GateCleared session={cleared} exMap={exMap} unit={state.profile.unit} onClose={() => { setCleared(null); setTab('home'); }} />;
  } else if (tab === 'train') {
    body = state.active
      ? <ActiveWorkout state={state} exMap={exMap} onFinished={setCleared} />
      : <GateSelect summary={summary} />;
  } else if (tab === 'log') body = <Log state={state} exMap={exMap} />;
  else if (tab === 'awards') body = <Awards state={state} summary={summary} />;
  else if (tab === 'me') body = <Profile state={state} summary={summary} exMap={exMap} />;
  else body = <Home state={state} summary={summary} exMap={exMap} onTrain={() => setTab('train')} />;

  return (
    <div className="app">
      <main key={cleared ? 'cleared' : tab} className="fade-in">{body}</main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id && !cleared ? 'on' : ''}`}
            onClick={() => { setCleared(null); setTab(t.id); }}>
            <Icon name={t.icon} />
            <span>{t.label}</span>
            {t.id === 'train' && state.active && <span className="tab-dot" />}
          </button>
        ))}
      </nav>
      <RewardOverlay sound={state.profile.sound} />
    </div>
  );
}

function RewardOverlay({ sound }: { sound: boolean }) {
  const [reward, next] = useRewards();
  useEffect(() => {
    if (reward && sound) chime(reward.kind === 'badge' ? 'badge' : 'level');
  }, [reward, sound]);
  if (!reward) return null;

  return (
    <div className="overlay" onClick={next}>
      <div className="overlay-card panel panel-glow" onClick={(e) => e.stopPropagation()}>
        <SystemTag>SYSTEM</SystemTag>
        {reward.kind === 'level' && (
          <>
            <div className="ov-headline">LEVEL UP</div>
            <div className="ov-level mono">{reward.level}</div>
            <p className="muted">Your power grows. All stats recalculated.</p>
          </>
        )}
        {reward.kind === 'rank' && (
          <>
            <div className="ov-headline">RANK UP</div>
            <div className="ov-center"><RankEmblem rank={reward.rank as RankId} size={96} /></div>
            <p style={{ color: TIER_COLOR[reward.rank as RankId] }}>You are now a {reward.title}.</p>
          </>
        )}
        {reward.kind === 'badge' && (
          <>
            <div className="ov-headline small-head">ACHIEVEMENT UNLOCKED</div>
            <div className="ov-badge" style={{ borderColor: TIER_COLOR[reward.badge.tier], boxShadow: `0 0 30px ${TIER_COLOR[reward.badge.tier]}` }}>
              {reward.badge.icon}
            </div>
            <h3 style={{ color: TIER_COLOR[reward.badge.tier] }}>{reward.badge.name}</h3>
            <p className="muted">{reward.badge.desc}</p>
            <p className="small">New title available in Awards.</p>
          </>
        )}
        <button className="btn btn-primary block" onClick={next}>Accept</button>
      </div>
    </div>
  );
}
