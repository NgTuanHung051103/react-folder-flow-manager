
export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  size?: number;
  lastModified: Date;
  extension?: string;
}

export interface DragData {
  itemIds: string[];
  action: 'move' | 'copy';
}

export interface ClipboardData {
  itemIds: string[];
  action: 'cut' | 'copy';
  sourceParentId: string;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}
