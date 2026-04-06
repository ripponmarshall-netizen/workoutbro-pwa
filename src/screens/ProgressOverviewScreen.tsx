import React from 'react';
import { useProgressOverview } from '../hooks/useProgressOverview';
import { MetricCard } from '../components/progress/MetricCard';
import { ProgressChart } from '../components/progress/ProgressChart';
import { formatWeightKg } from '../lib/format';

export function ProgressOverviewScreen(): JSX.Element {
  const progress = useProgressOverview();

  return (
    <main className='wb-screen'>
      <section>
        <h1 className='wb-screen-title'>Progress</h1>
        <p className='wb-screen-subtitle'>Readable progress matters more than cluttered analytics.[web:45][web:47]</p>
      </section>

      <div className='wb-grid wb-grid-2'>
        <MetricCard label='Weekly volume' value={formatWeightKg(progress.weeklyVolume)} tone='accent' />
        <MetricCard label='Monthly volume' value={formatWeightKg(progress.monthlyVolume)} />
        <MetricCard label='Lifetime volume' value={formatWeightKg(progress.lifetimeVolume)} tone='xp' />
        <MetricCard label='Consistency' value={`${progress.sessions.length} sessions`} subtext='Recent tracked workouts' />
      </div>

      <ProgressChart title='Volume trend' points={progress.chartPoints.length ? progress.chartPoints : [{ label: 'Start', value: 0 }]} />
      <ProgressChart title='Top improving lifts' points={progress.improvingLifts.length ? progress.improvingLifts.map((item) => ({ label: item.label.slice(0, 8), value: item.value })) : [{ label: 'None', value: 0 }]} color='var(--wb-xp)' />

      <div className='wb-card wb-stack-md'>
        <h3 className='wb-section-title'>Recent training history</h3>
        {progress.sessions.length ? progress.sessions.slice(0, 8).map((session) => (
          <div key={session.localId} className='wb-row-between'>
            <div>
              <div style={{ fontWeight: 700 }}>{new Date(session.startedAt).toLocaleDateString()}</div>
              <div className='wb-muted'>{session.summaryCacheJson?.totalSets ?? 0} sets · {session.summaryCacheJson?.totalExercises ?? 0} exercises</div>
            </div>
            <div className='wb-pill'>{formatWeightKg(session.summaryCacheJson?.totalVolumeKg ?? 0)}</div>
          </div>
        )) : <div className='wb-muted'>No training history yet.</div>}
      </div>
      <div className='wb-tabbar-spacer' />
    </main>
  );
}
