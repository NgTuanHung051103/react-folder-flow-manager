
import React from 'react';
import { File, Folder } from 'lucide-react';
import { FileItem } from '@/types/FileSystem';
import { cn } from '@/lib/utils';

interface FileListViewProps {
  items: FileItem[];
  selectedItems: Set<string>;
  onSelect: (id: string, ctrlKey: boolean) => void;
  onDoubleClick: (item: FileItem) => void;
  onDragStart: (e: React.DragEvent, itemIds: string[]) => void;
  isEditing: (id: string) => boolean;
  editName: string;
  setEditName: (name: string) => void;
  onRename: (id: string, newName: string) => void;
}

export const FileListView = ({
  items,
  selectedItems,
  onSelect,
  onDoubleClick,
  onDragStart,
  isEditing,
  editName,
  setEditName,
  onRename,
}: FileListViewProps) => {
  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      onRename(id, editName);
    } else if (e.key === 'Escape') {
      onRename(id, items.find(item => item.id === id)?.name || '');
    }
  };

  return (
    <div className="w-full">
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left text-sm text-gray-600 border-b">
            <th className="p-2">Name</th>
            <th className="p-2">Type</th>
            <th className="p-2">Size</th>
            <th className="p-2">Modified</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              data-item-id={item.id}
              className={cn(
                "hover:bg-blue-50 cursor-pointer border-b",
                selectedItems.has(item.id) && "bg-blue-100"
              )}
              onClick={(e) => onSelect(item.id, e.ctrlKey)}
              onDoubleClick={() => onDoubleClick(item)}
              draggable={!isEditing(item.id)}
              onDragStart={(e) => onDragStart(e, [item.id])}
            >
              <td className="p-2">
                <div className="flex items-center gap-2">
                  {item.type === 'folder' ? (
                    <Folder size={20} className="text-blue-600" />
                  ) : (
                    <File size={20} className="text-gray-600" />
                  )}
                  
                  {isEditing(item.id) ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => onRename(item.id, editName)}
                      onKeyDown={(e) => handleKeyDown(e, item.id)}
                      className="border rounded px-2 py-0.5 text-sm"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-sm">{item.name}</span>
                  )}
                </div>
              </td>
              <td className="p-2 text-sm text-gray-600">
                {item.type === 'folder' ? 'Folder' : item.extension?.toUpperCase() || 'File'}
              </td>
              <td className="p-2 text-sm text-gray-600">
                {item.type === 'file' && item.size
                  ? `${(item.size / 1024).toFixed(1)} KB`
                  : ''}
              </td>
              <td className="p-2 text-sm text-gray-600">
                {item.lastModified.toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
