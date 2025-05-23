
import React, { useState, useRef, useEffect } from 'react';
import { FileItemComponent } from '../FileItem';
import { FileListView } from '../FileListView';
import { FileItem } from '@/types/FileSystem';
import { toast } from '@/hooks/use-toast';

interface ExplorerContentProps {
  currentItems: FileItem[];
  selectedItems: Set<string>;
  viewMode: 'grid' | 'list';
  currentFolderId: string;
  editingItem: string | null;
  editName: string;
  setEditName: (name: string) => void;
  getItemById: (id: string) => FileItem | undefined;
  handleItemSelect: (id: string, ctrlKey: boolean) => void;
  handleItemDoubleClick: (item: FileItem) => void;
  handleDragStart: (e: React.DragEvent, itemIds: string[]) => void;
  handleDrop: (targetFolderId: string, draggedItemIds: string[]) => void;
  handleRename: (id: string, newName: string) => void;
  setSelectedItems: (items: Set<string>) => void;
}

export const ExplorerContent: React.FC<ExplorerContentProps> = ({
  currentItems,
  selectedItems,
  viewMode,
  currentFolderId,
  editingItem,
  editName,
  setEditName,
  getItemById,
  handleItemSelect,
  handleItemDoubleClick,
  handleDragStart,
  handleDrop,
  handleRename,
  setSelectedItems
}) => {
  // Selection area implementation
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const [itemRects, setItemRects] = useState<Map<string, DOMRect>>(new Map());
  const contentRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<HTMLDivElement>(null);

  // Collect item positions for selection detection
  useEffect(() => {
    const updateItemRects = () => {
      const newRects = new Map<string, DOMRect>();
      const itemElements = document.querySelectorAll('[data-item-id]');
      
      itemElements.forEach(element => {
        const itemId = element.getAttribute('data-item-id');
        if (itemId) {
          const rect = element.getBoundingClientRect();
          newRects.set(itemId, rect);
        }
      });
      
      setItemRects(newRects);
    };

    // Update item positions when content changes
    updateItemRects();

    // Also update on resize
    window.addEventListener('resize', updateItemRects);
    return () => window.removeEventListener('resize', updateItemRects);
  }, [currentItems]);

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

  // Mouse events for selection area
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start selection if the click is directly on the container (not on an item)
    if (e.target === e.currentTarget && e.button === 0) { // Left mouse button
      e.preventDefault();
      
      // Get position relative to the container
      const rect = contentRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left + contentRef.current!.scrollLeft;
        const y = e.clientY - rect.top + contentRef.current!.scrollTop;
        
        setIsSelecting(true);
        setSelectionStart({ x, y });
        setSelectionEnd({ x, y });
        
        // Clear selection if not holding Ctrl
        if (!e.ctrlKey) {
          setSelectedItems(new Set());
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isSelecting) {
      const rect = contentRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left + contentRef.current!.scrollLeft;
        const y = e.clientY - rect.top + contentRef.current!.scrollTop;
        
        setSelectionEnd({ x, y });
        
        // Calculate selection area
        const selectionRect = getSelectionRect();
        
        // Find items that intersect with selection
        const contentRect = contentRef.current!.getBoundingClientRect();
        const intersectingItems = new Set<string>();
        
        itemRects.forEach((rect, itemId) => {
          // Convert global item coordinates to be relative to the content container
          const relativeRect = {
            left: rect.left - contentRect.left + contentRef.current!.scrollLeft,
            top: rect.top - contentRect.top + contentRef.current!.scrollTop,
            right: rect.right - contentRect.left + contentRef.current!.scrollLeft,
            bottom: rect.bottom - contentRect.top + contentRef.current!.scrollTop,
            width: rect.width,
            height: rect.height
          };
          
          // Check if the item intersects with the selection area
          if (
            selectionRect.left < relativeRect.right &&
            selectionRect.right > relativeRect.left &&
            selectionRect.top < relativeRect.bottom &&
            selectionRect.bottom > relativeRect.top
          ) {
            intersectingItems.add(itemId);
          }
        });
        
        // Update selected items (preserving existing selections if Ctrl is pressed)
        const newSelectedItems = new Set(e.ctrlKey ? selectedItems : []);
        intersectingItems.forEach(id => newSelectedItems.add(id));
        setSelectedItems(newSelectedItems);
      }
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  // Calculate the selection rectangle
  const getSelectionRect = () => {
    const left = Math.min(selectionStart.x, selectionEnd.x);
    const top = Math.min(selectionStart.y, selectionEnd.y);
    const right = Math.max(selectionStart.x, selectionEnd.x);
    const bottom = Math.max(selectionStart.y, selectionEnd.y);
    
    return { 
      left, 
      top, 
      right, 
      bottom, 
      width: right - left, 
      height: bottom - top 
    };
  };

  const selectionStyle = {
    display: isSelecting ? 'block' : 'none',
    position: 'absolute',
    left: `${Math.min(selectionStart.x, selectionEnd.x)}px`,
    top: `${Math.min(selectionStart.y, selectionEnd.y)}px`,
    width: `${Math.abs(selectionEnd.x - selectionStart.x)}px`,
    height: `${Math.abs(selectionEnd.y - selectionStart.y)}px`,
    backgroundColor: 'rgba(65, 105, 225, 0.2)',
    border: '1px solid #4169E1',
    pointerEvents: 'none',
    zIndex: 1,
  } as React.CSSProperties;

  return (
    <div
      ref={contentRef}
      className="flex-1 p-4 overflow-auto relative"
      onDragOver={handleAreaDragOver}
      onDrop={handleAreaDrop}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSelecting) {
          setSelectedItems(new Set());
        }
      }}
    >
      {/* Selection area visualization */}
      <div ref={selectionRef} style={selectionStyle} />
      
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
  );
};
