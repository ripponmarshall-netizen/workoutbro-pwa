import React, { useState } from 'react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { getDb } from '../db/database';

const WEIGHT_UNIT_KEY = 'wb-weight-unit';
const DEFAULT_REST_KEY = 'wb-default-rest';

export function SettingsScreen(): JSX.Element {
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>(
    () => (localStorage.getItem(WEIGHT_UNIT_KEY) as 'kg' | 'lb') ?? 'kg',
  );
  const [defaultRest, setDefaultRest] = useState<number>(
    () => Number(localStorage.getItem(DEFAULT_REST_KEY) ?? 90),
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleWeightUnit = (unit: 'kg' | 'lb') => {
    setWeightUnit(unit);
    localStorage.setItem(WEIGHT_UNIT_KEY, unit);
  };

  const handleDefaultRest = (val: number) => {
    const clamped = Math.max(0, Math.min(600, val));
    setDefaultRest(clamped);
    localStorage.setItem(DEFAULT_REST_KEY, String(clamped));
  };

  const clearAllData = async () => {
    const db = getDb();
    await db.delete();
    window.location.reload();
  };

  return (
    <main className='wb-screen'>
      <ConfirmDialog
        open={showClearConfirm}
        title='Clear all data?'
        message='This deletes every workout, exercise, and record stored on this device. It cannot be undone.'
        confirmLabel='Clear everything'
        cancelLabel='Cancel'
        onConfirm={clearAllData}
        onCancel={() => setShowClearConfirm(false)}
        tone='danger'
      />

      <h1 className='wb-screen-title'>Settings</h1>

      {/* Units */}
      <div className='wb-card wb-stack-md'>
        <p className='wb-section-title'>Units</p>
        <div className='wb-row-between'>
          <span className='wb-label'>Weight unit</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`wb-chip-button${weightUnit === 'kg' ? ' active' : ''}`}
              onClick={() => handleWeightUnit('kg')}
              style={{ padding: '0 16px', minHeight: 36 }}
            >
              kg
            </button>
            <button
              className={`wb-chip-button${weightUnit === 'lb' ? ' active' : ''}`}
              onClick={() => handleWeightUnit('lb')}
              style={{ padding: '0 16px', minHeight: 36 }}
            >
              lb
            </button>
          </div>
        </div>
      </div>

      {/* Rest Timer */}
      <div className='wb-card wb-stack-md'>
        <p className='wb-section-title'>Rest Timer</p>
        <div className='wb-row-between'>
          <span className='wb-label'>Default rest (seconds)</span>
          <input
            type='number'
            min={0}
            max={600}
            value={defaultRest}
            onChange={(e) => handleDefaultRest(Number(e.target.value))}
            style={{ width: 90, textAlign: 'center' }}
          />
        </div>
      </div>

      {/* App Info */}
      <div className='wb-card wb-stack-md'>
        <p className='wb-section-title'>App Info</p>
        <div className='wb-row-between'>
          <span className='wb-label'>Version</span>
          <span className='wb-value'>1.0.0</span>
        </div>
        <div className='wb-row-between'>
          <span className='wb-label'>Source</span>
          <a
            href='https://github.com/ripponmarshall-netizen/workoutbro-pwa'
            target='_blank'
            rel='noopener noreferrer'
            style={{ color: 'var(--wb-accent)', fontWeight: 700 }}
          >
            GitHub
          </a>
        </div>
      </div>

      {/* Data */}
      <div className='wb-card wb-stack-md'>
        <p className='wb-section-title'>Data</p>
        <div className='wb-row-between'>
          <span className='wb-label'>Local storage</span>
          <button
            className='wb-chip-button'
            onClick={() => setShowClearConfirm(true)}
            style={{ padding: '0 16px', minHeight: 36, color: '#ff3b30', borderColor: 'rgba(255,59,48,0.35)' }}
          >
            Clear all data
          </button>
        </div>
      </div>
    </main>
  );
}
