import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDb } from '../db/database';
import { formatDuration, formatTime, formatWeightKg } from '../lib/format';
import { StatPill } from '../components/common/StatPill';
import { PrimaryButton } from '../components/common/PrimaryButton';

export function WorkoutSummaryScreen(): JSX.Element {
  const { sessionId } = useParams();
  const db = getDb();
  const session = useLiveQuery(() => (sessionId ? db.workoutSessions.get(sessionId) : undefined), [sessionId]);
  const score = useLiveQuery(() => (sessionId ? db.scoreHistory.where('workoutSessionLocalId').equals(sessionId).last() : undefined), [sessionId]);
  const prs = useLiveQuery(() => (sessionId ? db.personalRecords.where('sourceWorkoutSessionLocalId').equals(sessionId).toArray() : Promise.resolve([])), [sessionId], []);

  if (!session) return <main className='wb-screen'><div className='wb-card'>Summary unavailable.</div></main>;

  const summary = session.summaryCacheJson;
  const xp = Math.max(25, Math.round((score?.breakdown.totalScore ?? 0) * 0.4));

  return (
    <main className='wb-screen'>
      <section className='wb-card wb-stack-md' style={{ background: 'linear-gradient(180deg, rgba(212,255,63,0.1), rgba(19,23,28,1))' }}>
        <div className='wb-label'>Workout complete</div>
        <h1 className='wb-screen-title'>Session closed clean.</h1>
        <div className='wb-row' style={{ flexWrap: 'wrap' }}>
          <StatPill label='Score' value={String(score?.breakdown.totalScore ?? 0)} tone='accent' />
          <StatPill label='XP' value={`+${xp}`} tone='success' />
          <StatPill label='PRs' value={String(prs.length)} tone='pr' />
        </div>
      </section>

      <div className='wb-grid wb-grid-2'>
        <div className='wb-card wb-card-elevated'>
          <div className='wb-label'>Started</div>
          <div className='wb-kpi-value' style={{ fontSize: 24 }}>{formatTime(session.startedAt)}</div>
        </div>
        <div className='wb-card wb-card-elevated'>
          <div className='wb-label'>Ended</div>
          <div className='wb-kpi-value' style={{ fontSize: 24 }}>{formatTime(session.endedAt)}</div>
        </div>
      </div>

      <div className='wb-grid wb-grid-2'>
        <div className='wb-card wb-card-elevated'><div className='wb-label'>Duration</div><div className='wb-kpi-value' style={{ fontSize: 24 }}>{formatDuration(summary?.durationMs ?? 0)}</div></div>
        <div className='wb-card wb-card-elevated'><div className='wb-label'>Volume</div><div className='wb-kpi-value' style={{ fontSize: 24 }}>{formatWeightKg(summary?.totalVolumeKg ?? 0)}</div></div>
        <div className='wb-card wb-card-elevated'><div className='wb-label'>Sets</div><div className='wb-kpi-value' style={{ fontSize: 24 }}>{summary?.totalSets ?? 0}</div></div>
        <div className='wb-card wb-card-elevated'><div className='wb-label'>Working sets</div><div className='wb-kpi-value' style={{ fontSize: 24 }}>{summary?.totalWorkingSets ?? 0}</div></div>
      </div>

      <div className='wb-card wb-stack-md'>
        <h3 className='wb-section-title'>Outcome</h3>
        <div className='wb-muted'>You trained {summary?.totalExercises ?? 0} exercises, logged {summary?.totalSets ?? 0} total sets, and pushed {summary?.totalVolumeKg ?? 0} kg of total volume.</div>
        <div className='wb-row' style={{ flexWrap: 'wrap' }}>
          {prs.map((pr) => <StatPill key={pr.localId} label='PR' value={`${pr.prType.replace(/_/g, ' ')}`} tone='pr' />)}
        </div>
      </div>

      <Link to='/progress'>
        <PrimaryButton fullWidth>Review Progress</PrimaryButton>
      </Link>
    </main>
  );
}
