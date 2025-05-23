
import { useState, useCallback } from 'react';
import { FileItem, ClipboardData } from '@/types/FileSystem';

export const useFileSystem = () => {
  const [items, setItems] = useState<FileItem[]>([
    {
      id: 'root',
      name: 'Root',
      type: 'folder',
      parentId: null,
      lastModified: new Date(),
    },
    {
      id: 'folder-1',
      name: 'Documents',
      type: 'folder',
      parentId: 'root',
      lastModified: new Date(),
    },
    {
      id: 'folder-2',
      name: 'Images',
      type: 'folder',
      parentId: 'root',
      lastModified: new Date(),
    },
    {
      id: 'file-1',
      name: 'document.pdf',
      type: 'file',
      parentId: 'folder-1',
      size: 1024,
      extension: 'pdf',
      lastModified: new Date(),
    },
    {
      id: 'file-2',
      name: 'image.jpg',
      type: 'file',
      parentId: 'folder-2',
      size: 2048,
      extension: 'jpg',
      lastModified: new Date(),
    },
    {
      id: 'file-3',
      name: 'notes.txt',
      type: 'file',
      parentId: 'folder-1',
      size: 512,
      extension: 'txt',
      lastModified: new Date(),
    },
    {
      id: 'folder-3',
      name: 'Projects',
      type: 'folder',
      parentId: 'folder-1',
      lastModified: new Date(),
    },
    {
      id: 'file-4',
      name: 'project-plan.pdf',
      type: 'file',
      parentId: 'folder-3',
      size: 3072,
      extension: 'pdf',
      lastModified: new Date(),
    },
    {
      id: 'file-5',
      name: 'background.png',
      type: 'file',
      parentId: 'folder-2',
      size: 4096,
      extension: 'png',
      lastModified: new Date(),
    },
  ]);

  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);

  const getItemsInFolder = useCallback((folderId: string) => {
    return items.filter(item => item.parentId === folderId);
  }, [items]);

  const getItemById = useCallback((id: string) => {
    return items.find(item => item.id === id);
  }, [items]);

  const getBreadcrumbs = useCallback((folderId: string) => {
    const breadcrumbs = [];
    let currentId = folderId;
    
    while (currentId) {
      const item = getItemById(currentId);
      if (item) {
        breadcrumbs.unshift({ id: item.id, name: item.name });
        currentId = item.parentId || '';
      } else {
        break;
      }
    }
    
    return breadcrumbs;
  }, [getItemById]);

  const moveItems = useCallback((itemIds: string[], targetFolderId: string) => {
    console.log(`Moving items [${itemIds.join(', ')}] to folder: ${targetFolderId}`);
    
    setItems(prev => prev.map(item => 
      itemIds.includes(item.id) 
        ? { ...item, parentId: targetFolderId }
        : item
    ));
    
    setSelectedItems(new Set());
  }, []);

  const createItem = useCallback((name: string, type: 'file' | 'folder', parentId: string) => {
    const newItem: FileItem = {
      id: `${type}-${Date.now()}`,
      name,
      type,
      parentId,
      lastModified: new Date(),
      ...(type === 'file' && { 
        size: 0, 
        extension: name.includes('.') ? name.split('.').pop() : undefined 
      }),
    };
    
    setItems(prev => [...prev, newItem]);
    return newItem.id;
  }, []);

  const renameItem = useCallback((id: string, newName: string) => {
    if (!newName.trim()) return;
    
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { 
            ...item, 
            name: newName,
            ...(item.type === 'file' && { 
              extension: newName.includes('.') ? newName.split('.').pop() : item.extension 
            })
          }
        : item
    ));
  }, []);

  const deleteItems = useCallback((itemIds: string[]) => {
    const getAllChildIds = (parentIds: string[]): string[] => {
      const childIds = items
        .filter(item => parentIds.includes(item.parentId || ''))
        .map(item => item.id);
      
      if (childIds.length === 0) return [];
      
      return [...childIds, ...getAllChildIds(childIds)];
    };
    
    const allIdsToDelete = [...itemIds, ...getAllChildIds(itemIds)];
    
    setItems(prev => prev.filter(item => !allIdsToDelete.includes(item.id)));
    setSelectedItems(new Set());
  }, [items]);

  const selectAll = useCallback(() => {
    const itemsInCurrentFolder = getItemsInFolder(currentFolderId);
    setSelectedItems(new Set(itemsInCurrentFolder.map(item => item.id)));
  }, [getItemsInFolder, currentFolderId]);

  const cutItems = useCallback((itemIds: string[]) => {
    setClipboard({
      itemIds,
      action: 'cut',
      sourceParentId: currentFolderId,
    });
  }, [currentFolderId]);

  const copyItems = useCallback((itemIds: string[]) => {
    setClipboard({
      itemIds,
      action: 'copy',
      sourceParentId: currentFolderId,
    });
  }, [currentFolderId]);

  const pasteItems = useCallback(() => {
    if (!clipboard) return;
    
    if (clipboard.action === 'cut') {
      moveItems(clipboard.itemIds, currentFolderId);
      setClipboard(null);
    } else {
      // Copy items
      const newItems: FileItem[] = [];
      
      clipboard.itemIds.forEach(id => {
        const originalItem = getItemById(id);
        if (originalItem) {
          const newItem: FileItem = {
            ...originalItem,
            id: `${originalItem.type}-${Date.now()}-${Math.random()}`,
            name: `Copy of ${originalItem.name}`,
            parentId: currentFolderId,
          };
          newItems.push(newItem);
        }
      });
      
      setItems(prev => [...prev, ...newItems]);
    }
  }, [clipboard, currentFolderId, moveItems, getItemById]);

  return {
    items,
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
  };
};
