import React from "react";
import type { CSVRow } from "../../types";
import DataTable from "../DataTable/DataTable";
import useStockAnalysis from "./useStockAnalysis";

interface StockAnalysisProps {
  data: CSVRow[];
  priceColumn: string;
  highColumn: string;
  percentThreshold: number;
  RECORDS_PER_PAGE: number;
}

const StockAnalysis: React.FC<StockAnalysisProps> = ({
  data,
  priceColumn,
  highColumn,
  percentThreshold,
  RECORDS_PER_PAGE = 10
}) => {
  const {
    processedData,
    calculateRowPercentFromHigh,
    copySymbolsToClipboard,
    copySuccess,
  } = useStockAnalysis({
    data,
    priceColumn,
    highColumn,
  });

  // Get table headers
  const tableHeaders = React.useMemo(() => {
    if (processedData.length === 0) return [];
    return Object.keys(processedData[0]);
  }, [processedData]);

  if (!data || data.length === 0) {
    if (percentThreshold === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No stocks found at all-time high.
        </div>
      );
    }
    return (
      <div className="text-center py-4 text-gray-500">
        No stocks found within {percentThreshold}% of their all-time high.
      </div>
    );
  }

  const foundStocksMessage = () => {
    if (percentThreshold === 0) {
      return (
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Found {processedData.length} stocks that are at their all-time high
        </p>
      );
    }
    return (
      <p className="mt-1 max-w-2xl text-sm text-gray-500">
        Found {processedData.length} stocks that are at most {percentThreshold}%
        below their all-time high
      </p>
    );
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Stocks Within {percentThreshold}% of All-Time High
        </h3>
        {foundStocksMessage()}
        <div className="mt-4 flex items-center">
          <button
            onClick={copySymbolsToClipboard}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
          >
            {copySuccess ? "Copied!" : "Copy All TV Symbols"}
          </button>
        </div>
      </div>

      <DataTable
        data={processedData}
        headers={tableHeaders}
        rowsPerPage={RECORDS_PER_PAGE}
        calculateExtra={calculateRowPercentFromHigh}
        extraColumnName="% From High"
      />
    </div>
  );
};

export default StockAnalysis;
