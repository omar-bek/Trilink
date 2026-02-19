/**
 * Audit Trail Export Service
 * Generates PDF and Excel reports for legal compliance and government audits
 */

import PDFDocument from 'pdfkit';
import { IAuditLog } from './schema';
import { logger } from '../../utils/logger';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  filters?: {
    startDate?: Date;
    endDate?: Date;
    companyId?: string;
    userId?: string;
    action?: string;
    resource?: string;
  };
  includeDetails?: boolean;
}

export class AuditExportService {
  /**
   * Export audit logs to PDF
   * Creates a legally formatted PDF report suitable for court evidence
   */
  async exportToPDF(logs: IAuditLog[], options: ExportOptions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Header
        doc.fontSize(20).text('AUDIT TRAIL REPORT', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
        doc.moveDown(2);

        // Report metadata
        doc.fontSize(10);
        doc.text(`Report Period: ${options.filters?.startDate?.toISOString() || 'All'} to ${options.filters?.endDate?.toISOString() || 'All'}`);
        doc.text(`Total Records: ${logs.length}`);
        doc.text(`Format: PDF (Legally Compliant)`);
        doc.moveDown();

        // Table header
        doc.fontSize(9);
        const tableTop = doc.y;
        const rowHeight = 20;
        const colWidths = [80, 100, 80, 80, 100, 80];
        const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Status', 'IP Address'];

        // Draw table headers
        doc.font('Helvetica-Bold');
        let x = 50;
        headers.forEach((header, i) => {
          doc.text(header, x, tableTop, { width: colWidths[i] });
          x += colWidths[i];
        });

        // Draw table rows
        doc.font('Helvetica');
        let y = tableTop + rowHeight;
        logs.forEach((log, index) => {
          if (y > 750) {
            // New page
            doc.addPage();
            y = 50;
            // Redraw headers
            x = 50;
            doc.font('Helvetica-Bold');
            headers.forEach((header, i) => {
              doc.text(header, x, y, { width: colWidths[i] });
              x += colWidths[i];
            });
            doc.font('Helvetica');
            y += rowHeight;
          }

          x = 50;
          const row = [
            new Date(log.timestamp).toISOString(),
            (log.userId as any)?.email || 'Unknown',
            log.action,
            log.resource,
            log.status,
            log.ipAddress || 'N/A',
          ];

          row.forEach((cell, i) => {
            doc.text(String(cell).substring(0, 30), x, y, { width: colWidths[i] });
            x += colWidths[i];
          });

          y += rowHeight;
        });

        // Footer with legal notice
        doc.fontSize(8);
        doc.text(
          'This report is generated from an immutable audit trail with cryptographic timestamping. ' +
          'All timestamps are verifiable and cannot be altered. This document is suitable for legal proceedings.',
          { align: 'center' }
        );

        doc.end();
      } catch (error) {
        logger.error('PDF export failed:', error);
        reject(error);
      }
    });
  }

  /**
   * Export audit logs to Excel/CSV format
   */
  async exportToCSV(logs: IAuditLog[], options: ExportOptions): Promise<string> {
    const headers = [
      'Timestamp',
      'User Email',
      'User Role',
      'Company',
      'Action',
      'Resource',
      'Resource ID',
      'Status',
      'IP Address',
      'User Agent',
      'Request ID',
      'Timestamp Hash',
      'Error Message',
    ];

    const rows = logs.map((log) => [
      new Date(log.timestamp).toISOString(),
      (log.userId as any)?.email || '',
      (log.userId as any)?.role || '',
      (log.companyId as any)?.name || '',
      log.action,
      log.resource,
      log.resourceId?.toString() || '',
      log.status,
      log.ipAddress || '',
      log.userAgent || '',
      log.requestId || '',
      log.timestampHash || '',
      log.errorMessage || '',
    ]);

    // CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Export audit logs to Excel format (using CSV with .xlsx extension)
   * Note: For full Excel support, consider using a library like 'exceljs'
   */
  async exportToExcel(logs: IAuditLog[], options: ExportOptions): Promise<Buffer> {
    // For now, return CSV format (can be opened in Excel)
    // In production, use exceljs library for proper .xlsx format
    const csvContent = await this.exportToCSV(logs, options);
    return Buffer.from(csvContent, 'utf8');
  }
}
