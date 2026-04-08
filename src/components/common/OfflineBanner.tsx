import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

/**
 * Slim fixed bar at the very top of the viewport.
 * Slides down into view when the device goes offline and slides back up
 * when connectivity is restored.
 */
export function OfflineBanner(): JSX.Element {
  const isOnline = useOnlineStatus();

  return (
    <div
      className={`wb-offline-banner${!isOnline ? ' wb-offline-banner--visible' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Network status"
    >
      You're offline — changes save locally
    </div>
  );
}
