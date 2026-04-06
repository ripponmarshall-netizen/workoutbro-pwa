import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDb } from '../db/database';
import { WorkoutSessionRepository } from '../db/repositories/workoutSessionRepository';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { SecondaryButton } from '../components/common/SecondaryButton';

const workoutSessionRepository = new WorkoutSessionRepository();

export function StartWorkoutScreen(): JSX.Element {
  const navigate = useNavigate();
  const db = getDb();
  const templates = useLiveQuery(() => db.workoutTemplates.orderBy('updatedAt').reverse().limit(6).toArray(), [], []);
  const recentSessions = useLiveQuery(() => db.workoutSessions.orderBy('startedAt').reverse().limit(4).toArray(), [], []);

  const startEmpty = async () => {
    const session = await workoutSessionRepository.createWorkoutSession({
      userLocalId: 'local-user',
      templateLocalId: null,
      sessionNotes: null,
    });
    navigate(`/workout/active/${session.localId}`);
  };

  const startFromTemplate = async (templateId: string) => {
    const session = await workoutSessionRepository.createWorkoutSession({
      userLocalId: 'local-user',
      templateLocalId: templateId,
      sessionNotes: null,
    });
    const templateExercises = await db.templateExercises.where('templateLocalId').equals(templateId).sortBy('sortOrder');
    for (const item of templateExercises) {
      await workoutSessionRepository.addExerciseToSession(session.localId, item.exerciseLocalId, {
        plannedSetCount: item.defaultSetCount,
        defaultRestSeconds: item.defaultRestSeconds ?? undefined,
      });
    }
    navigate(`/workout/active/${session.localId}`);
  };

  const quickSplits = ['Push', 'Pull', 'Legs', 'Upper', 'Lower'];

  return (
    <main className='wb-screen'>
      <section>
        <h1 className='wb-screen-title'>Start fast.</h1>
        <p className='wb-screen-subtitle'>Bold CTAs and low-friction entry reduce drop-off before training starts.[web:45][web:47]</p>
      </section>

      <div className='wb-card wb-stack-md'>
        <div className='wb-label'>Immediate</div>
        <PrimaryButton fullWidth onClick={startEmpty}>Start Empty Workout</PrimaryButton>
        <div className='wb-grid wb-grid-2'>
          <SecondaryButton fullWidth onClick={startEmpty}>Repeat Last Workout</SecondaryButton>
          <SecondaryButton fullWidth onClick={startEmpty}>Suggested Workout</SecondaryButton>
        </div>
      </div>

      <div className='wb-card wb-stack-md'>
        <h3 className='wb-section-title'>Quick splits</h3>
        <div className='wb-row' style={{ flexWrap: 'wrap' }}>
          {quickSplits.map((split) => (
            <button key={split} className='wb-chip-button' style={{ padding: '0 18px' }} onClick={startEmpty}>
              {split}
            </button>
          ))}
        </div>
      </div>

      <div className='wb-card wb-stack-md'>
        <h3 className='wb-section-title'>Templates</h3>
        {templates.length ? templates.map((template) => (
          <button key={template.localId} className='wb-card wb-card-elevated wb-row-between' onClick={() => startFromTemplate(template.localId)}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 800 }}>{template.name}</div>
              <div className='wb-muted'>{template.description ?? 'Structured session'}</div>
            </div>
            <div className='wb-pill'>{template.splitType.replace(/_/g, ' ')}</div>
          </button>
        )) : <div className='wb-muted'>No templates available yet.</div>}
      </div>

      <div className='wb-card wb-stack-md'>
        <h3 className='wb-section-title'>Recent sessions</h3>
        {recentSessions.length ? recentSessions.map((session) => (
          <div key={session.localId} className='wb-row-between'>
            <div>
              <div style={{ fontWeight: 700 }}>{session.templateLocalId ? 'Template workout' : 'Custom workout'}</div>
              <div className='wb-muted'>{new Date(session.startedAt).toLocaleDateString()}</div>
            </div>
            <div className='wb-pill'>{session.summaryCacheJson?.durationMs ? `${Math.round(session.summaryCacheJson.durationMs / 60000)} min` : '—'}</div>
          </div>
        )) : <div className='wb-muted'>No recent sessions yet.</div>}
      </div>
      <div className='wb-tabbar-spacer' />
    </main>
  );
}
