
import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onSelectAll: () => void;
  hasSelection: boolean;
  hasClipboard: boolean;
}

export const ContextMenu = ({
  x,
  y,
  onClose,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  onCut,
  onCopy,
  onPaste,
  onSelectAll,
  hasSelection,
  hasClipboard,
}: ContextMenuProps) => {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white border border-gray-300 rounded-md shadow-lg py-1 min-w-[160px]"
        style={{ left: x, top: y }}
      >
        <button
          onClick={onCreateFile}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
        >
          New File
        </button>
        <button
          onClick={onCreateFolder}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
        >
          New Folder
        </button>
        
        <hr className="my-1" />
        
        <button
          onClick={onCut}
          disabled={!hasSelection}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          Cut (Ctrl+X)
        </button>
        <button
          onClick={onCopy}
          disabled={!hasSelection}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          Copy (Ctrl+C)
        </button>
        <button
          onClick={onPaste}
          disabled={!hasClipboard}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          Paste (Ctrl+V)
        </button>
        
        <hr className="my-1" />
        
        <button
          onClick={onSelectAll}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
        >
          Select All (Ctrl+A)
        </button>
        
        {hasSelection && (
          <>
            <hr className="my-1" />
            <button
              onClick={onRename}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              Rename (F2)
            </button>
            <button
              onClick={onDelete}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </>
  );
};
