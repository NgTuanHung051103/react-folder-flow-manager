
import React, { useState, useEffect } from 'react';
import { useFileSystem } from '@/hooks/useFileSystem';
import { Breadcrumb } from './Breadcrumb';
import { FileItemComponent } from './FileItem';
import { ContextMenu } from './ContextMenu';
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
  } = useFileSystem();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const currentItems = getItemsInFolder(currentFolderId);
  const breadcrumbs = getBreadcrumbs(currentFolderId);

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
  }, [selectedItems, clipboard, selectAll, cutItems, copyItems, pasteItems, deleteItems]);

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
    }
  };

  const handleDragStart = (e: React.DragEvent, itemIds: string[]) => {
    const dragData: DragData = {
      itemIds: selectedItems.size > 0 ? Array.from(selectedItems) : itemIds,
      action: 'move',
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (targetFolderId: string, draggedItemIds: string[]) => {
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
      description: `Moved items [${draggedItemIds.join(', ')}] to folder: ${targetFolderId}`,
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
    if (newName !== getItemById(id)?.name) {
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
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    handleDrop(currentFolderId, data.itemIds);
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <Breadcrumb
        items={breadcrumbs}
        onNavigate={setCurrentFolderId}
        onDrop={handleDrop}
      />
      
      <div
        className="flex-1 p-4 overflow-auto"
        onContextMenu={handleContextMenu}
        onDragOver={handleAreaDragOver}
        onDrop={handleAreaDrop}
        onClick={() => setSelectedItems(new Set())}
      >
        <div className="grid grid-cols-6 gap-4">
          {currentItems.map((item) => (
            <FileItemComponent
              key={item.id}
              item={item}
              isSelected={selectedItems.has(item.id)}
              isEditing={editingItem === item.id}
              onSelect={handleItemSelect}
              onDoubleClick={handleItemDoubleClick}
              onRename={handleRename}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          ))}
        </div>
        
        {currentItems.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            This folder is empty
          </div>
        )}
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
              setEditingItem(Array.from(selectedItems)[0]);
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
    </div>
  );
};
