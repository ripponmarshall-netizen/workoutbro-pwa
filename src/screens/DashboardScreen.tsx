import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import { QuickStartCard } from '../components/dashboard/QuickStartCard';
import { StreakCard } from '../components/dashboard/StreakCard';
import { RankCard } from '../components/dashboard/RankCard';
import { RecentPrsCard } from '../components/dashboard/RecentPrsCard';
import { EmptyState } from '../components/common/EmptyState';
import { formatDuration, formatWeightKg } from '../lib/format';

export function DashboardScreen(): JSX.Element {
  const dashboard = useDashboardData();
  const navigate = useNavigate();
  const hasHistory = dashboard.recentSessions.length > 0;

  return (
    <main className='wb-screen'>
      <section className='wb-screen-header'>
        <div>
          <h1 className='wb-screen-title'>Stay on the bar.</h1>
          <p className='wb-screen-subtitle'>Strong sessions compound. Start the next one fast.[web:45][web:48]</p>
        </div>
      </section>

      {dashboard.activeSession ? (
        <div className='wb-card wb-row-between' style={{ borderColor: 'rgba(212,255,63,0.26)', background: 'rgba(212,255,63,0.08)' }}>
          <div>
            <div className='wb-label'>Recovery available</div>
            <div style={{ fontWeight: 800 }}>Unfinished workout found</div>
            <div className='wb-muted'>Pick up where you left off.</div>
          </div>
          <Link to={`/workout/active/${dashboard.activeSession.localId}`}>Resume</Link>
        </div>
      ) : null}

      <QuickStartCard activeSessionId={dashboard.activeSession?.localId} />

      {!hasHistory ? (
        <EmptyState
          title='No sessions yet'
          body='Start your first workout to unlock PR tracking, score, XP, and progress history.'
          ctaLabel='Start Workout'
          onCta={() => navigate('/start-workout')}
        />
      ) : (
        <div className='wb-desktop-grid'>
          <div className='wb-grid'>
            <div className='wb-grid wb-grid-2'>
              <StreakCard streakDays={dashboard.streakDays} trainedThisWeek={dashboard.trainedThisWeek} />
              <RankCard rankLabel={dashboard.rankLabel} level={dashboard.level} totalXp={dashboard.totalXp} nextLevelXp={dashboard.level * 250} />
            </div>
            <div className='wb-card wb-stack-md'>
              <div className='wb-row-between'>
                <h3 className='wb-section-title'>Last workout</h3>
                <div className='wb-pill'>{dashboard.lastWorkout?.status ?? '—'}</div>
              </div>
              {dashboard.lastWorkout ? (
                <>
                  <div className='wb-grid wb-grid-2'>
                    <div>
                      <div className='wb-label'>Duration</div>
                      <div className='wb-kpi-value' style={{ fontSize: 26 }}>{formatDuration(dashboard.lastWorkout.summaryCacheJson?.durationMs ?? 0)}</div>
                    </div>
                    <div>
                      <div className='wb-label'>Volume</div>
                      <div className='wb-kpi-value' style={{ fontSize: 26 }}>{formatWeightKg(dashboard.lastWorkout.summaryCacheJson?.totalVolumeKg ?? 0)}</div>
                    </div>
                  </div>
                  <div className='wb-row' style={{ flexWrap: 'wrap' }}>
                    <div className='wb-pill'>{dashboard.lastWorkout.summaryCacheJson?.totalSets ?? 0} sets</div>
                    <div className='wb-pill'>{dashboard.lastWorkout.summaryCacheJson?.prCount ?? 0} PRs</div>
                  </div>
                </>
              ) : null}
            </div>
            <RecentPrsCard prs={dashboard.prs} exerciseNameById={dashboard.exerciseNameById} />
          </div>
          <div className='wb-grid'>
            <div className='wb-card wb-stack-md'>
              <h3 className='wb-section-title'>This week</h3>
              <div className='wb-grid wb-grid-2'>
                <div>
                  <div className='wb-label'>Volume</div>
                  <div className='wb-kpi-value' style={{ fontSize: 24 }}>{formatWeightKg(dashboard.weeklyVolume)}</div>
                </div>
                <div>
                  <div className='wb-label'>Trained</div>
                  <div className='wb-kpi-value' style={{ fontSize: 24 }}>{dashboard.trainedThisWeek} days</div>
                </div>
              </div>
            </div>
            <div className='wb-card wb-stack-md'>
              <h3 className='wb-section-title'>Active goals</h3>
              {dashboard.goals.length ? dashboard.goals.map((goal) => (
                <div key={goal.localId} className='wb-card wb-card-elevated wb-stack-sm'>
                  <div style={{ fontWeight: 700 }}>{goal.title}</div>
                  <div className='wb-muted'>{goal.goalType.replace(/_/g, ' ')}</div>
                </div>
              )) : <div className='wb-muted'>No active goals yet.</div>}
            </div>
          </div>
        </div>
      )}
      <div className='wb-tabbar-spacer' />
    </main>
  );
}
