import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { TIER_COLOR } from './engine/badges';
import { exerciseMap } from './engine/exercises';
import { summarise, type RankId } from './engine/game';
import type { Session } from './engine/types';
import { useRewards, useStore } from './store';
import { Icon, RankEmblem, SystemTag, Toasts, useCountUp, useScrollLock } from './components/ui';
import { Home } from './screens/Home';
import { ActiveWorkout, GateCleared, GateSelect } from './screens/Workout';
import { Log } from './screens/Log';
import { Awards } from './screens/Awards';
import { Profile } from './screens/Profile';
import { buzz, chime } from './util';

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

  const go = (t: Tab) => {
    if (t !== tab) buzz(8);
    setCleared(null);
    setTab(t);
  };

  let body;
  if (cleared) {
    body = <GateCleared session={cleared} exMap={exMap} unit={state.profile.unit} onClose={() => go('home')} />;
  } else if (tab === 'train') {
    body = state.active
      ? <ActiveWorkout state={state} exMap={exMap} onFinished={setCleared} />
      : <GateSelect state={state} summary={summary} exMap={exMap} />;
  } else if (tab === 'log') body = <Log state={state} exMap={exMap} />;
  else if (tab === 'awards') body = <Awards state={state} summary={summary} />;
  else if (tab === 'me') body = <Profile state={state} summary={summary} exMap={exMap} />;
  else body = <Home state={state} summary={summary} exMap={exMap} onTrain={() => go('train')} />;

  const activeIdx = TABS.findIndex((t) => t.id === tab);

  return (
    <div className="app">
      <main key={cleared ? 'cleared' : `${tab}-${state.active ? 'a' : 'n'}`} className="fade-in">{body}</main>
      <nav className="tabbar" style={{ '--i': cleared ? -1 : activeIdx } as CSSProperties}>
        <span className="tab-glow" aria-hidden="true" />
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id && !cleared ? 'on' : ''}`} onClick={() => go(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}>
            <Icon name={t.icon} />
            <span>{t.label}</span>
            {t.id === 'train' && state.active && <span className="tab-dot" />}
          </button>
        ))}
      </nav>
      <Toasts />
      <RewardOverlay sound={state.profile.sound} />
    </div>
  );
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x: Math.round(Math.cos((i / 18) * Math.PI * 2) * (90 + (i % 3) * 30)),
  y: Math.round(Math.sin((i / 18) * Math.PI * 2) * (90 + (i % 3) * 30)),
  d: (i % 5) * 60,
}));

function RewardOverlay({ sound }: { sound: boolean }) {
  const [reward, next] = useRewards();
  useScrollLock(!!reward);
  useEffect(() => {
    if (!reward) return;
    if (sound) chime(reward.kind === 'badge' ? 'badge' : 'level');
    buzz(reward.kind === 'badge' ? 60 : 120);
  }, [reward, sound]);
  const lvl = useCountUp(reward?.kind === 'level' ? reward.level : 0, 700);
  if (!reward) return null;

  const color = reward.kind === 'badge' ? TIER_COLOR[reward.badge.tier]
    : reward.kind === 'rank' ? TIER_COLOR[reward.rank as RankId] : '#3ab8ff';

  return (
    <div className="overlay" onClick={next} style={{ '--c': color } as CSSProperties}>
      <div className="ov-rays" aria-hidden="true" />
      <div className="ov-particles" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <i key={`${reward.kind}-${i}`} style={{ '--x': `${p.x}px`, '--y': `${p.y}px`, animationDelay: `${p.d}ms` } as CSSProperties} />
        ))}
      </div>
      <div key={JSON.stringify(reward)} className="overlay-card panel panel-glow" onClick={(e) => e.stopPropagation()}>
        <SystemTag>SYSTEM</SystemTag>
        {reward.kind === 'level' && (
          <>
            <div className="ov-headline">LEVEL UP</div>
            <div className="ov-level mono">{lvl}</div>
            <p className="muted">Your power grows. All stats recalculated.</p>
          </>
        )}
        {reward.kind === 'rank' && (
          <>
            <div className="ov-headline">RANK UP</div>
            <div className="ov-center"><RankEmblem rank={reward.rank as RankId} size={110} pulse /></div>
            <p style={{ color }}>You are now a {reward.title}.</p>
          </>
        )}
        {reward.kind === 'badge' && (
          <>
            <div className="ov-headline small-head">ACHIEVEMENT UNLOCKED</div>
            <div className="ov-badge" style={{ borderColor: color, boxShadow: `0 0 30px ${color}` }}>
              {reward.badge.icon}
            </div>
            <h3 style={{ color }}>{reward.badge.name}</h3>
            <p className="muted">{reward.badge.desc}</p>
            <p className="small">New title available in Awards.</p>
          </>
        )}
        <button className="btn btn-primary block" onClick={next}>Accept</button>
      </div>
    </div>
  );
}
