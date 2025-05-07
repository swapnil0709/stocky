import { read, utils } from 'xlsx';
import type { CSVRow, FileUploadStatus } from '../types';

/**
 * Process CSV or Excel file and convert to JSON data
 */
export const processCSV = (
  file: File,
  onStatusChange: (status: FileUploadStatus) => void,
  onDataParsed: (data: CSVRow[], headers: string[]) => void
): void => {
  onStatusChange({
    status: 'uploading',
    message: 'Processing file...',
  });

  const reader = new FileReader();

  reader.onload = (event: ProgressEvent<FileReader>) => {
    try {
      if (!event.target?.result) {
        throw new Error('Failed to read file');
      }

      const data = event.target.result;
      const workbook = read(data, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert sheet to JSON with headers
      const jsonData = utils.sheet_to_json<CSVRow>(worksheet);
      
      if (jsonData.length > 0) {
        const headers = Object.keys(jsonData[0]);
        onDataParsed(jsonData, headers);
        onStatusChange({
          status: 'success',
          message: 'File uploaded successfully',
        });
        console.log("Parsed Data:", jsonData);
      } else {
        onStatusChange({
          status: 'error',
          message: 'The CSV file appears to be empty',
        });
      }
    } catch (error) {
      console.error('Error parsing CSV:', error);
      onStatusChange({
        status: 'error',
        message: 'Failed to parse CSV file',
      });
    }
  };

  reader.onerror = () => {
    onStatusChange({
      status: 'error',
      message: 'Error reading file',
    });
  };

  // Read the file as binary string
  reader.readAsBinaryString(file);
};

/**
 * Validate file type
 */
export const isValidFileType = (file: File): boolean => {
  const validExtensions = ['.csv', '.xlsx', '.xls'];
  const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  return validExtensions.includes(fileExtension);
};