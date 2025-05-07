import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import type { CSVRow, FileUploadStatus as FileUploadStatusType } from '../../types';
import { processCSV, isValidFileType } from '../../utils/fileProcessing';
import FileUploadStatus from './FileUploadStatus';

interface FileUploadProps {
  onDataParsed: (data: CSVRow[], headers: string[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataParsed }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<FileUploadStatusType>({
    status: 'idle',
    message: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelection(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      handleFileSelection(selectedFile);
    }
  };

  const handleFileSelection = (selectedFile: File): void => {
    if (isValidFileType(selectedFile)) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      processCSV(
        selectedFile, 
        setUploadStatus,
        onDataParsed
      );
    } else {
      setUploadStatus({
        status: 'error',
        message: 'Please upload a CSV or Excel file',
      });
    }
  };

  const clearFile = (): void => {
    setFile(null);
    setFileName('');
    setUploadStatus({
      status: 'idle',
      message: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onDataParsed([], []);
  };

  const triggerFileInput = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">CSV File Uploader</h2>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-8 transition-all duration-200 text-center ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : file 
              ? 'border-gray-300 bg-gray-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {!file ? (
          <>
            <div className="flex justify-center mb-4">
              <UploadCloud className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-lg text-gray-700 mb-2">
              Drag and drop your CSV file here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or
            </p>
            <button
              onClick={triggerFileInput}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Select File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </>
        ) : (
          <FileUploadStatus 
            status={uploadStatus}
            fileName={fileName}
            onClear={clearFile}
            onUploadAnother={triggerFileInput}
          />
        )}
      </div>
    </div>
  );
};

export default FileUpload;