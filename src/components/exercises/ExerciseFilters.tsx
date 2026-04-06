import React from 'react';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  selectedFilter: string;
  onFilterChange: (value: string) => void;
};

const filters = ['all', 'push', 'pull', 'legs', 'upper', 'lower'];

export function ExerciseFilters({ search, onSearchChange, selectedFilter, onFilterChange }: Props): JSX.Element {
  return (
    <div className='wb-card wb-stack-md'>
      <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder='Search exercises' />
      <div className='wb-row' style={{ flexWrap: 'wrap' }}>
        {filters.map((filter) => (
          <button
            key={filter}
            className={`wb-chip-button ${selectedFilter === filter ? 'active' : ''}`}
            onClick={() => onFilterChange(filter)}
            style={{ padding: '0 16px' }}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
}
