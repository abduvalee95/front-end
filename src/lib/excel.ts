import * as XLSX from 'xlsx';

/**
 * Excel Utility for parsing and exporting data
 */

export interface ExcelParseResult<T> {
  data: T[];
  errors: Array<{ row: number; column: string; message: string }>;
}

/**
 * Parse an Excel file into an array of objects with validation
 */
export async function parseExcelFile<T>(
  file: File,
  columnMapping: Record<string, keyof T>,
  requiredFields: Array<keyof T> = []
): Promise<ExcelParseResult<T>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
        
        const result: T[] = [];
        const errors: Array<{ row: number; column: string; message: string }> = [];

        rawData.forEach((row, index) => {
          const item: Partial<T> = {};
          const rowIndex = index + 2; // +2 because Excel is 1-indexed and has a header row

          Object.entries(columnMapping).forEach(([excelColumn, objectKey]) => {
            const value = row[excelColumn];
            item[objectKey] = value as T[keyof T];

            // Check if required field is missing
            if (requiredFields.includes(objectKey) && (value === undefined || value === null || value === '')) {
              errors.push({
                row: rowIndex,
                column: excelColumn,
                message: `Required field "${excelColumn}" is missing or empty.`
              });
            }
          });

          // Basic phone validation example if needed
          if (item['phone' as keyof T]) {
            const phoneStr = String(item['phone' as keyof T]);
            if (phoneStr.length < 5) {
              errors.push({
                row: rowIndex,
                column: 'Phone',
                message: 'Invalid phone number format.'
              });
            }
          }

          result.push(item as T);
        });

        resolve({ data: result, errors });
      } catch {
        reject(new Error('Failed to read Excel file. Please ensure it is a valid .xlsx or .xls file.'));
      }
    };

    reader.onerror = () => reject(new Error('FileReader error.'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Export data to Excel
 */
export function exportToExcel<T>(data: T[], fileName: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
