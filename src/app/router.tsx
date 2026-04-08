import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './AppShell';
import { DashboardScreen } from '../screens/DashboardScreen';
import { StartWorkoutScreen } from '../screens/StartWorkoutScreen';
import { ActiveWorkoutScreen } from '../screens/ActiveWorkoutScreen';
import { AddExerciseScreen } from '../screens/AddExerciseScreen';
import { ExerciseDetailScreen } from '../screens/ExerciseDetailScreen';
import { WorkoutSummaryScreen } from '../screens/WorkoutSummaryScreen';
import { ProgressOverviewScreen } from '../screens/ProgressOverviewScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppShell />,
      children: [
        { index: true, element: <DashboardScreen /> },
        { path: 'start-workout', element: <StartWorkoutScreen /> },
        { path: 'workout/active/:sessionId?', element: <ActiveWorkoutScreen /> },
        { path: 'workout/:sessionId/add-exercise', element: <AddExerciseScreen /> },
        { path: 'exercise/:exerciseId', element: <ExerciseDetailScreen /> },
        { path: 'workout/:sessionId/summary', element: <WorkoutSummaryScreen /> },
        { path: 'progress', element: <ProgressOverviewScreen /> },
        { path: 'settings', element: <SettingsScreen /> },
        { path: '*', element: <Navigate to='/' replace /> },
      ],
    },
  ],
  {
    basename: '/workoutbro-pwa/',
  },
);
