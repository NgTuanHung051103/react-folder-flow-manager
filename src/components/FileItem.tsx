import React, { useState, useEffect } from 'react';
import { File, Folder } from 'lucide-react';
import { FileItem as FileItemType } from '@/types/FileSystem';
import { cn } from '@/lib/utils';

interface FileItemProps {
  item: FileItemType;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (id: string, ctrlKey: boolean) => void;
  onDoubleClick: (item: FileItemType) => void;
  onRename: (id: string, newName: string) => void;
  onDragStart: (e: React.DragEvent, itemIds: string[]) => void;
  onDrop: (targetId: string, draggedItemIds: string[]) => void;
}

export const FileItemComponent = ({
  item,
  isSelected,
  isEditing,
  onSelect,
  onDoubleClick,
  onRename,
  onDragStart,
  onDrop,
}: FileItemProps) => {
  const [editName, setEditName] = useState(item.name);
  
  // Update editName when item changes or when isEditing becomes true
  useEffect(() => {
    if (isEditing) {
      setEditName(item.name);
    }
  }, [item.name, isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onRename(item.id, editName);
    } else if (e.key === 'Escape') {
      setEditName(item.name);
      onRename(item.id, item.name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Only allow drop if the item is a folder
    if (item.type === 'folder') {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    // Only process drop if this is a folder
    if (item.type === 'folder') {
      e.preventDefault();
      e.stopPropagation();
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        onDrop(item.id, data.itemIds);
      } catch (error) {
        console.error('Error parsing drag data:', error);
      }
    }
  };

  // Determine if the item is an image file for potential preview
  const isImageFile = item.type === 'file' && 
    item.extension && 
    ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(item.extension.toLowerCase());
  
  const isPdfFile = item.type === 'file' && 
    item.extension && 
    item.extension.toLowerCase() === 'pdf';

  return (
    <div
      className={cn(
        "flex flex-col items-center p-3 m-1 rounded-lg cursor-pointer select-none transition-colors group",
        "hover:bg-blue-50 hover:border-blue-200",
        isSelected && "bg-blue-100 border-blue-300",
        "border border-transparent",
        (isImageFile || isPdfFile) && "hover:shadow-md"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item.id, e.ctrlKey);
      }}
      onDoubleClick={() => onDoubleClick(item)}
      draggable={!isEditing}
      onDragStart={(e) => onDragStart(e, [item.id])}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="mb-2">
        {item.type === 'folder' ? (
          <Folder size={48} className="text-blue-600" />
        ) : (
          <File size={48} className="text-gray-600" />
        )}
      </div>
      
      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={() => onRename(item.id, editName)}
          onKeyDown={handleKeyDown}
          className="text-center text-sm bg-white border rounded px-1 py-0.5 w-full"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="text-sm text-center break-words w-full">
          {item.name}
        </span>
      )}
      
      {item.type === 'file' && item.size && (
        <span className="text-xs text-gray-500 mt-1">
          {(item.size / 1024).toFixed(1)} KB
        </span>
      )}
    </div>
  );
};
