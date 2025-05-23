
import React from 'react';
import { X } from 'lucide-react';
import { FileItem } from '@/types/FileSystem';

interface FilePreviewProps {
  file: FileItem | null;
  onClose: () => void;
}

export const FilePreview = ({ file, onClose }: FilePreviewProps) => {
  if (!file) return null;

  const isImage = file.extension && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.extension.toLowerCase());
  const isPdf = file.extension && file.extension.toLowerCase() === 'pdf';

  // For demo purposes, we'll use placeholder URLs based on file name
  const getPlaceholderUrl = () => {
    if (isImage) {
      // Create a stable but random-looking URL based on the file name
      const hash = file.name.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const imageId = Math.abs(hash) % 15 + 1;
      return `https://source.unsplash.com/1600x900/?nature,${imageId}`;
    }
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-medium">{file.name}</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-auto flex items-center justify-center">
          {isImage && (
            <img 
              src={getPlaceholderUrl()} 
              alt={file.name}
              className="max-w-full max-h-[70vh] object-contain"
            />
          )}
          
          {isPdf && (
            <div className="w-full h-[70vh] flex items-center justify-center bg-gray-100 rounded">
              <iframe 
                src={`https://docs.google.com/viewer?url=${encodeURIComponent('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')}&embedded=true`}
                className="w-full h-full border-0"
                title={file.name}
              />
            </div>
          )}
          
          {!isImage && !isPdf && (
            <div className="text-gray-500">Preview not available for this file type</div>
          )}
        </div>
      </div>
    </div>
  );
};
