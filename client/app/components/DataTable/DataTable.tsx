import React, { useState, useMemo } from 'react';
import type { CSVRow, SortConfig, FilterConfig } from '../../types';
import Pagination from './Pagination';

interface DataTableProps {
  data: CSVRow[];
  headers: string[];
  rowsPerPage?: number;
  calculateExtra?: (row: CSVRow) => { value: number | string; className?: string };
  extraColumnName?: string;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  headers,
  rowsPerPage = 10,
  calculateExtra,
  extraColumnName
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<FilterConfig>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Apply sorting
  const sortedData = useMemo(() => {
    let sortableData = [...data];
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
  }, [data, sortConfig]);

  // Apply filters
  const filteredData = useMemo(() => {
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
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

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

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-indigo-500 font-medium text-lg">
        No data available.
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-indigo-100">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-600 to-purple-600">
              {headers.map((header, index) => (
                <th 
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                >
                  <div 
                    className="flex items-center space-x-1 cursor-pointer" 
                    onClick={() => requestSort(header)}
                  >
                    <span>{header}</span>
                    {sortConfig && sortConfig.key === header ? (
                      <span>
                        {sortConfig.direction === 'ascending' ? (
                          <svg className="w-4 h-4" fill="white" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="white" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 pr-2">
                    <input
                      type="text"
                      className="block w-full text-xs border border-indigo-300 rounded-md bg-white py-1 px-2 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                      placeholder={`Filter ${header}`}
                      value={filters[header] || ''}
                      onChange={(e) => handleFilterChange(header, e.target.value)}
                    />
                  </div>
                </th>
              ))}
              {calculateExtra && (
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <span>{extraColumnName || 'Extra'}</span>
                  </div>
                  <div className="h-7 mt-2"></div>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((row, rowIndex) => {
              const extraData = calculateExtra ? calculateExtra(row) : null;
              
              return (
                <tr 
                  key={rowIndex} 
                  className={`
                    transition-all hover:bg-indigo-50
                    ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-blue-50'}
                  `}
                >
                  {headers.map((header, cellIndex) => (
                    <td 
                      key={cellIndex}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                    >
                      {row[header] !== null && row[header] !== undefined ? String(row[header]) : ''}
                    </td>
                  ))}
                  {extraData && (
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${extraData.className || 'text-indigo-600'}`}>
                      {extraData.value}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="bg-white py-4 border-t border-gray-200">
        <Pagination
          currentPage={currentPage}
          totalItems={filteredData.length}
          itemsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default DataTable;