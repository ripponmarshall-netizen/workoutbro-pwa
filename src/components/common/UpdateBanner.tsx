import React from 'react';

interface UpdateBannerProps {
  /** Whether a new service worker is waiting to activate. */
  show: boolean;
  /** Called when the user confirms they want to apply the update. */
  onUpdate: () => void;
}

/**
 * Fixed banner at the top of the viewport (beneath the offline banner if
 * both are visible) that prompts the user to reload and apply a pending
 * service-worker update.
 */
export function UpdateBanner({ show, onUpdate }: UpdateBannerProps): JSX.Element | null {
  if (!show) return null;

  return (
    <div className="wb-update-banner" role="status" aria-live="polite">
      <span>Update available</span>
      <button className="wb-update-banner__button" onClick={onUpdate}>
        Reload
      </button>
    </div>
  );
}
