
import React, { useState, useEffect } from 'react';
import { useFileSystem } from '@/hooks/useFileSystem';
import { Breadcrumb } from './Breadcrumb';
import { FileItemComponent } from './FileItem';
import { ContextMenu } from './ContextMenu';
import { FilePreview } from './FilePreview';
import { ViewModeToggle } from './ViewModeToggle';
import { FolderTree } from './FolderTree';
import { FileListView } from './FileListView';
import { FileItem, DragData } from '@/types/FileSystem';
import { toast } from '@/hooks/use-toast';

export const FileExplorer = () => {
  const {
    currentFolderId,
    selectedItems,
    clipboard,
    setCurrentFolderId,
    setSelectedItems,
    getItemsInFolder,
    getItemById,
    getBreadcrumbs,
    moveItems,
    createItem,
    renameItem,
    deleteItems,
    selectAll,
    cutItems,
    copyItems,
    pasteItems,
    items, // We need the full items array for the folder tree
  } = useFileSystem();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const currentItems = getItemsInFolder(currentFolderId);
  const breadcrumbs = getBreadcrumbs(currentFolderId);

  // Reset editing state when changing folders
  useEffect(() => {
    setEditingItem(null);
  }, [currentFolderId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        switch (e.key) {
          case 'a':
            e.preventDefault();
            selectAll();
            break;
          case 'x':
            e.preventDefault();
            if (selectedItems.size > 0) {
              cutItems(Array.from(selectedItems));
              toast({
                title: "Cut",
                description: `Cut ${selectedItems.size} item(s)`,
              });
            }
            break;
          case 'c':
            e.preventDefault();
            if (selectedItems.size > 0) {
              copyItems(Array.from(selectedItems));
              toast({
                title: "Copy",
                description: `Copied ${selectedItems.size} item(s)`,
              });
            }
            break;
          case 'v':
            e.preventDefault();
            if (clipboard) {
              pasteItems();
              toast({
                title: "Paste",
                description: "Items pasted successfully",
              });
            }
            break;
        }
      } else if (e.key === 'F2' && selectedItems.size === 1) {
        setEditingItem(Array.from(selectedItems)[0]);
        const item = getItemById(Array.from(selectedItems)[0]);
        if (item) {
          setEditName(item.name);
        }
      } else if (e.key === 'Delete' && selectedItems.size > 0) {
        deleteItems(Array.from(selectedItems));
        toast({
          title: "Delete",
          description: `Deleted ${selectedItems.size} item(s)`,
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItems, clipboard, selectAll, cutItems, copyItems, pasteItems, deleteItems, getItemById]);

  const handleItemSelect = (id: string, ctrlKey: boolean) => {
    if (ctrlKey) {
      const newSelected = new Set(selectedItems);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedItems(newSelected);
    } else {
      setSelectedItems(new Set([id]));
    }
  };

  const handleItemDoubleClick = (item: FileItem) => {
    if (item.type === 'folder') {
      setCurrentFolderId(item.id);
      setSelectedItems(new Set());
    } else {
      // If it's an image or PDF, show preview
      if (item.extension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'].includes(item.extension.toLowerCase())) {
        setPreviewFile(item);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, itemIds: string[]) => {
    const dragData: DragData = {
      itemIds: selectedItems.size > 0 && selectedItems.has(itemIds[0]) 
        ? Array.from(selectedItems) 
        : itemIds,
      action: 'move',
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (targetFolderId: string, draggedItemIds: string[]) => {
    // Validate the target is a folder
    const targetItem = getItemById(targetFolderId);
    if (!targetItem || targetItem.type !== 'folder') {
      toast({
        title: "Invalid Operation",
        description: "Items can only be dropped into folders",
        variant: "destructive",
      });
      return;
    }
    
    // Don't allow dropping into self or children
    if (draggedItemIds.includes(targetFolderId)) {
      toast({
        title: "Invalid Operation",
        description: "Cannot move a folder into itself",
        variant: "destructive",
      });
      return;
    }

    moveItems(draggedItemIds, targetFolderId);
    toast({
      title: "Move Operation",
      description: `Moved ${draggedItemIds.length} item(s) to folder: ${getItemById(targetFolderId)?.name || 'Unknown'}`,
    });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCreateFile = () => {
    const name = prompt('Enter file name:');
    if (name) {
      createItem(name, 'file', currentFolderId);
      toast({
        title: "File Created",
        description: `Created file: ${name}`,
      });
    }
    setContextMenu(null);
  };

  const handleCreateFolder = () => {
    const name = prompt('Enter folder name:');
    if (name) {
      createItem(name, 'folder', currentFolderId);
      toast({
        title: "Folder Created",
        description: `Created folder: ${name}`,
      });
    }
    setContextMenu(null);
  };

  const handleRename = (id: string, newName: string) => {
    if (newName.trim() && newName !== getItemById(id)?.name) {
      renameItem(id, newName);
      toast({
        title: "Renamed",
        description: `Renamed to: ${newName}`,
      });
    }
    setEditingItem(null);
  };

  const handleAreaDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleAreaDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      // Only process drop if current folder is a valid destination
      const currentFolder = getItemById(currentFolderId);
      if (currentFolder && currentFolder.type === 'folder') {
        handleDrop(currentFolderId, data.itemIds);
      } else {
        toast({
          title: "Invalid Operation",
          description: "Items can only be dropped into folders",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
  };

  const isEditing = (id: string) => editingItem === id;

  return (
    <div className="h-screen flex bg-white">
      {/* Left sidebar with folder tree */}
      <div className="w-60 border-r flex flex-col h-full bg-gray-50">
        <div className="p-2 border-b font-medium text-sm">Folders</div>
        <div className="flex-1 overflow-auto">
          <FolderTree 
            items={items}
            currentFolderId={currentFolderId}
            onNavigate={setCurrentFolderId}
            onDrop={handleDrop}
            onRename={handleRename}
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-full">
        <Breadcrumb
          items={breadcrumbs}
          onNavigate={setCurrentFolderId}
          onDrop={handleDrop}
        />
        
        {/* Toolbar with view toggle */}
        <div className="flex items-center px-4 py-2 border-b bg-gray-50">
          <div className="flex-1">
            <span className="text-sm text-gray-600">
              {selectedItems.size > 0 ? `${selectedItems.size} item(s) selected` : `${currentItems.length} item(s)`}
            </span>
          </div>
          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
        
        <div
          className="flex-1 p-4 overflow-auto"
          onContextMenu={handleContextMenu}
          onDragOver={handleAreaDragOver}
          onDrop={handleAreaDrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedItems(new Set());
            }
          }}
        >
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-6 gap-4">
              {currentItems.map((item) => (
                <FileItemComponent
                  key={item.id}
                  item={item}
                  isSelected={selectedItems.has(item.id)}
                  isEditing={isEditing(item.id)}
                  onSelect={handleItemSelect}
                  onDoubleClick={handleItemDoubleClick}
                  onRename={(id, newName) => handleRename(id, newName)}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          ) : (
            <FileListView
              items={currentItems}
              selectedItems={selectedItems}
              onSelect={handleItemSelect}
              onDoubleClick={handleItemDoubleClick}
              onDragStart={handleDragStart}
              isEditing={isEditing}
              editName={editName}
              setEditName={setEditName}
              onRename={handleRename}
            />
          )}
          
          {currentItems.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              This folder is empty
            </div>
          )}
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onRename={() => {
            if (selectedItems.size === 1) {
              const itemId = Array.from(selectedItems)[0];
              const item = getItemById(itemId);
              if (item) {
                setEditingItem(itemId);
                setEditName(item.name);
              }
            }
            setContextMenu(null);
          }}
          onDelete={() => {
            if (selectedItems.size > 0) {
              deleteItems(Array.from(selectedItems));
              toast({
                title: "Delete",
                description: `Deleted ${selectedItems.size} item(s)`,
              });
            }
            setContextMenu(null);
          }}
          onCut={() => {
            if (selectedItems.size > 0) {
              cutItems(Array.from(selectedItems));
              toast({
                title: "Cut",
                description: `Cut ${selectedItems.size} item(s)`,
              });
            }
            setContextMenu(null);
          }}
          onCopy={() => {
            if (selectedItems.size > 0) {
              copyItems(Array.from(selectedItems));
              toast({
                title: "Copy",
                description: `Copied ${selectedItems.size} item(s)`,
              });
            }
            setContextMenu(null);
          }}
          onPaste={() => {
            if (clipboard) {
              pasteItems();
              toast({
                title: "Paste",
                description: "Items pasted successfully",
              });
            }
            setContextMenu(null);
          }}
          onSelectAll={() => {
            selectAll();
            setContextMenu(null);
          }}
          hasSelection={selectedItems.size > 0}
          hasClipboard={!!clipboard}
        />
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreview 
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};
