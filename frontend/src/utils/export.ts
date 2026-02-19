/**
 * Export utilities for CSV, Excel, and other formats
 * 
 * Features:
 * - CSV export with UTF-8 BOM support (for Arabic text)
 * - Proper handling of dates, numbers, and nested objects
 * - Custom header mapping
 * - Error handling
 */

/**
 * Options for CSV export
 */
export interface CSVExportOptions<T> {
    /** Custom header labels (key -> display name) */
    headers?: Record<keyof T, string>;
    /** Keys to exclude from export */
    excludeKeys?: (keyof T)[];
    /** Keys to include (if specified, only these keys will be exported) */
    includeKeys?: (keyof T)[];
    /** Custom value formatters */
    formatters?: Partial<Record<keyof T, (value: any) => string>>;
    /** Add UTF-8 BOM for better Excel/Arabic support */
    addBOM?: boolean;
}

/**
 * Convert array of objects to CSV string
 * 
 * @param data - Array of objects to convert
 * @param options - Export options
 * @returns CSV string
 */
export function convertToCSV<T extends Record<string, any>>(
    data: T[],
    options: CSVExportOptions<T> = {}
): string {
    if (data.length === 0) return '';

    const {
        headers = {} as Record<keyof T, string>,
        excludeKeys = [],
        includeKeys,
        formatters = {},
        addBOM = true,
    } = options;

    // Get all unique keys from all objects
    const allKeys = new Set<string>();
    data.forEach((item) => {
        Object.keys(item).forEach((key) => allKeys.add(key));
    });

    // Filter keys based on include/exclude options
    let keys = Array.from(allKeys);
    if (includeKeys && includeKeys.length > 0) {
        keys = keys.filter((key) => includeKeys.includes(key as keyof T));
    }
    keys = keys.filter((key) => !excludeKeys.includes(key as keyof T));

    // Create header row
    const headerRow = keys
        .map((key) => {
            const header = headers[key as keyof T] || formatHeaderName(key);
            return escapeCSVValue(header);
        })
        .join(',');

    // Create data rows
    const dataRows = data.map((item) =>
        keys
            .map((key) => {
                const value = item[key];
                const formattedValue = formatValue(value, key as keyof T, formatters);
                return escapeCSVValue(formattedValue);
            })
            .join(',')
    );

    const csvContent = [headerRow, ...dataRows].join('\n');

    // Add UTF-8 BOM for better Excel/Arabic support
    return addBOM ? '\uFEFF' + csvContent : csvContent;
}

/**
 * Format header name (convert camelCase to Title Case)
 */
function formatHeaderName(key: string): string {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
}

/**
 * Format value for CSV export
 */
function formatValue<T>(
    value: any,
    key: keyof T,
    formatters: Partial<Record<keyof T, (value: any) => string>>
): string {
    // Use custom formatter if available
    if (formatters[key]) {
        return formatters[key]!(value);
    }

    // Handle null/undefined
    if (value === null || value === undefined) {
        return '';
    }

    // Handle dates
    if (value instanceof Date) {
        return value.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    }

    // Handle objects/arrays
    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            return value.map((item) =>
                typeof item === 'object' ? JSON.stringify(item) : String(item)
            ).join('; ');
        }
        // Nested object - stringify or extract meaningful value
        if (value && typeof value === 'object' && 'name' in value) {
            return String(value.name);
        }
        if (value && typeof value === 'object' && 'id' in value) {
            return String(value.id);
        }
        return JSON.stringify(value);
    }

    // Handle numbers
    if (typeof value === 'number') {
        return String(value);
    }

    // Handle booleans
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    return String(value);
}

/**
 * Escape CSV value (handle quotes and special characters)
 */
function escapeCSVValue(value: string): string {
    if (value === '') return '""';
    // Escape quotes by doubling them
    const escaped = String(value).replace(/"/g, '""');
    // Wrap in quotes if contains comma, newline, or quote
    if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
        return `"${escaped}"`;
    }
    return escaped;
}

/**
 * Download CSV file
 * 
 * @param data - Array of objects to export
 * @param filename - Filename (without extension)
 * @param options - Export options
 */
export function downloadCSV<T extends Record<string, any>>(
    data: T[],
    filename: string,
    options: CSVExportOptions<T> = {}
): void {
    try {
        if (data.length === 0) {
            console.warn('No data to export');
            return;
        }

        const csv = convertToCSV(data, options);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting CSV:', error);
        throw new Error('Failed to export CSV file');
    }
}

/**
 * Export data to CSV with formatted headers
 * 
 * @param data - Array of objects to export
 * @param filename - Filename (without extension)
 * @param options - Export options (can be just headers for backward compatibility)
 */
export function exportToCSV<T extends Record<string, any>>(
    data: T[],
    filename: string,
    options?: CSVExportOptions<T> | Record<keyof T, string>
): void {
    // Backward compatibility: if options is a Record, treat it as headers
    const exportOptions: CSVExportOptions<T> =
        options && !('headers' in options) && typeof options === 'object' && !Array.isArray(options)
            ? { headers: options as Record<keyof T, string> }
            : (options as CSVExportOptions<T> || {});

    downloadCSV(data, filename, exportOptions);
}

/**
 * Export data to JSON file
 * 
 * @param data - Data to export
 * @param filename - Filename (without extension)
 * @param pretty - Whether to format JSON with indentation
 */
export function exportToJSON<T>(
    data: T,
    filename: string,
    pretty: boolean = true
): void {
    try {
        const json = pretty
            ? JSON.stringify(data, null, 2)
            : JSON.stringify(data);

        const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting JSON:', error);
        throw new Error('Failed to export JSON file');
    }
}

/**
 * Copy data to clipboard as CSV
 * 
 * @param data - Array of objects to copy
 * @param options - Export options
 * @returns Promise that resolves when data is copied
 */
export async function copyToClipboardAsCSV<T extends Record<string, any>>(
    data: T[],
    options: CSVExportOptions<T> = {}
): Promise<void> {
    try {
        const csv = convertToCSV(data, { ...options, addBOM: false });
        await navigator.clipboard.writeText(csv);
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        throw new Error('Failed to copy to clipboard');
    }
}
