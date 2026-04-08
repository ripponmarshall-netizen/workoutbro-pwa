import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  tone?: 'danger' | 'accent';
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  tone = 'accent',
}: ConfirmDialogProps): JSX.Element | null {
  if (!open) return null;

  return (
    <div className='wb-overlay' role='dialog' aria-modal='true' aria-labelledby='confirm-dialog-title' onClick={onCancel}>
      <div className='wb-dialog' onClick={(e) => e.stopPropagation()}>
        <h2 id='confirm-dialog-title' className='wb-dialog-title'>
          {title}
        </h2>
        <p className='wb-dialog-message'>{message}</p>
        <div className='wb-dialog-actions'>
          <button className='wb-btn-secondary' onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={tone === 'danger' ? 'wb-btn-danger' : 'wb-btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
