
import React from 'react';
import { ChevronRight, Folder } from 'lucide-react';
import { BreadcrumbItem } from '@/types/FileSystem';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (folderId: string) => void;
  onDrop: (targetFolderId: string, draggedItemIds: string[]) => void;
}

export const Breadcrumb = ({ items, onNavigate, onDrop }: BreadcrumbProps) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    onDrop(targetFolderId, data.itemIds);
  };

  return (
    <div className="flex items-center space-x-2 p-4 bg-gray-50 border-b">
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          <div
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer transition-colors"
            onClick={() => onNavigate(item.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, item.id)}
          >
            <Folder size={16} className="text-blue-600" />
            <span className="text-sm text-gray-700">{item.name}</span>
          </div>
          {index < items.length - 1 && (
            <ChevronRight size={16} className="text-gray-400" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
