import React from 'react';
import { FileText, AlertCircle, Check, X, UploadCloud } from 'lucide-react';
import type { FileUploadStatus as FileUploadStatusType } from '../../types';

interface FileUploadStatusProps {
  status: FileUploadStatusType;
  fileName: string;
  onClear: () => void;
  onUploadAnother: () => void;
}

const FileUploadStatus: React.FC<FileUploadStatusProps> = ({
  status,
  fileName,
  onClear,
  onUploadAnother
}) => {
  return (
    <div className="py-2">
      <div className="flex items-center justify-center mb-4">
        {status.status === 'uploading' ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        ) : status.status === 'success' ? (
          <div className="flex items-center text-green-600">
            <Check className="h-8 w-8 mr-2" />
            <span>Uploaded successfully</span>
          </div>
        ) : status.status === 'error' ? (
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-8 w-8 mr-2" />
            <span>{status.message}</span>
          </div>
        ) : (
          <div className="flex items-center text-gray-600">
            <FileText className="h-8 w-8 mr-2" />
            <span>Processing file...</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-center space-x-2 mb-3">
        <FileText className="h-5 w-5 text-gray-500" />
        <span className="text-gray-700 font-medium">{fileName}</span>
      </div>
      
      <div className="flex justify-center space-x-3">
        <button
          onClick={onClear}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors flex items-center"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </button>
        
        <button
          onClick={onUploadAnother}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
        >
          <UploadCloud className="h-4 w-4 mr-1" />
          Upload Another
        </button>
      </div>
    </div>
  );
};

export default FileUploadStatus;