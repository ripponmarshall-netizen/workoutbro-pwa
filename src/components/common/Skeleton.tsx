import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 'var(--wb-radius-sm)',
}: SkeletonProps): JSX.Element {
  return (
    <div
      className='wb-skeleton'
      style={{
        width,
        height,
        borderRadius,
      }}
    />
  );
}
