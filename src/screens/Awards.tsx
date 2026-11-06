import { useState } from 'react';
import { BADGES, TIER_COLOR, type Badge } from '../engine/badges';
import type { Summary } from '../engine/game';
import type { AppState } from '../engine/types';
import { actions } from '../store';
import { Bar, Panel, Sheet, SystemTag } from '../components/ui';
import { fmt, fmtDate } from '../util';

export function Awards({ state, summary }: { state: AppState; summary: Summary }) {
  const [sel, setSel] = useState<Badge | null>(null);
  const unlocked = BADGES.filter((b) => state.badges[b.id]).length;
  const groups = [...new Set(BADGES.map((b) => b.group))];

  return (
    <div className="screen">
      <Panel glow>
        <SystemTag>ACHIEVEMENTS</SystemTag>
        <h2 className="h2">{unlocked} / {BADGES.length} unlocked</h2>
        <Bar value={unlocked} max={BADGES.length} />
        <p className="muted small">Unlocked badges become titles you can equip.</p>
      </Panel>
      {groups.map((g) => (
        <Panel key={g} title={g}>
          <div className="badge-grid">
            {BADGES.filter((b) => b.group === g).map((b) => {
              const have = !!state.badges[b.id];
              const secret = b.group === 'Secret' && !have;
              return (
                <button key={b.id} className={`badge ${have ? 'have' : ''}`} style={{ '--c': TIER_COLOR[b.tier] } as React.CSSProperties}
                  onClick={() => setSel(b)}>
                  <span className="badge-icon">{secret ? '❔' : b.icon}</span>
                  <span className="badge-name">{secret ? '???' : b.name}</span>
                  {!have && !secret && <Bar value={b.metric(summary)} max={b.target} thin color={TIER_COLOR[b.tier]} />}
                  <span className="badge-tier">{b.tier}</span>
                </button>
              );
            })}
          </div>
        </Panel>
      ))}
      <Sheet open={!!sel} onClose={() => setSel(null)} title={sel ? `${sel.tier}-Tier Achievement` : ''}>
        {sel && (() => {
          const have = state.badges[sel.id];
          const secret = sel.group === 'Secret' && !have;
          const equipped = state.profile.title === sel.id;
          return (
            <div className="badge-detail" style={{ '--c': TIER_COLOR[sel.tier] } as React.CSSProperties}>
              <div className="badge-big">{secret ? '❔' : sel.icon}</div>
              <h3>{secret ? 'Hidden achievement' : sel.name}</h3>
              <p className="muted">{secret ? 'Some feats are only revealed by doing them.' : sel.desc}</p>
              {have ? (
                <>
                  <p className="small">Unlocked {fmtDate(have)}</p>
                  <button className="btn btn-primary block" onClick={() => actions.updateProfile({ title: equipped ? null : sel.id })}>
                    {equipped ? 'Unequip title' : 'Equip as title'}
                  </button>
                </>
              ) : !secret && (
                <>
                  <Bar value={sel.metric(summary)} max={sel.target} color={TIER_COLOR[sel.tier]} />
                  <p className="mono small">{fmt(Math.min(sel.metric(summary), sel.target))} / {fmt(sel.target)} {sel.unit}</p>
                </>
              )}
            </div>
          );
        })()}
      </Sheet>
    </div>
  );
}
