import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, Check, X } from 'lucide-react';
import { read, utils } from 'xlsx';

interface CSVRow {
  [key: string]: string | number | boolean | null;
}

interface StockAnalysisProps {
  data: CSVRow[];
  priceColumn: string;
  highColumn: string;
  percentThreshold: number;
}

interface SortConfig {
  key: string;
  direction: 'ascending' | 'descending';
}

interface FilterConfig {
  [key: string]: string;
}

interface FileUploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error';
  message: string;
}

export function Welcome(): React.ReactElement {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<FileUploadStatus>({
    status: 'idle',
    message: '',
  });
  const [parsedData, setParsedData] = useState<CSVRow[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
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

  const processCSV = (file: File): void => {
    setUploadStatus({
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
          setHeaders(Object.keys(jsonData[0]));
          setParsedData(jsonData);
          setUploadStatus({
            status: 'success',
            message: 'File uploaded successfully',
          });
          console.log("Parsed Data:", jsonData);
        } else {
          setUploadStatus({
            status: 'error',
            message: 'The CSV file appears to be empty',
          });
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
        setUploadStatus({
          status: 'error',
          message: 'Failed to parse CSV file',
        });
      }
    };

    reader.onerror = () => {
      setUploadStatus({
        status: 'error',
        message: 'Error reading file',
      });
    };

    // Read the file as binary string
    reader.readAsBinaryString(file);
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
    // Check if file is a CSV or Excel file
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (validExtensions.includes(fileExtension)) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      processCSV(selectedFile);
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
    setParsedData(null);
    setHeaders([]);
    setUploadStatus({
      status: 'idle',
      message: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

// Function to find stocks within threshold of their high
  const findStocksWithinThreshold = (
    data: CSVRow[], 
    priceColumn: string, 
    highColumn: string, 
    percentThreshold: number
  ): CSVRow[] => {
    if (!data || data.length === 0) return [];

    return data.filter(row => {
      // Handle different column name formats
      const priceKey = Object.keys(row).find(key => 
        key === priceColumn || key.toLowerCase().includes('price')
      );
      
      const highKey = Object.keys(row).find(key => 
        key === highColumn || 
        key.toLowerCase().includes('high') || 
        key.toLowerCase().includes('all time')
      );

      if (!priceKey || !highKey) return false;

      // Extract numeric values
      let currentPrice = parseFloat(String(row[priceKey]).replace(/[^0-9.-]+/g, ''));
      let highPrice = parseFloat(String(row[highKey]).replace(/[^0-9.-]+/g, ''));

      // Check if the stock is at most percentThreshold% below its all-time high
      return !isNaN(currentPrice) && 
             !isNaN(highPrice) && 
             highPrice > 0 && 
             (highPrice - currentPrice) / highPrice <= percentThreshold / 100;
    });
  };

  // Extract stocks that are within 20% of their all-time high
  const stocksWithinThreshold = React.useMemo(() => {
    if (!parsedData) return [];
    
    // Try to identify the price and high columns
    const priceColumn = headers.find(h => 
      h.toLowerCase().includes('price') ||
      h.toLowerCase() === 'price'
    ) || '';
    
    const highColumn = headers.find(h => 
      h.toLowerCase().includes('high all time') || 
      h.toLowerCase().includes('all time high') ||
      h.toLowerCase().includes('ath')
    ) || '';
    
    return findStocksWithinThreshold(parsedData, priceColumn, highColumn, 20);
  }, [parsedData, headers]);

  const StockAnalysis: React.FC<StockAnalysisProps> = ({ data, priceColumn, highColumn, percentThreshold }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [filters, setFilters] = useState<FilterConfig>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage] = useState(10);
    const [symbolsToCopy, setSymbolsToCopy] = useState<string[]>([]);
    const [copySuccess, setCopySuccess] = useState(false);

    // Add TV symbol to each row
    const dataWithTVSymbol = React.useMemo(() => {
      return data.map(row => {
        const symbolKey = Object.keys(row).find(key => 
          key.toLowerCase() === 'symbol' || 
          key.toLowerCase().includes('ticker') ||
          key.toLowerCase().includes('code')
        );
        
        if (symbolKey && row[symbolKey]) {
          return {
            ...row,
            "TV SYMBOL": `NSE:${row[symbolKey]}`
          };
        }
        return row;
      });
    }, [data]);

    // Apply sorting
    const sortedData = React.useMemo(() => {
      let sortableData = [...dataWithTVSymbol];
      if (sortConfig !== null) {
        sortableData.sort((a, b) => {
          const aValue = a[sortConfig.key];
          const bValue = b[sortConfig.key];
          
          // Handle numeric values
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'ascending' 
              ? aValue - bValue 
              : bValue - aValue;
          }
          
          // Handle string values
          const aString = String(aValue || '').toLowerCase();
          const bString = String(bValue || '').toLowerCase();
          
          if (aString < bString) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aString > bString) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        });
      }
      return sortableData;
    }, [dataWithTVSymbol, sortConfig]);

    // Apply filters
    const filteredData = React.useMemo(() => {
      return sortedData.filter(row => {
        return Object.keys(filters).every(key => {
          const filterValue = filters[key].toLowerCase();
          if (!filterValue) return true;
          
          const cellValue = row[key];
          return cellValue !== undefined && 
                 cellValue !== null && 
                 String(cellValue).toLowerCase().includes(filterValue);
        });
      });
    }, [sortedData, filters]);

    // Calculate pagination
    const paginatedData = React.useMemo(() => {
      const startIndex = (currentPage - 1) * rowsPerPage;
      return filteredData.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredData, currentPage, rowsPerPage]);

    // Get table headers
    const tableHeaders = React.useMemo(() => {
      if (dataWithTVSymbol.length === 0) return [];
      const headers = Object.keys(dataWithTVSymbol[0]);
      return headers;
    }, [dataWithTVSymbol]);

    // Handle sort request
    const requestSort = (key: string) => {
      let direction: 'ascending' | 'descending' = 'ascending';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
      }
      setSortConfig({ key, direction });
    };

    // Handle filter change
    const handleFilterChange = (key: string, value: string) => {
      setFilters(prev => ({
        ...prev,
        [key]: value
      }));
      setCurrentPage(1); // Reset to first page on filter change
    };

    // Handle copy to clipboard
    const copySymbolsToClipboard = () => {
      // Get all TV symbols
      const symbols = dataWithTVSymbol
        .map(row => row["TV SYMBOL"])
        .filter(Boolean) // Remove any undefined values
        .join(',');
      
      navigator.clipboard.writeText(symbols)
        .then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy symbols to clipboard:', err);
        });
    };

    if (!data || data.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No stocks found within {percentThreshold}% of their all-time high.
        </div>
      );
    }
    
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Stocks Within {percentThreshold}% of All-Time High
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Found {dataWithTVSymbol.length} stocks that are at most {percentThreshold}% below their all-time high
          </p>
          <div className="mt-4 flex items-center">
            <button
              onClick={copySymbolsToClipboard}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
            >
              {copySuccess ? 'Copied!' : 'Copy All TV Symbols'}
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {tableHeaders.map((header, index) => (
                  <th 
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort(header)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{header}</span>
                      {sortConfig && sortConfig.key === header && (
                        <span>
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                    {/* Filter input */}
                    <input
                      type="text"
                      className="block w-full mt-1 text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Filter ${header}`}
                      value={filters[header] || ''}
                      onChange={(e) => handleFilterChange(header, e.target.value)}
                    />
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <span>% From High</span>
                  </div>
                  <div className="h-8"></div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row, rowIndex) => {
                // Find price and high columns
                const priceKey = Object.keys(row).find(key => 
                  key === priceColumn || key.toLowerCase().includes('price')
                ) || '';
                
                const highKey = Object.keys(row).find(key => 
                  key === highColumn || key.toLowerCase().includes('high') || key.toLowerCase().includes('all time')
                ) || '';
                
                // Calculate distance from high
                const price = parseFloat(String(row[priceKey]).replace(/[^0-9.-]+/g, ''));
                const high = parseFloat(String(row[highKey]).replace(/[^0-9.-]+/g, ''));
                const percentFromHigh = high > 0 ? ((high - price) / high) * 100 : 0;
                
                return (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {tableHeaders.map((header, cellIndex) => (
                      <td 
                        key={cellIndex}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {row[header] !== null && row[header] !== undefined ? String(row[header]) : ''}
                      </td>
                    ))}
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      percentFromHigh <= 10 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {percentFromHigh.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} results
          </div>
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <button
              className={`px-3 py-1 rounded ${currentPage * rowsPerPage >= filteredData.length ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredData.length / rowsPerPage)))}
              disabled={currentPage * rowsPerPage >= filteredData.length}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
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
              onClick={() => fileInputRef.current?.click()}
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
          <div className="py-2">
            <div className="flex items-center justify-center mb-4">
              {uploadStatus.status === 'uploading' ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              ) : uploadStatus.status === 'success' ? (
                <div className="flex items-center text-green-600">
                  <Check className="h-8 w-8 mr-2" />
                  <span>Uploaded successfully</span>
                </div>
              ) : uploadStatus.status === 'error' ? (
                <div className="flex items-center text-red-600">
                  <AlertCircle className="h-8 w-8 mr-2" />
                  <span>{uploadStatus.message}</span>
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
                onClick={clearFile}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors flex items-center"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
              >
                <UploadCloud className="h-4 w-4 mr-1" />
                Upload Another
              </button>
            </div>
          </div>
        )}
      </div>
      
      {parsedData && parsedData.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-medium mb-3 text-gray-800">CSV Data Preview</h3>
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map((header, index) => (
                    <th 
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedData.slice(0, 5).map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {headers.map((header, cellIndex) => (
                      <td 
                        key={cellIndex}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {row[header] !== null && row[header] !== undefined ? String(row[header]) : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 5 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-gray-500 text-sm">
                Showing 5 of {parsedData.length} rows
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Display stocks that are within 20% of all-time high */}
      {stocksWithinThreshold.length > 0 && (
        <div className="mt-8">
          <StockAnalysis 
            data={stocksWithinThreshold} 
            priceColumn="Price"
            highColumn="High All Time"
            percentThreshold={20}
          />
        </div>
      )}
    </div>
  );
}