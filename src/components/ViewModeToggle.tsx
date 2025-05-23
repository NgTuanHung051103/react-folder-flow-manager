
import React from 'react';
import { Grid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewModeToggleProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export const ViewModeToggle = ({ viewMode, onViewModeChange }: ViewModeToggleProps) => {
  return (
    <div className="flex items-center gap-1 bg-white border rounded-md">
      <button
        onClick={() => onViewModeChange('grid')}
        className={cn(
          "p-1.5 rounded-l-md transition-colors",
          viewMode === 'grid' ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
        )}
        title="Grid view"
      >
        <Grid size={18} />
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={cn(
          "p-1.5 rounded-r-md transition-colors",
          viewMode === 'list' ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
        )}
        title="List view"
      >
        <List size={18} />
      </button>
    </div>
  );
};
