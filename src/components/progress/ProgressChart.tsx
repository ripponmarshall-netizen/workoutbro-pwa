import React from 'react';

type Point = { label: string; value: number };

type Props = {
  title: string;
  points: Point[];
  color?: string;
};

export function ProgressChart({ title, points, color = 'var(--wb-accent)' }: Props): JSX.Element {
  const max = Math.max(1, ...points.map((point) => point.value));
  const width = 320;
  const height = 140;
  const xStep = points.length > 1 ? width / (points.length - 1) : width;
  const d = points
    .map((point, index) => {
      const x = index * xStep;
      const y = height - (point.value / max) * (height - 18) - 8;
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  return (
    <div className='wb-card wb-stack-md'>
      <div className='wb-row-between'>
        <h3 className='wb-section-title'>{title}</h3>
        <div className='wb-pill'>{points.length} points</div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 160 }} aria-label={title}>
        <path d={`M0,${height - 8} L${width},${height - 8}`} stroke='rgba(255,255,255,0.09)' strokeWidth='1' />
        <path d={d} fill='none' stroke={color} strokeWidth='4' strokeLinecap='round' strokeLinejoin='round' />
        {points.map((point, index) => {
          const x = index * xStep;
          const y = height - (point.value / max) * (height - 18) - 8;
          return <circle key={point.label} cx={x} cy={y} r='4' fill={color} />;
        })}
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(points.length, 1)}, minmax(0, 1fr))`, gap: 8 }}>
        {points.map((point) => (
          <div key={point.label} className='wb-faint' style={{ fontSize: 12 }}>{point.label}</div>
        ))}
      </div>
    </div>
  );
}
