import PDFDocument from 'pdfkit';
import { Contract } from './schema';
import { ContractRepository } from './repository';

export class ContractPdfService {
  private repository: ContractRepository;

  constructor() {
    this.repository = new ContractRepository();
  }

  /**
   * Generate PDF buffer for a contract
   */
  async generatePdf(contractId: string): Promise<Buffer> {
    // Fetch contract with populated references
    const contract = await this.repository.findById(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }

    // Populate parties with company and user data
    const populatedContract = await Contract.findById(contractId)
      .populate('buyerCompanyId', 'name registrationNumber email phone address')
      .populate('parties.companyId', 'name registrationNumber email phone address')
      .populate('parties.userId', 'firstName lastName email')
      .populate('signatures.userId', 'firstName lastName email')
      .exec();

    if (!populatedContract) {
      throw new Error('Contract not found');
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    // Generate PDF content
    this.addHeader(doc, populatedContract);
    this.addContractInfo(doc, populatedContract);
    this.addParties(doc, populatedContract);
    this.addAmounts(doc, populatedContract);
    this.addPaymentSchedule(doc, populatedContract);
    this.addTerms(doc, populatedContract);
    this.addSignatures(doc, populatedContract);
    this.addFooter(doc, populatedContract);

    // Wait for PDF to be generated
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);
      doc.end();
    });
  }

  /**
   * Add header section
   */
  private addHeader(doc: PDFKit.PDFDocument, contract: any): void {
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('CONTRACT AGREEMENT', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Contract ID: ${contract._id.toString()}`, { align: 'center' })
      .moveDown(1);
  }

  /**
   * Add contract information section
   */
  private addContractInfo(doc: PDFKit.PDFDocument, contract: any): void {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Contract Information', { underline: true })
      .moveDown(0.5);

    doc.fontSize(10).font('Helvetica');

    const startDate = new Date(contract.startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const endDate = new Date(contract.endDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const createdAt = new Date(contract.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    doc.text(`Status: ${contract.status.toUpperCase()}`, { continued: false });
    doc.text(`Start Date: ${startDate}`, { continued: false });
    doc.text(`End Date: ${endDate}`, { continued: false });
    doc.text(`Created: ${createdAt}`, { continued: false });
    doc.moveDown(1);
  }

  /**
   * Add parties section
   */
  private addParties(doc: PDFKit.PDFDocument, contract: any): void {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Parties', { underline: true })
      .moveDown(0.5);

    doc.fontSize(10).font('Helvetica');

    // Buyer Company
    const buyerCompany = contract.buyerCompanyId as any;
    if (buyerCompany) {
      doc.font('Helvetica-Bold').text('Buyer:', { continued: false });
      doc.font('Helvetica');
      doc.text(`  ${buyerCompany.name}`, { indent: 20 });
      doc.text(`  Registration: ${buyerCompany.registrationNumber}`, { indent: 20 });
      doc.text(`  Email: ${buyerCompany.email}`, { indent: 20 });
      if (buyerCompany.address) {
        doc.text(
          `  Address: ${buyerCompany.address.street}, ${buyerCompany.address.city}, ${buyerCompany.address.country}`,
          { indent: 20 }
        );
      }
      doc.moveDown(0.5);
    }

    // Other Parties
    if (contract.parties && contract.parties.length > 0) {
      doc.font('Helvetica-Bold').text('Other Parties:', { continued: false });
      doc.font('Helvetica');

      contract.parties.forEach((party: any, index: number) => {
        const company = party.companyId as any;
        const user = party.userId as any;

        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').text(`${index + 1}. ${party.role}:`, { continued: false });
        doc.font('Helvetica');
        if (company) {
          doc.text(`   Company: ${company.name}`, { indent: 20 });
          doc.text(`   Registration: ${company.registrationNumber}`, { indent: 20 });
          doc.text(`   Email: ${company.email}`, { indent: 20 });
        }
        if (user) {
          const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
          doc.text(`   Representative: ${userName}`, { indent: 20 });
          doc.text(`   Email: ${user.email}`, { indent: 20 });
        }
      });
    }

    doc.moveDown(1);
  }

  /**
   * Add amounts section
   */
  private addAmounts(doc: PDFKit.PDFDocument, contract: any): void {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Financial Details', { underline: true })
      .moveDown(0.5);

    doc.fontSize(10).font('Helvetica');

    // Total amount
    doc
      .font('Helvetica-Bold')
      .text(`Total Amount: ${contract.amounts.currency} ${contract.amounts.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, {
        continued: false,
      });

    // Breakdown
    if (contract.amounts.breakdown && contract.amounts.breakdown.length > 0) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text('Amount Breakdown:', { continued: false });
      doc.font('Helvetica');

      contract.amounts.breakdown.forEach((item: any, index: number) => {
        // Find company name for this party
        const party = contract.parties.find(
          (p: any) => p.companyId._id.toString() === item.partyId.toString()
        );
        const companyName = party?.companyId?.name || 'Unknown';

        doc.text(
          `  ${index + 1}. ${companyName}: ${contract.amounts.currency} ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          { indent: 20 }
        );
        doc.text(`     ${item.description}`, { indent: 20 });
      });
    }

    doc.moveDown(1);
  }

  /**
   * Add payment schedule section
   */
  private addPaymentSchedule(doc: PDFKit.PDFDocument, contract: any): void {
    if (!contract.paymentSchedule || contract.paymentSchedule.length === 0) {
      return;
    }

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Payment Schedule', { underline: true })
      .moveDown(0.5);

    doc.fontSize(10).font('Helvetica');

    // Table header
    doc.font('Helvetica-Bold');
    doc.text('Milestone', { continued: true, width: 150 });
    doc.text('Amount', { continued: true, width: 100 });
    doc.text('Due Date', { continued: true, width: 100 });
    doc.text('Status', { continued: false, width: 80 });
    doc.moveDown(0.3);

    // Add a line under header
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Table rows
    doc.font('Helvetica');
    contract.paymentSchedule.forEach((schedule: any, index: number) => {
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
      }

      const dueDate = new Date(schedule.dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      doc.text(`${index + 1}. ${schedule.milestone}`, { continued: true, width: 150 });
      doc.text(
        `${contract.amounts.currency} ${schedule.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        { continued: true, width: 100 }
      );
      doc.text(dueDate, { continued: true, width: 100 });
      doc.text(schedule.status.toUpperCase(), { continued: false, width: 80 });
      doc.moveDown(0.5);
    });

    doc.moveDown(1);
  }

  /**
   * Add terms section
   */
  private addTerms(doc: PDFKit.PDFDocument, contract: any): void {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Terms and Conditions', { underline: true })
      .moveDown(0.5);

    doc.fontSize(10).font('Helvetica');

    // Split terms into paragraphs and add them
    const terms = contract.terms || 'No terms specified.';
    const paragraphs = terms.split('\n').filter((p: string) => p.trim().length > 0);

    if (paragraphs.length === 0) {
      doc.text(terms);
    } else {
      paragraphs.forEach((paragraph: string) => {
        doc.text(paragraph.trim(), { align: 'left' });
        doc.moveDown(0.3);
      });
    }

    doc.moveDown(1);
  }

  /**
   * Add signatures section
   */
  private addSignatures(doc: PDFKit.PDFDocument, contract: any): void {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Signatures', { underline: true })
      .moveDown(0.5);

    doc.fontSize(10).font('Helvetica');

    if (!contract.signatures || contract.signatures.length === 0) {
      doc.text('No signatures yet.', { continued: false });
      doc.moveDown(1);
      return;
    }

    // Add signature details
    contract.signatures.forEach((signature: any, index: number) => {
      const user = signature.userId as any;
      const signedDate = new Date(signature.signedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const signedTime = new Date(signature.signedAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Find party info
      const party = contract.parties.find(
        (p: any) => p.companyId._id.toString() === signature.partyId.toString()
      );
      const companyName = party?.companyId?.name || 'Unknown';

      const userName = user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
        : 'Unknown';

      doc.text(`${index + 1}. ${companyName}`, { continued: false });
      doc.text(`   Signed by: ${userName}`, { indent: 20 });
      doc.text(`   Date: ${signedDate} at ${signedTime}`, { indent: 20 });
      doc.text(`   Signature Hash: ${signature.signature.substring(0, 16)}...`, {
        indent: 20,
      });
      doc.moveDown(0.5);
    });

    doc.moveDown(1);
  }

  /**
   * Add footer
   */
  private addFooter(doc: PDFKit.PDFDocument, contract: any): void {
    const pageHeight = doc.page.height;
    const pageWidth = doc.page.width;
    const footerY = pageHeight - 50;

    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        `Generated on ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })} at ${new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        50,
        footerY,
        { align: 'center', width: pageWidth - 100 }
      );
  }
}
