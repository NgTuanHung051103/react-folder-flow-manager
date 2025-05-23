
import React, { useState, useRef } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Edit } from 'lucide-react';
import { FileItem } from '@/types/FileSystem';
import { cn } from '@/lib/utils';

interface FolderTreeProps {
  items: FileItem[];
  currentFolderId: string;
  onNavigate: (folderId: string) => void;
  onDrop: (targetFolderId: string, draggedItemIds: string[]) => void;
  onRename: (id: string, newName: string) => void;
}

export const FolderTree = ({ 
  items, 
  currentFolderId, 
  onNavigate, 
  onDrop, 
  onRename 
}: FolderTreeProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Get root folders
  const rootFolders = items.filter(item => item.parentId === null && item.type === 'folder');

  const handleToggleExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId);
      } else {
        newExpanded.add(folderId);
      }
      return newExpanded;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    // We only allow dropping into folders in the tree view
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      onDrop(targetFolderId, data.itemIds);
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.stopPropagation();
    const dragData = {
      itemIds: [itemId],
      action: 'move',
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };

  const startEditing = (item: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item.id);
    setEditName(item.name);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 10);
  };

  const handleRename = (id: string) => {
    if (editName.trim() !== "") {
      onRename(id, editName);
    }
    setEditingItem(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleRename(id);
    } else if (e.key === 'Escape') {
      setEditingItem(null);
    }
  };

  const renderFolderTree = (folderId: string, depth = 0) => {
    const folderItems = items.filter(item => 
      item.parentId === folderId && item.type === 'folder'
    );

    return (
      <div className="pl-4" style={{ marginLeft: depth === 0 ? 0 : undefined }}>
        {folderItems.map((folder) => (
          <div key={folder.id} className="select-none">
            <div 
              className={cn(
                "flex items-center py-1 px-1 rounded-md hover:bg-blue-50 cursor-pointer transition-colors",
                currentFolderId === folder.id && "bg-blue-100"
              )}
              onClick={() => onNavigate(folder.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, folder.id)}
              draggable
              onDragStart={(e) => handleDragStart(e, folder.id)}
            >
              <div 
                className="mr-1 p-0.5 hover:bg-blue-100 rounded-md" 
                onClick={(e) => handleToggleExpand(folder.id, e)}
              >
                {expandedFolders.has(folder.id) ? (
                  <ChevronDown size={16} className="text-gray-500" />
                ) : (
                  <ChevronRight size={16} className="text-gray-500" />
                )}
              </div>

              {expandedFolders.has(folder.id) ? (
                <FolderOpen size={18} className="text-blue-600 mr-1" />
              ) : (
                <Folder size={18} className="text-blue-600 mr-1" />
              )}

              {editingItem === folder.id ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleRename(folder.id)}
                  onKeyDown={(e) => handleKeyDown(e, folder.id)}
                  className="bg-white border rounded px-1 py-0 text-sm w-full"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <span className="text-sm truncate flex-1">{folder.name}</span>
                  <button 
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-blue-200 transition-opacity"
                    onClick={(e) => startEditing(folder, e)}
                  >
                    <Edit size={14} className="text-gray-600" />
                  </button>
                </>
              )}
            </div>

            {expandedFolders.has(folder.id) && renderFolderTree(folder.id, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto py-2">
      {renderFolderTree('root')}
    </div>
  );
};
