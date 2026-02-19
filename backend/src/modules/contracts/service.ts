import { ContractRepository } from './repository';
import { ContractAmendmentRepository } from './amendment.repository';
import { ContractVersionRepository } from './version.repository';
import {
  CreateContractDto,
  SignContractDto,
  UpdateContractDto,
  ContractResponse,
  CreateAmendmentDto,
  ApproveAmendmentDto,
  AmendmentResponse,
  ContractQueryFilters,
  ContractVersionResponse,
  VersionDiffResponse,
} from './types';
import { PaginatedResponse } from '../../types/common';
import { AppError } from '../../middlewares/error.middleware';
import { IContract, ContractStatus } from './schema';
import {
  IContractAmendment,
  AmendmentStatus,
} from './amendment.schema';
import { PurchaseRequestRepository } from '../purchase-requests/repository';
import { BidRepository } from '../bids/repository';
import { BidStatus } from '../bids/schema';
import { RFQRepository } from '../rfqs/repository';
import { RFQType } from '../rfqs/schema';
import { Role } from '../../config/rbac';
import mongoose from 'mongoose';
import { logger } from '../../utils/logger';
import { getSocketService } from '../../socket/socket.service';
import { SocketEvent } from '../../socket/types';
import { notificationService } from '../notifications/notification.service';
import { NotificationEvent } from '../notifications/types';
import { UserRepository } from '../users/repository';
import { PaymentRepository } from '../payments/repository';
import { PaymentStatus } from '../payments/schema';
import { ShipmentService } from '../shipments/service';
import { CompanyRepository } from '../companies/repository';
import { config } from '../../config/env';
import { getPKIService } from '../../utils/pki.service';

export class ContractService {
  private repository: ContractRepository;
  private amendmentRepository: ContractAmendmentRepository;
  private versionRepository: ContractVersionRepository;
  private purchaseRequestRepository: PurchaseRequestRepository;
  private bidRepository: BidRepository;
  private userRepository: UserRepository;
  private paymentRepository: PaymentRepository;
  private shipmentService: ShipmentService;
  private companyRepository: CompanyRepository;

  constructor() {
    this.repository = new ContractRepository();
    this.amendmentRepository = new ContractAmendmentRepository();
    this.versionRepository = new ContractVersionRepository();
    this.purchaseRequestRepository = new PurchaseRequestRepository();
    this.bidRepository = new BidRepository();
    this.userRepository = new UserRepository();
    this.paymentRepository = new PaymentRepository();
    this.shipmentService = new ShipmentService();
    this.companyRepository = new CompanyRepository();
  }

  /**
   * Create a new contract from accepted bids
   */
  async createContract(
    buyerCompanyId: string,
    data: CreateContractDto
  ): Promise<ContractResponse> {
    // Verify purchase request exists
    const purchaseRequest = await this.purchaseRequestRepository.findById(
      data.purchaseRequestId
    );
    if (!purchaseRequest) {
      throw new AppError('Purchase request not found', 404);
    }

    // Verify all bids are accepted
    for (const party of data.parties) {
      if (party.bidId) {
        const bid = await this.bidRepository.findById(party.bidId);
        if (!bid || bid.status !== 'accepted') {
          throw new AppError(`Bid ${party.bidId} is not accepted`, 400);
        }
      }
    }

    // Create contract
    const contract = await this.repository.create({
      purchaseRequestId: new mongoose.Types.ObjectId(data.purchaseRequestId),
      buyerCompanyId: new mongoose.Types.ObjectId(buyerCompanyId),
      parties: data.parties.map((p) => ({
        ...p,
        companyId: new mongoose.Types.ObjectId(p.companyId),
        userId: new mongoose.Types.ObjectId(p.userId),
        bidId: p.bidId ? new mongoose.Types.ObjectId(p.bidId) : undefined,
      })),
      amounts: {
        total: data.amounts.total,
        currency: data.amounts.currency || 'AED',
        breakdown: data.amounts.breakdown.map((b) => ({
          ...b,
          partyId: new mongoose.Types.ObjectId(b.partyId),
        })),
      },
      paymentSchedule: data.paymentSchedule.map((ps) => ({
        ...ps,
        dueDate: new Date(ps.dueDate),
        status: 'pending',
      })),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: ContractStatus.PENDING_SIGNATURES, // Changed to plural
    });

    // Create initial version snapshot
    await this.createVersionSnapshot(
      contract,
      'Initial version',
      { userId: buyerCompanyId, companyId: buyerCompanyId }
    );

    return this.toContractResponse(contract);
  }

  /**
   * Auto-generate contract from accepted bids
   * Called when a bid is accepted
   */
  async generateContractFromAcceptedBids(
    purchaseRequestId: string,
    buyerCompanyId: string,
    buyerUserId: string
  ): Promise<ContractResponse | null> {
    try {
      // Get purchase request
      const purchaseRequest = await this.purchaseRequestRepository.findById(
        purchaseRequestId
      );
      if (!purchaseRequest) {
        throw new AppError('Purchase request not found', 404);
      }

      // Get all RFQs for this purchase request
      const rfqRepository = new RFQRepository();
      const rfqs = await rfqRepository.findByPurchaseRequestId(purchaseRequestId);

      if (rfqs.length === 0) {
        logger.info(
          `Cannot generate contract for PR ${purchaseRequestId}: No RFQs found`
        );
        return null;
      }

      // Validate that ALL RFQs have accepted bids
      const acceptedBids = await Promise.all(
        rfqs.map(async (rfq) => {
          const bids = await this.bidRepository.findByRFQId(rfq._id.toString(), {
            status: BidStatus.ACCEPTED,
          });
          if (bids.length === 0) {
            return null;
          }
          return { rfq, bid: bids[0] };
        })
      );

      // Check if ALL RFQs have accepted bids
      const missingBids = acceptedBids.filter((item) => item === null);
      if (missingBids.length > 0) {
        const missingRFQTypes = rfqs
          .filter((_rfq, index) => acceptedBids[index] === null)
          .map((rfq) => rfq.type);
        logger.info(
          `Cannot generate contract for PR ${purchaseRequestId}: Missing accepted bids for RFQ types: ${missingRFQTypes.join(', ')}`
        );
        return null;
      }

      // All RFQs have accepted bids - proceed with contract generation
      const validBids = acceptedBids.filter((item): item is { rfq: any; bid: any } => item !== null);

      // Check if contract already exists
      const existingContracts = await this.repository.findByPurchaseRequestId(purchaseRequestId);
      if (existingContracts.length > 0) {
        logger.info(
          `Contract already exists for PR ${purchaseRequestId}`
        );
        return this.toContractResponse(existingContracts[0]);
      }

      // Build parties array (Buyer + all providers)
      const parties = [
        {
          companyId: new mongoose.Types.ObjectId(buyerCompanyId),
          userId: new mongoose.Types.ObjectId(buyerUserId),
          role: Role.BUYER,
        },
        ...validBids.map((item) => ({
          companyId: item.bid.companyId,
          userId: item.bid.providerId,
          role: item.rfq.targetRole,
          bidId: item.bid._id,
        })),
      ];

      // Calculate amounts breakdown
      const breakdown = validBids.map((item) => ({
        partyId: item.bid.companyId,
        amount: item.bid.price,
        description: `${item.rfq.type} services`,
      }));

      const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

      // Create payment schedule (default: 3 milestones)
      const paymentSchedule = [
        {
          milestone: 'Initial Payment',
          amount: total * 0.3,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          status: 'pending',
        },
        {
          milestone: 'Mid-term Payment',
          amount: total * 0.4,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          status: 'pending',
        },
        {
          milestone: 'Final Payment',
          amount: total * 0.3,
          dueDate: purchaseRequest.requiredDeliveryDate,
          status: 'pending',
        },
      ];

      // Create contract
      const contract = await this.repository.create({
        purchaseRequestId: purchaseRequest._id,
        buyerCompanyId: new mongoose.Types.ObjectId(buyerCompanyId),
        parties,
        amounts: {
          total,
          currency: purchaseRequest.currency,
          breakdown,
        },
        paymentSchedule,
        terms: `Multi-party contract for Purchase Request: ${purchaseRequest.title}`,
        startDate: new Date(),
        endDate: purchaseRequest.requiredDeliveryDate,
        status: ContractStatus.PENDING_SIGNATURES,
      });

      logger.info(
        `Auto-generated contract ${contract._id} for Purchase Request ${purchaseRequestId}`
      );

      // Create initial version snapshot
      await this.createVersionSnapshot(
        contract,
        'Initial version (auto-generated)',
        { userId: buyerUserId, companyId: buyerCompanyId }
      );

      const contractResponse = this.toContractResponse(contract);

      // Emit socket event to all parties
      try {
        const socketService = getSocketService();
        const allCompanyIds = [
          buyerCompanyId,
          ...validBids.map((item) => item.bid.companyId.toString()),
        ];

        socketService.emitContractEvent(
          SocketEvent.CONTRACT_CREATED,
          {
            contractId: contractResponse.id,
            purchaseRequestId: purchaseRequestId,
            buyerCompanyId: buyerCompanyId,
            parties: contractResponse.parties,
            status: contractResponse.status,
            totalAmount: contractResponse.amounts.total,
            currency: contractResponse.amounts.currency,
          },
          allCompanyIds
        );
      } catch (error) {
        logger.error('Failed to emit contract created socket event:', error);
      }

      // Send email notifications to all parties
      try {
        const allUserIds = [
          buyerUserId,
          ...validBids.map((item) => item.bid.providerId.toString()),
        ];

        // Batch load users to prevent N+1 queries
        const users = await this.userRepository.findByIds(allUserIds);
        const recipients = users.map((user) => ({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        }));

        if (recipients.length > 0) {
          await notificationService.notify({
            event: NotificationEvent.CONTRACT_CREATED,
            recipients,
            data: {
              contractId: contractResponse.id,
              purchaseRequestId: purchaseRequestId,
              purchaseRequestTitle: purchaseRequest.title,
              totalAmount: contractResponse.amounts.total,
              currency: contractResponse.amounts.currency,
              status: contractResponse.status,
              contractUrl: `${notificationService['baseUrl']}/contracts/${contractResponse.id}`,
            },
          });
        }
      } catch (error) {
        logger.error('Failed to send contract creation notifications:', error);
      }

      // Notify company managers about contract creation
      try {
        // Notify buyer company managers
        await notificationService.notifyCompanyManagers(
          purchaseRequest.companyId.toString(),
          NotificationEvent.CONTRACT_CREATED,
          {
            title: `New Contract Created`,
            message: `A new contract has been created for purchase request "${purchaseRequest.title}". Total amount: ${contractResponse.amounts.currency} ${contractResponse.amounts.total.toLocaleString()}`,
            entityType: 'contract',
            entityId: contractResponse.id,
            actionUrl: `${notificationService['baseUrl']}/contracts/${contractResponse.id}`,
            contractId: contractResponse.id,
            purchaseRequestId: purchaseRequestId,
            purchaseRequestTitle: purchaseRequest.title,
            totalAmount: contractResponse.amounts.total,
            currency: contractResponse.amounts.currency,
            status: contractResponse.status,
          }
        );

        // Notify all party company managers
        for (const party of contractResponse.parties) {
          await notificationService.notifyCompanyManagers(
            party.companyId,
            NotificationEvent.CONTRACT_CREATED,
            {
              title: `New Contract Created`,
              message: `Your company has been added to a new contract for purchase request "${purchaseRequest.title}". Total amount: ${contractResponse.amounts.currency} ${contractResponse.amounts.total.toLocaleString()}`,
              entityType: 'contract',
              entityId: contractResponse.id,
              actionUrl: `${notificationService['baseUrl']}/contracts/${contractResponse.id}`,
              contractId: contractResponse.id,
              purchaseRequestId: purchaseRequestId,
              purchaseRequestTitle: purchaseRequest.title,
              totalAmount: contractResponse.amounts.total,
              currency: contractResponse.amounts.currency,
              status: contractResponse.status,
            }
          );
        }
      } catch (error) {
        logger.error('Failed to notify company managers about contract creation:', error);
      }

      return contractResponse;
    } catch (error) {
      logger.error(
        `Failed to auto-generate contract for PR ${purchaseRequestId}:`,
        error
      );
      // Don't throw - this is called from bid evaluation, shouldn't block it
      return null;
    }
  }

  /**
   * Get contract by ID
   * Validates that user's company is either the buyer or one of the parties
   */
  async getContractById(
    id: string,
    requesterCompanyId?: string,
    requesterRole?: Role
  ): Promise<ContractResponse> {
    const contract = await this.repository.findById(id);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    // Admin and Government can view all contracts
    if (requesterRole === Role.ADMIN || requesterRole === Role.GOVERNMENT) {
      return this.toContractResponse(contract);
    }

    // For other roles, check if user's company is involved in the contract
    if (requesterCompanyId) {
      const isBuyer = contract.buyerCompanyId.toString() === requesterCompanyId;
      const isParty = contract.parties.some(
        (party) => party.companyId.toString() === requesterCompanyId
      );

      if (!isBuyer && !isParty) {
        throw new AppError(
          'Access denied: Your company is not a party to this contract',
          403
        );
      }
    }

    return this.toContractResponse(contract);
  }

  /**
   * Get contracts by company
   */
  async getContractsByCompany(
    companyId: string,
    filters?: { status?: string }
  ): Promise<ContractResponse[]> {
    const contracts = await this.repository.findByCompanyId(companyId, filters as any);
    return contracts.map((contract) => this.toContractResponse(contract));
  }

  /**
   * Get contracts with advanced filtering, search, sorting, and pagination
   */
  async getContractsWithFilters(
    companyId: string,
    filters: ContractQueryFilters
  ): Promise<PaginatedResponse<ContractResponse>> {
    const { contracts, total } = await this.repository.findWithFilters(companyId, filters);

    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data: contracts.map((contract) => this.toContractResponse(contract)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get contracts by purchase request
   */
  async getContractsByPurchaseRequest(
    purchaseRequestId: string
  ): Promise<ContractResponse[]> {
    const contracts = await this.repository.findByPurchaseRequestId(
      purchaseRequestId
    );
    return contracts.map((contract) => this.toContractResponse(contract));
  }

  /**
   * Sign contract
   * Status lifecycle: Only draft or pending_signatures contracts can be signed
   * Uses optimistic locking with version field to prevent race conditions
   */
  async signContract(
    contractId: string,
    userId: string,
    companyId: string,
    data: SignContractDto
  ): Promise<ContractResponse> {
    const MAX_RETRIES = 5;
    const RETRY_DELAY_MS = 100;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // Read contract with current version
      const contract = await this.repository.findById(contractId);
      if (!contract) {
        throw new AppError('Contract not found', 404);
      }

      // Status lifecycle: Only draft or pending_signatures contracts can be signed
      if (
        contract.status !== ContractStatus.DRAFT &&
        contract.status !== ContractStatus.PENDING_SIGNATURES
      ) {
        throw new AppError(
          `Contract cannot be signed in current status: ${contract.status}. Only draft or pending_signatures contracts can be signed.`,
          400
        );
      }

      // Verify user can sign the contract
      // For Company Manager: can sign if their company is the buyer company OR if their company is a party
      // For others: must be a party to the contract
      const user = await this.userRepository.findById(userId);
      const isCompanyManager = user?.role === Role.COMPANY_MANAGER;
      const isBuyerCompany = contract.buyerCompanyId.toString() === companyId;

      // First, check if user is already a party
      let party = contract.parties.find(
        (p) =>
          p.companyId.toString() === companyId &&
          p.userId.toString() === userId
      );

      // If not a party, check if Company Manager can sign for their company
      if (!party && isCompanyManager) {
        // Check if their company is the buyer company
        if (isBuyerCompany) {
          // Create a virtual party for the manager to sign on behalf of buyer company
          party = {
            companyId: contract.buyerCompanyId,
            userId: new mongoose.Types.ObjectId(userId),
            role: 'Buyer',
          } as any;
        } else {
          // Check if their company is a party (provider company who accepted bid)
          const companyParty = contract.parties.find(
            (p) => p.companyId.toString() === companyId
          );
          if (companyParty) {
            // Create a virtual party for the manager to sign on behalf of their provider company
            party = {
              companyId: companyParty.companyId,
              userId: new mongoose.Types.ObjectId(userId),
              role: companyParty.role,
              bidId: companyParty.bidId,
            } as any;
          }
        }
      }

      if (!party) {
        throw new AppError('User is not authorized to sign this contract', 403);
      }

      // Check if already signed (optimistic check before atomic operation)
      const existingSignature = contract.signatures.find(
        (s) => s.partyId.toString() === party!.companyId.toString()
      );

      if (existingSignature) {
        throw new AppError('Contract already signed by this party', 400);
      }

      // Verify client-provided PKI signature
      const pkiService = getPKIService();
      const contractContent = JSON.stringify({
        contractId: contract._id.toString(),
        version: contract.version,
        terms: contract.terms,
        amounts: contract.amounts,
        parties: contract.parties.map((p) => ({
          companyId: p.companyId.toString(),
          userId: p.userId.toString(),
          role: p.role,
        })),
        timestamp: data.timestamp || new Date().toISOString(),
      });

      // Verify client signature if provided
      // Managers (COMPANY_MANAGER, ADMIN) can bypass signature verification
      const isManager = isCompanyManager || user?.role === Role.ADMIN || user?.role === Role.GOVERNMENT;
      let verified = false;

      if (data.signature && data.certificate) {
        const verifyResult = pkiService.verify(
          contractContent,
          data.signature,
          data.certificate
        );

        if (!verifyResult.valid) {
          // Managers can bypass signature verification
          if (isManager) {
            logger.warn(
              `Signature verification failed for manager ${userId} (${user?.role}), but allowing signature to proceed. Error: ${verifyResult.error || 'Signature verification failed'}`
            );
            verified = false; // Store signature but mark as unverified
          } else {
            throw new AppError(
              `Invalid signature: ${verifyResult.error || 'Signature verification failed'}`,
              400
            );
          }
        } else {
          verified = true;
        }
      } else {
        // Fallback: Generate server-side signature (for backward compatibility)
        // In production, this should be removed and client signature should be required
        logger.warn('Client signature not provided, generating server-side signature');
        const signatureResult = pkiService.sign(contractContent);
        data.signature = signatureResult.signature;
        data.certificate = signatureResult.certificate;
        data.algorithm = signatureResult.algorithm;
        verified = true;
      }

      const signatureHash = pkiService.createHash(contractContent);

      // Attempt atomic signature addition with version check
      const updated = await this.repository.addSignatureAtomically(
        contractId,
        {
          partyId: party.companyId,
          userId: new mongoose.Types.ObjectId(userId),
          signature: data.signature,
          signatureHash,
          certificate: data.certificate || undefined,
          algorithm: data.algorithm || 'RSASSA-PKCS1-v1_5-SHA256',
          verified,
        },
        contract.version // Pass current version for optimistic locking
      );

      if (updated && party) {
        // Successfully added signature atomically
        const allPartiesSigned = updated.signatures.length === updated.parties.length;

        // Emit socket event
        try {
          const socketService = getSocketService();
          const companyIds = updated.parties.map((p) => p.companyId.toString());
          socketService.emitContractEvent(
            SocketEvent.CONTRACT_SIGNED,
            {
              contractId: contractId,
              purchaseRequestId: updated.purchaseRequestId.toString(),
              buyerCompanyId: updated.buyerCompanyId.toString(),
              parties: updated.parties.map((p) => ({
                companyId: p.companyId.toString(),
                userId: p.userId.toString(),
                role: p.role,
              })),
              status: allPartiesSigned
                ? ContractStatus.SIGNED
                : ContractStatus.PENDING_SIGNATURES,
              allPartiesSigned: allPartiesSigned,
              signedBy: {
                companyId: companyId,
                userId: userId,
              },
              signaturesCount: updated.signatures.length,
              totalParties: updated.parties.length,
            },
            companyIds
          );
        } catch (error) {
          logger.error('Failed to emit contract signature socket event:', error);
        }

        // Notify company managers about contract signature
        try {
          const purchaseRequest = await this.purchaseRequestRepository.findById(
            updated.purchaseRequestId.toString()
          );
          const user = await this.userRepository.findById(userId);
          const signerName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'User';

          // Notify all parties' company managers
          const allCompanyIds = [
            updated.buyerCompanyId.toString(),
            ...updated.parties.map((p) => p.companyId.toString()),
          ];
          const uniqueCompanyIds = [...new Set(allCompanyIds)];

          for (const partyCompanyId of uniqueCompanyIds) {
            await notificationService.notifyCompanyManagers(
              partyCompanyId,
              NotificationEvent.CONTRACT_SIGNED,
              {
                title: allPartiesSigned 
                  ? `Contract Fully Signed`
                  : `Contract Signed by ${signerName}`,
                message: allPartiesSigned
                  ? `All parties have signed the contract for purchase request "${purchaseRequest?.title || 'Contract'}". The contract is now fully signed.`
                  : `Contract has been signed by ${signerName} (${updated.signatures.length}/${updated.parties.length} signatures).`,
                entityType: 'contract',
                entityId: contractId,
                actionUrl: `${config.frontend.url}/contracts/${contractId}`,
                contractId: contractId,
                purchaseRequestId: updated.purchaseRequestId.toString(),
                purchaseRequestTitle: purchaseRequest?.title || 'Contract',
                allPartiesSigned: allPartiesSigned,
                signedBy: signerName,
                signaturesCount: updated.signatures.length,
                totalParties: updated.parties.length,
              }
            );
          }
        } catch (error) {
          logger.error('Failed to notify company managers about contract signature:', error);
        }

        // Create version snapshot when all parties have signed
        if (allPartiesSigned && updated.status === ContractStatus.SIGNED) {
          await this.createVersionSnapshot(
            updated,
            'All parties signed',
            { userId, companyId }
          );
        }

        // Auto-activate contract when all parties have signed
        if (allPartiesSigned && updated.status === ContractStatus.SIGNED) {
          try {
            await this.autoActivateContract(updated);
            // Reload contract to get updated status
            const activatedContract = await this.repository.findById(contractId);
            if (activatedContract) {
              return this.toContractResponse(activatedContract);
            }
          } catch (error) {
            logger.error(
              `Failed to auto-activate contract ${contractId} after all parties signed:`,
              error
            );
            // Continue and return signed contract even if activation fails
            // Activation can be retried manually later
          }
        }

        return this.toContractResponse(updated);
      }

      // Version conflict or party already signed - retry
      if (attempt < MAX_RETRIES - 1) {
        logger.info(
          `Version conflict on contract ${contractId}, retrying (attempt ${attempt + 1}/${MAX_RETRIES})`
        );
        // Wait before retry (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1))
        );
        continue;
      } else {
        // Max retries reached - check if party already signed
        if (!party) {
          throw new AppError('User is not authorized to sign this contract', 403);
        }
        const latestContract = await this.repository.findById(contractId);
        if (latestContract) {
          const alreadySigned = latestContract.signatures.find(
            (s) => s.partyId.toString() === party!.companyId.toString()
          );
          if (alreadySigned) {
            throw new AppError('Contract already signed by this party', 400);
          }
        }
        throw new AppError(
          'Failed to sign contract: Maximum retries reached due to concurrent modifications',
          409
        );
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new AppError('Failed to sign contract', 500);
  }

  /**
   * Verify contract signature
   * Verifies cryptographic signature and returns certificate information
   */
  async verifySignature(
    contractId: string,
    signatureId: string,
    requesterCompanyId: string,
    requesterRole: Role
  ): Promise<{
    valid: boolean;
    error?: string;
    certificateInfo?: {
      subject: string;
      issuer: string;
      validFrom: Date;
      validTo: Date;
      fingerprint: string;
    };
  }> {
    const contract = await this.repository.findById(contractId);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    // Check access: user must be buyer or party to the contract
    const isBuyer = contract.buyerCompanyId.toString() === requesterCompanyId;
    const isParty = contract.parties.some(
      (p) => p.companyId.toString() === requesterCompanyId
    );

    if (
      requesterRole !== Role.ADMIN &&
      requesterRole !== Role.GOVERNMENT &&
      !isBuyer &&
      !isParty
    ) {
      throw new AppError('Access denied: Not a party to this contract', 403);
    }

    // Find signature
    const signature = contract.signatures.find(
      (s) => (s as any)._id?.toString() === signatureId || s.userId.toString() === signatureId
    );

    if (!signature) {
      throw new AppError('Signature not found', 404);
    }

    // Verify signature using PKI service
    const pkiService = getPKIService();

    // Reconstruct contract content as it was when signed
    const contractContent = JSON.stringify({
      contractId: contract._id.toString(),
      version: contract.version,
      terms: contract.terms,
      amounts: contract.amounts,
      parties: contract.parties.map((p) => ({
        companyId: p.companyId.toString(),
        userId: p.userId.toString(),
        role: p.role,
      })),
    });

    // Verify signature
    if (!signature.certificate) {
      return {
        valid: false,
        error: 'Certificate not available for verification',
      };
    }

    const verifyResult = pkiService.verify(
      contractContent,
      signature.signature,
      signature.certificate
    );

    if (!verifyResult.valid) {
      return {
        valid: false,
        error: verifyResult.error || 'Signature verification failed',
      };
    }

    // Extract certificate information
    let certificateInfo;
    if (verifyResult.certificateInfo) {
      certificateInfo = {
        subject: verifyResult.certificateInfo.subject,
        issuer: verifyResult.certificateInfo.issuer,
        validFrom: verifyResult.certificateInfo.validFrom,
        validTo: verifyResult.certificateInfo.validTo,
        fingerprint: verifyResult.certificateInfo.fingerprint,
      };
    }

    return {
      valid: true,
      certificateInfo,
    };
  }

  /**
   * Update contract
   * Status lifecycle: Only draft contracts can be updated
   */
  async updateContract(
    id: string,
    data: UpdateContractDto
  ): Promise<ContractResponse> {
    const contract = await this.repository.findById(id);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    // Status lifecycle: Only draft contracts can be updated
    if (contract.status !== ContractStatus.DRAFT) {
      throw new AppError(
        `Contract cannot be updated in current status: ${contract.status}. Only draft contracts can be updated.`,
        400
      );
    }

    // Prevent status changes through update endpoint
    if (data.status && data.status !== ContractStatus.DRAFT) {
      throw new AppError(
        'Cannot change status through update. Use sign or activate endpoints.',
        400
      );
    }

    const updateData: Partial<IContract> = {};
    if (data.terms) {
      updateData.terms = data.terms;
    }
    if (data.paymentSchedule) {
      updateData.paymentSchedule = data.paymentSchedule.map((ps) => ({
        milestone: ps.milestone,
        amount: ps.amount,
        dueDate: new Date(ps.dueDate),
        status: ps.status || 'pending',
      }));
    }

    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      throw new AppError('Failed to update contract', 500);
    }

    return this.toContractResponse(updated);
  }

  /**
   * Validate that payment schedule exists and is valid
   */
  private validatePaymentSchedule(contract: IContract): void {
    if (!contract.paymentSchedule || contract.paymentSchedule.length === 0) {
      throw new AppError(
        'Cannot activate contract: Payment schedule is required before activation',
        400
      );
    }

    // Validate that all milestones have required fields
    for (const milestone of contract.paymentSchedule) {
      if (!milestone.milestone || milestone.amount === undefined || !milestone.dueDate) {
        throw new AppError(
          'Cannot activate contract: Payment schedule contains invalid milestones',
          400
        );
      }

      if (milestone.amount < 0) {
        throw new AppError(
          'Cannot activate contract: Payment schedule contains negative amounts',
          400
        );
      }
    }

    // Validate that amounts breakdown exists
    if (!contract.amounts.breakdown || contract.amounts.breakdown.length === 0) {
      throw new AppError(
        'Cannot activate contract: Amounts breakdown is required before activation',
        400
      );
    }
  }

  /**
   * Auto-activate contract when all parties have signed
   * Validates payment schedule and creates related records (payments, shipments)
   */
  private async autoActivateContract(contract: IContract): Promise<void> {
    // Validate payment schedule before activation
    try {
      this.validatePaymentSchedule(contract);
    } catch (error) {
      logger.error(
        `Cannot auto-activate contract ${contract._id}: Payment schedule validation failed`,
        error
      );
      // Don't throw - log error but don't prevent status update
      // Contract can be manually activated later after fixing payment schedule
      return;
    }

    // Update status to ACTIVE atomically
    const updated = await this.repository.update(contract._id.toString(), {
      status: ContractStatus.ACTIVE,
    });

    if (!updated) {
      logger.error(`Failed to auto-activate contract ${contract._id}`);
      return;
    }

    logger.info(`Auto-activated contract ${contract._id} after all parties signed`);

    // Create payments from payment schedule
    try {
      await this.createPaymentsFromSchedule(updated);
    } catch (error) {
      logger.error('Failed to create payments from payment schedule:', error);
      // Don't fail contract activation if payment creation fails
      // Payments can be created manually later if needed
    }

    // Auto-create shipment when contract becomes ACTIVE
    try {
      await this.createShipmentForContract(updated);
    } catch (error) {
      logger.error('Failed to auto-create shipment for contract:', error);
      // Don't fail contract activation if shipment creation fails
      // Shipment can be created manually later if needed
    }

    // Emit socket event for contract activation
    try {
      const socketService = getSocketService();
      const companyIds = updated.parties.map((p) => p.companyId.toString());
      socketService.emitContractEvent(
        SocketEvent.CONTRACT_ACTIVATED,
        {
          contractId: contract._id.toString(),
          purchaseRequestId: updated.purchaseRequestId.toString(),
          buyerCompanyId: updated.buyerCompanyId.toString(),
          parties: updated.parties.map((p) => ({
            companyId: p.companyId.toString(),
            userId: p.userId.toString(),
            role: p.role,
          })),
          status: ContractStatus.ACTIVE,
        },
        companyIds
      );
    } catch (error) {
      logger.error('Failed to emit contract activated socket event:', error);
    }

    // Send email notifications
    try {
      const allUserIds = updated.parties.map((p) => p.userId.toString());

      // Batch load users to prevent N+1 queries
      const users = await this.userRepository.findByIds(allUserIds);
      const recipients = users.map((user) => ({
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      }));

      if (recipients.length > 0) {
        const purchaseRequest = await this.purchaseRequestRepository.findById(
          updated.purchaseRequestId.toString()
        );
        await notificationService.notify({
          event: NotificationEvent.CONTRACT_ACTIVATED,
          recipients,
          data: {
            contractId: contract._id.toString(),
            purchaseRequestId: updated.purchaseRequestId.toString(),
            purchaseRequestTitle: purchaseRequest?.title || 'Contract',
            totalAmount: updated.amounts.total,
            currency: updated.amounts.currency,
            status: ContractStatus.ACTIVE,
            contractUrl: `${config.frontend.url}/contracts/${contract._id}`,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to send contract activation notifications:', error);
    }

    // Notify company managers about contract activation
    try {
      const purchaseRequest = await this.purchaseRequestRepository.findById(
        updated.purchaseRequestId.toString()
      );
      const allCompanyIds = [
        updated.buyerCompanyId.toString(),
        ...updated.parties.map((p) => p.companyId.toString()),
      ];
      const uniqueCompanyIds = [...new Set(allCompanyIds)];

      for (const partyCompanyId of uniqueCompanyIds) {
        await notificationService.notifyCompanyManagers(
          partyCompanyId,
          NotificationEvent.CONTRACT_ACTIVATED,
          {
            title: `Contract Activated`,
            message: `The contract for purchase request "${purchaseRequest?.title || 'Contract'}" has been activated. Total amount: ${updated.amounts.currency} ${updated.amounts.total.toLocaleString()}`,
            entityType: 'contract',
            entityId: contract._id.toString(),
            actionUrl: `${config.frontend.url}/contracts/${contract._id}`,
            contractId: contract._id.toString(),
            purchaseRequestId: updated.purchaseRequestId.toString(),
            purchaseRequestTitle: purchaseRequest?.title || 'Contract',
            totalAmount: updated.amounts.total,
            currency: updated.amounts.currency,
            status: ContractStatus.ACTIVE,
          }
        );
      }
    } catch (error) {
      logger.error('Failed to notify company managers about contract activation:', error);
    }
  }

  /**
   * Create payments from contract payment schedule
   * Distributes milestone payments to recipient parties based on amounts breakdown
   */
  private async createPaymentsFromSchedule(contract: IContract): Promise<void> {
    if (!contract.paymentSchedule || contract.paymentSchedule.length === 0) {
      logger.info(`No payment schedule found for contract ${contract._id}`);
      return;
    }

    // Find buyer party to get buyerId
    const buyerParty = contract.parties.find((p) => p.role === Role.BUYER);
    if (!buyerParty) {
      logger.warn(`No buyer party found for contract ${contract._id}`);
      return;
    }

    // Calculate total breakdown amount (sum of all party amounts)
    const totalBreakdownAmount = contract.amounts.breakdown.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    if (totalBreakdownAmount === 0) {
      logger.warn(`Total breakdown amount is zero for contract ${contract._id}`);
      return;
    }

    const createdPayments: string[] = [];

    // Create payments for each milestone
    for (const milestone of contract.paymentSchedule) {
      // Distribute milestone amount to each recipient party based on their share
      for (const breakdownItem of contract.amounts.breakdown) {
        // Skip if this is the buyer company (they don't receive payments)
        if (breakdownItem.partyId.toString() === contract.buyerCompanyId.toString()) {
          continue;
        }

        // Calculate this party's share of the milestone payment
        const partyShare = (milestone.amount * breakdownItem.amount) / totalBreakdownAmount;

        // Round to 2 decimal places to avoid floating point issues
        const roundedAmount = Math.round(partyShare * 100) / 100;

        // Create payment record
        try {
          const payment = await this.paymentRepository.create({
            contractId: contract._id,
            companyId: contract.buyerCompanyId,
            recipientCompanyId: breakdownItem.partyId,
            buyerId: buyerParty.userId,
            milestone: milestone.milestone,
            amount: roundedAmount,
            currency: contract.amounts.currency,
            dueDate: milestone.dueDate,
            status: PaymentStatus.PENDING_APPROVAL,
            notes: `Auto-generated payment for milestone: ${milestone.milestone}. ${breakdownItem.description}`,
          });

          createdPayments.push(payment._id.toString());

          // Emit socket event for payment creation
          try {
            const socketService = getSocketService();
            socketService.emitPaymentEvent(
              SocketEvent.PAYMENT_CREATED,
              {
                paymentId: payment._id.toString(),
                contractId: contract._id.toString(),
                companyId: contract.buyerCompanyId.toString(),
                recipientCompanyId: breakdownItem.partyId.toString(),
                amount: roundedAmount,
                currency: contract.amounts.currency,
                status: PaymentStatus.PENDING_APPROVAL,
                milestone: milestone.milestone,
                dueDate: milestone.dueDate,
              },
              [contract.buyerCompanyId.toString(), breakdownItem.partyId.toString()]
            );
          } catch (error) {
            logger.error('Failed to emit payment created socket event:', error);
          }

          logger.info(
            `Created payment ${payment._id} for milestone "${milestone.milestone}" to company ${breakdownItem.partyId} (amount: ${roundedAmount} ${contract.amounts.currency})`
          );
        } catch (error) {
          logger.error(
            `Failed to create payment for milestone "${milestone.milestone}" and party ${breakdownItem.partyId}:`,
            error
          );
          // Continue with other payments even if one fails
        }
      }
    }

    logger.info(
      `Created ${createdPayments.length} payments from payment schedule for contract ${contract._id}`
    );
  }

  /**
   * Auto-create shipment when contract becomes ACTIVE
   * Links shipment to contract and logistics party, initializes with delivery details
   */
  private async createShipmentForContract(contract: IContract): Promise<void> {
    // Check if shipment already exists for this contract
    const existingShipments = await this.shipmentService.getShipmentsByContract(
      contract._id.toString()
    );

    if (existingShipments.length > 0) {
      logger.info(
        `Shipment already exists for contract ${contract._id}, skipping auto-creation`
      );
      return;
    }

    // Find Logistics party from contract parties
    const logisticsParty = contract.parties.find(
      (p) => p.role === Role.LOGISTICS
    );

    if (!logisticsParty) {
      logger.info(
        `No Logistics party found in contract ${contract._id}, skipping shipment creation`
      );
      return;
    }

    // Find Supplier party for origin address
    const supplierParty = contract.parties.find(
      (p) => p.role === Role.SUPPLIER
    );

    // Get purchase request for delivery details
    const purchaseRequest = await this.purchaseRequestRepository.findById(
      contract.purchaseRequestId.toString()
    );

    if (!purchaseRequest) {
      logger.warn(
        `Purchase request not found for contract ${contract._id}, skipping shipment creation`
      );
      return;
    }

    // Get supplier company for origin address
    let originAddress: {
      address: string;
      city: string;
      country: string;
      coordinates: { lat: number; lng: number };
    };

    if (supplierParty) {
      const supplierCompany = await this.companyRepository.findById(
        supplierParty.companyId.toString()
      );
      if (supplierCompany && supplierCompany.address) {
        originAddress = {
          address: supplierCompany.address.street,
          city: supplierCompany.address.city,
          country: supplierCompany.address.country,
          coordinates: {
            lat: 0, // Default coordinates if not available
            lng: 0,
          },
        };
      } else {
        // Fallback: use a default origin if supplier company not found
        logger.warn(
          `Supplier company not found for contract ${contract._id}, using default origin`
        );
        originAddress = {
          address: 'Origin Address TBD',
          city: 'Origin City',
          country: 'Origin Country',
          coordinates: { lat: 0, lng: 0 },
        };
      }
    } else {
      // No supplier party - use default origin
      logger.info(
        `No Supplier party found in contract ${contract._id}, using default origin`
      );
      originAddress = {
        address: 'Origin Address TBD',
        city: 'Origin City',
        country: 'Origin Country',
        coordinates: { lat: 0, lng: 0 },
      };
    }

    // Prepare destination from purchase request delivery location
    const destination = {
      address: purchaseRequest.deliveryLocation.address,
      city: purchaseRequest.deliveryLocation.city,
      country: purchaseRequest.deliveryLocation.country,
      coordinates: purchaseRequest.deliveryLocation.coordinates || {
        lat: 0,
        lng: 0,
      },
    };

    // Create shipment
    try {
      const shipment = await this.shipmentService.createShipment(
        contract.buyerCompanyId.toString(),
        {
          contractId: contract._id.toString(),
          logisticsCompanyId: logisticsParty.companyId.toString(),
          origin: originAddress,
          destination: destination,
          estimatedDeliveryDate: purchaseRequest.requiredDeliveryDate.toISOString(),
        }
      );

      logger.info(
        `Auto-created shipment ${shipment.id} for contract ${contract._id} with logistics company ${logisticsParty.companyId}`
      );
    } catch (error) {
      logger.error(
        `Failed to create shipment for contract ${contract._id}:`,
        error
      );
      throw error; // Re-throw to be caught by caller
    }
  }

  /**
   * Activate contract (after all signatures)
   * Status lifecycle: Only signed contracts can be activated
   * Validates payment schedule and automatically creates payments and shipments
   * Note: Contracts are now auto-activated when all parties sign, but this method
   * can be used for manual activation or re-activation if needed
   */
  async activateContract(id: string): Promise<ContractResponse> {
    const contract = await this.repository.findById(id);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    // Status lifecycle: Only signed contracts can be activated
    if (contract.status !== ContractStatus.SIGNED) {
      throw new AppError(
        `Contract cannot be activated in current status: ${contract.status}. Only signed contracts can be activated.`,
        400
      );
    }

    // Verify all parties have signed
    if (contract.signatures.length !== contract.parties.length) {
      throw new AppError(
        'Cannot activate contract: Not all parties have signed',
        400
      );
    }

    // Validate payment schedule before activation
    this.validatePaymentSchedule(contract);

    // Use the same auto-activation logic
    await this.autoActivateContract(contract);

    // Reload contract to get updated status
    const activatedContract = await this.repository.findById(id);
    if (!activatedContract) {
      throw new AppError('Failed to activate contract', 500);
    }

    return this.toContractResponse(activatedContract);
  }

  /**
   * Delete contract (soft delete)
   */
  async deleteContract(id: string): Promise<void> {
    const contract = await this.repository.findById(id);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    await this.repository.softDelete(id);
  }

  /**
   * Create contract amendment
   * Only active contracts can be amended
   */
  async createAmendment(
    contractId: string,
    userId: string,
    companyId: string,
    data: CreateAmendmentDto
  ): Promise<AmendmentResponse> {
    // Get contract
    const contract = await this.repository.findById(contractId);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    // Only active contracts can be amended
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new AppError(
        `Contract cannot be amended in current status: ${contract.status}. Only active contracts can be amended.`,
        400
      );
    }

    // Verify user is a party to the contract
    const party = contract.parties.find(
      (p) => p.companyId.toString() === companyId
    );
    if (!party) {
      throw new AppError('User is not a party to this contract', 403);
    }

    // Get next version number
    const latestVersion = await this.amendmentRepository.getLatestVersion(
      contractId
    );
    const nextVersion = latestVersion + 1;

    // Generate amendment number
    const amendmentNumber =
      await this.amendmentRepository.generateAmendmentNumber();

    // Create snapshot of original contract
    const originalContract = {
      terms: contract.terms,
      amounts: {
        total: contract.amounts.total,
        currency: contract.amounts.currency,
        breakdown: contract.amounts.breakdown.map((b) => ({
          partyId: b.partyId,
          amount: b.amount,
          description: b.description,
        })),
      },
      paymentSchedule: contract.paymentSchedule.map((ps) => ({
        milestone: ps.milestone,
        amount: ps.amount,
        dueDate: ps.dueDate,
        status: ps.status,
      })),
      startDate: contract.startDate,
      endDate: contract.endDate,
    };

    // Prepare changes
    const changes: any = {};
    if (data.changes.terms) {
      changes.terms = data.changes.terms;
    }
    if (data.changes.amounts) {
      changes.amounts = {
        ...data.changes.amounts,
        breakdown: data.changes.amounts.breakdown?.map((b) => ({
          partyId: new mongoose.Types.ObjectId(b.partyId),
          amount: b.amount,
          description: b.description,
        })),
      };
    }
    if (data.changes.paymentSchedule) {
      changes.paymentSchedule = data.changes.paymentSchedule.map((ps) => ({
        milestone: ps.milestone,
        amount: ps.amount,
        dueDate: new Date(ps.dueDate),
        status: ps.status || 'pending',
      }));
    }
    if (data.changes.startDate) {
      changes.startDate = new Date(data.changes.startDate);
    }
    if (data.changes.endDate) {
      changes.endDate = new Date(data.changes.endDate);
    }

    // Create amendment
    const amendment = await this.amendmentRepository.create({
      contractId: contract._id,
      version: nextVersion,
      amendmentNumber,
      reason: data.reason,
      description: data.description,
      changes,
      originalContract,
      approvals: [],
      status: AmendmentStatus.DRAFT,
      createdBy: {
        userId: new mongoose.Types.ObjectId(userId),
        companyId: new mongoose.Types.ObjectId(companyId),
      },
    });

    // Automatically submit for approval (change status to pending_approval)
    const submittedAmendment = await this.amendmentRepository.updateStatus(
      amendment._id.toString(),
      AmendmentStatus.PENDING_APPROVAL
    );

    logger.info(
      `Amendment ${amendmentNumber} created for contract ${contractId} by user ${userId}`
    );

    // Emit socket event for amendment creation
    try {
      const socketService = getSocketService();
      const companyIds = contract.parties.map((p) => p.companyId.toString());
      socketService.emitContractEvent(
        SocketEvent.CONTRACT_AMENDMENT_CREATED,
        {
          contractId: contractId,
          amendmentId: submittedAmendment!._id.toString(),
          amendmentNumber: amendmentNumber,
          version: nextVersion,
          reason: data.reason,
          description: data.description,
          createdBy: {
            userId: userId,
            companyId: companyId,
          },
          status: AmendmentStatus.PENDING_APPROVAL,
        },
        companyIds
      );
    } catch (error) {
      logger.error('Failed to emit amendment created socket event:', error);
    }

    return this.toAmendmentResponse(submittedAmendment!);
  }

  /**
   * Approve or reject amendment
   * All parties must approve for amendment to be applied
   */
  async approveAmendment(
    amendmentId: string,
    userId: string,
    companyId: string,
    data: ApproveAmendmentDto
  ): Promise<AmendmentResponse> {
    // Get amendment
    const amendment = await this.amendmentRepository.findById(amendmentId);
    if (!amendment) {
      throw new AppError('Amendment not found', 404);
    }

    // Get contract
    const contract = await this.repository.findById(
      amendment.contractId.toString()
    );
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    // Verify amendment is pending approval
    if (amendment.status !== AmendmentStatus.PENDING_APPROVAL) {
      throw new AppError(
        `Amendment cannot be approved in current status: ${amendment.status}`,
        400
      );
    }

    // Verify user is a party to the contract
    const party = contract.parties.find(
      (p) => p.companyId.toString() === companyId
    );
    if (!party) {
      throw new AppError('User is not a party to this contract', 403);
    }

    // Check if party has already responded
    const hasResponded =
      await this.amendmentRepository.hasPartyResponded(
        amendmentId,
        companyId
      );
    if (hasResponded) {
      throw new AppError('Party has already responded to this amendment', 400);
    }

    // Add approval/rejection
    const updatedAmendment = await this.amendmentRepository.addApproval(
      amendmentId,
      {
        partyId: party.companyId,
        userId: new mongoose.Types.ObjectId(userId),
        approved: data.approved,
        comments: data.comments,
      }
    );

    if (!updatedAmendment) {
      throw new AppError('Failed to record approval', 500);
    }

    // If rejected, mark amendment as rejected
    if (!data.approved) {
      await this.amendmentRepository.updateStatus(
        amendmentId,
        AmendmentStatus.REJECTED
      );
      const rejectedAmendment = await this.amendmentRepository.findById(
        amendmentId
      );
      logger.info(
        `Amendment ${amendment.amendmentNumber} rejected by party ${companyId}`
      );

      // Emit socket event for amendment rejection
      try {
        const socketService = getSocketService();
        const companyIds = contract.parties.map((p) => p.companyId.toString());
        socketService.emitContractEvent(
          SocketEvent.CONTRACT_AMENDMENT_REJECTED,
          {
            contractId: contract._id.toString(),
            amendmentId: amendmentId,
            amendmentNumber: amendment.amendmentNumber,
            version: amendment.version,
            rejectedBy: {
              userId: userId,
              companyId: companyId,
            },
            comments: data.comments,
            status: AmendmentStatus.REJECTED,
          },
          companyIds
        );
      } catch (error) {
        logger.error('Failed to emit amendment rejected socket event:', error);
      }

      return this.toAmendmentResponse(rejectedAmendment!);
    }

    // Check if all parties have approved
    const allPartiesApproved =
      updatedAmendment.approvals.length === contract.parties.length &&
      updatedAmendment.approvals.every((a) => a.approved);

    if (allPartiesApproved) {
      // All parties approved - mark as approved
      await this.amendmentRepository.updateStatus(
        amendmentId,
        AmendmentStatus.APPROVED
      );

      // Apply amendment to contract
      await this.applyAmendment(amendmentId, userId);

      logger.info(
        `Amendment ${amendment.amendmentNumber} approved by all parties and applied to contract`
      );

      // Emit socket event for amendment approval and application
      try {
        const socketService = getSocketService();
        const companyIds = contract.parties.map((p) => p.companyId.toString());
        socketService.emitContractEvent(
          SocketEvent.CONTRACT_AMENDMENT_APPROVED,
          {
            contractId: contract._id.toString(),
            amendmentId: amendmentId,
            amendmentNumber: amendment.amendmentNumber,
            version: amendment.version,
            appliedBy: userId,
            status: AmendmentStatus.ACTIVE,
            newContractVersion: contract.version + 1,
          },
          companyIds
        );
      } catch (error) {
        logger.error('Failed to emit amendment approved socket event:', error);
      }
    } else {
      // Partial approval - emit event for approval progress
      try {
        const socketService = getSocketService();
        const companyIds = contract.parties.map((p) => p.companyId.toString());
        socketService.emitContractEvent(
          SocketEvent.CONTRACT_AMENDMENT_APPROVED,
          {
            contractId: contract._id.toString(),
            amendmentId: amendmentId,
            amendmentNumber: amendment.amendmentNumber,
            version: amendment.version,
            approvedBy: {
              userId: userId,
              companyId: companyId,
            },
            approvalsCount: updatedAmendment.approvals.length,
            totalParties: contract.parties.length,
            status: AmendmentStatus.PENDING_APPROVAL,
          },
          companyIds
        );
      } catch (error) {
        logger.error('Failed to emit amendment approval progress socket event:', error);
      }
    }

    const finalAmendment = await this.amendmentRepository.findById(amendmentId);
    return this.toAmendmentResponse(finalAmendment!);
  }

  /**
   * Apply amendment to contract
   * Updates contract with amendment changes and increments version
   */
  private async applyAmendment(
    amendmentId: string,
    appliedBy: string
  ): Promise<void> {
    const amendment = await this.amendmentRepository.findById(amendmentId);
    if (!amendment) {
      throw new AppError('Amendment not found', 404);
    }

    const contract = await this.repository.findById(
      amendment.contractId.toString()
    );
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    // Build update object with amendment changes
    const updateData: Partial<IContract> = {
      version: (contract.version || 1) + 1,
    };

    if (amendment.changes.terms) {
      updateData.terms = amendment.changes.terms;
    }

    if (amendment.changes.amounts) {
      updateData.amounts = {
        total:
          amendment.changes.amounts.total ?? contract.amounts.total,
        currency:
          amendment.changes.amounts.currency ?? contract.amounts.currency,
        breakdown:
          amendment.changes.amounts.breakdown ?? contract.amounts.breakdown,
      };
    }

    if (amendment.changes.paymentSchedule) {
      updateData.paymentSchedule = amendment.changes.paymentSchedule;
    }

    if (amendment.changes.startDate) {
      updateData.startDate = amendment.changes.startDate;
    }

    if (amendment.changes.endDate) {
      updateData.endDate = amendment.changes.endDate;
    }

    // Update contract
    const updatedContract = await this.repository.update(
      amendment.contractId.toString(),
      updateData
    );

    // Mark amendment as applied
    await this.amendmentRepository.markAsApplied(
      amendmentId,
      new mongoose.Types.ObjectId(appliedBy)
    );

    // Create version snapshot after amendment is applied
    if (updatedContract) {
      await this.createVersionSnapshot(
        updatedContract,
        `Amendment ${amendment.amendmentNumber} applied`,
        { userId: appliedBy, companyId: contract.buyerCompanyId.toString() },
        amendmentId
      );
    }

    logger.info(
      `Amendment ${amendment.amendmentNumber} applied to contract ${contract._id}`
    );
  }

  /**
   * Get amendments for a contract
   * Validates that user's company is either the buyer or one of the parties
   */
  async getContractAmendments(
    contractId: string,
    filters?: { status?: string },
    requesterCompanyId?: string,
    requesterRole?: Role
  ): Promise<AmendmentResponse[]> {
    const contract = await this.repository.findById(contractId);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    // Admin and Government can view all amendments
    if (requesterRole === Role.ADMIN || requesterRole === Role.GOVERNMENT) {
      const amendments = await this.amendmentRepository.findByContractId(
        contractId,
        filters as any
      );
      return amendments.map((amendment) => this.toAmendmentResponse(amendment));
    }

    // For other roles, check if user's company is involved in the contract
    if (requesterCompanyId) {
      const isBuyer = contract.buyerCompanyId.toString() === requesterCompanyId;
      const isParty = contract.parties.some(
        (party) => party.companyId.toString() === requesterCompanyId
      );

      if (!isBuyer && !isParty) {
        throw new AppError(
          'Access denied: Your company is not a party to this contract',
          403
        );
      }
    }

    const amendments = await this.amendmentRepository.findByContractId(
      contractId,
      filters as any
    );

    return amendments.map((amendment) => this.toAmendmentResponse(amendment));
  }

  /**
   * Get amendment by ID
   * Validates that user's company is either the buyer or one of the parties
   */
  async getAmendmentById(
    amendmentId: string,
    requesterCompanyId?: string,
    requesterRole?: Role
  ): Promise<AmendmentResponse> {
    const amendment = await this.amendmentRepository.findById(amendmentId);
    if (!amendment) {
      throw new AppError('Amendment not found', 404);
    }

    // Get contract to check access
    const contract = await this.repository.findById(
      amendment.contractId.toString()
    );
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    // Admin and Government can view all amendments
    if (requesterRole === Role.ADMIN || requesterRole === Role.GOVERNMENT) {
      return this.toAmendmentResponse(amendment);
    }

    // For other roles, check if user's company is involved in the contract
    if (requesterCompanyId) {
      const isBuyer = contract.buyerCompanyId.toString() === requesterCompanyId;
      const isParty = contract.parties.some(
        (party) => party.companyId.toString() === requesterCompanyId
      );

      if (!isBuyer && !isParty) {
        throw new AppError(
          'Access denied: Your company is not a party to this contract',
          403
        );
      }
    }

    return this.toAmendmentResponse(amendment);
  }

  /**
   * Convert IContractAmendment to AmendmentResponse
   */
  private toAmendmentResponse(
    amendment: IContractAmendment
  ): AmendmentResponse {
    return {
      id: amendment._id.toString(),
      contractId: amendment.contractId.toString(),
      version: amendment.version,
      amendmentNumber: amendment.amendmentNumber,
      reason: amendment.reason,
      description: amendment.description,
      changes: {
        terms: amendment.changes.terms,
        amounts: amendment.changes.amounts
          ? {
            total: amendment.changes.amounts.total,
            currency: amendment.changes.amounts.currency,
            breakdown: amendment.changes.amounts.breakdown?.map((b) => ({
              partyId: b.partyId.toString(),
              amount: b.amount,
              description: b.description,
            })),
          }
          : undefined,
        paymentSchedule: amendment.changes.paymentSchedule?.map((ps) => ({
          milestone: ps.milestone,
          amount: ps.amount,
          dueDate: ps.dueDate,
          status: ps.status,
        })),
        startDate: amendment.changes.startDate,
        endDate: amendment.changes.endDate,
      },
      originalContract: {
        terms: amendment.originalContract.terms,
        amounts: {
          total: amendment.originalContract.amounts.total,
          currency: amendment.originalContract.amounts.currency,
          breakdown: amendment.originalContract.amounts.breakdown.map((b) => ({
            partyId: b.partyId.toString(),
            amount: b.amount,
            description: b.description,
          })),
        },
        paymentSchedule: amendment.originalContract.paymentSchedule.map(
          (ps) => ({
            milestone: ps.milestone,
            amount: ps.amount,
            dueDate: ps.dueDate,
            status: ps.status,
          })
        ),
        startDate: amendment.originalContract.startDate,
        endDate: amendment.originalContract.endDate,
      },
      approvals: amendment.approvals.map((a) => ({
        partyId: a.partyId.toString(),
        userId: a.userId.toString(),
        approved: a.approved,
        comments: a.comments,
        approvedAt: a.approvedAt,
      })),
      status: amendment.status,
      createdBy: {
        userId: amendment.createdBy.userId.toString(),
        companyId: amendment.createdBy.companyId.toString(),
      },
      appliedAt: amendment.appliedAt,
      appliedBy: amendment.appliedBy?.toString(),
      createdAt: amendment.createdAt,
      updatedAt: amendment.updatedAt,
    };
  }

  /**
   * Convert IContract to ContractResponse
   */
  private toContractResponse(contract: IContract): ContractResponse {
    return {
      id: contract._id.toString(),
      purchaseRequestId: contract.purchaseRequestId.toString(),
      buyerCompanyId: contract.buyerCompanyId.toString(),
      parties: contract.parties.map((p) => ({
        companyId: p.companyId.toString(),
        userId: p.userId.toString(),
        role: p.role,
        bidId: p.bidId?.toString(),
      })),
      amounts: {
        ...contract.amounts,
        breakdown: contract.amounts.breakdown.map((b) => ({
          partyId: b.partyId.toString(),
          amount: b.amount,
          description: b.description,
        })),
      },
      paymentSchedule: contract.paymentSchedule,
      signatures: contract.signatures.map((s) => ({
        partyId: s.partyId.toString(),
        userId: s.userId.toString(),
        signedAt: s.signedAt,
        signature: s.signature,
        signatureHash: s.signatureHash,
        certificate: s.certificate,
        algorithm: s.algorithm,
        verified: s.verified,
      })),
      terms: contract.terms,
      startDate: contract.startDate,
      endDate: contract.endDate,
      status: contract.status,
      version: contract.version || 1,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
    };
  }

  /**
   * Create a version snapshot of a contract
   * Called when contract is signed (all parties) or when amendment is applied
   */
  private async createVersionSnapshot(
    contract: IContract,
    reason: string,
    createdBy?: { userId: string; companyId: string },
    amendmentId?: string
  ): Promise<void> {
    try {
      const versionNumber = contract.version || 1;

      // Check if version already exists
      const exists = await this.versionRepository.versionExists(
        contract._id.toString(),
        versionNumber
      );

      if (exists) {
        logger.info(
          `Version ${versionNumber} already exists for contract ${contract._id}, skipping snapshot creation`
        );
        return;
      }

      // Create snapshot
      await this.versionRepository.create({
        contractId: contract._id,
        version: versionNumber,
        snapshot: {
          purchaseRequestId: contract.purchaseRequestId,
          buyerCompanyId: contract.buyerCompanyId,
          parties: contract.parties.map((p) => ({
            companyId: p.companyId,
            userId: p.userId,
            role: p.role,
            bidId: p.bidId,
          })),
          amounts: {
            total: contract.amounts.total,
            currency: contract.amounts.currency,
            breakdown: contract.amounts.breakdown.map((b) => ({
              partyId: b.partyId,
              amount: b.amount,
              description: b.description,
            })),
          },
          paymentSchedule: contract.paymentSchedule.map((ps) => ({
            milestone: ps.milestone,
            amount: ps.amount,
            dueDate: ps.dueDate,
            status: ps.status,
          })),
          terms: contract.terms,
          startDate: contract.startDate,
          endDate: contract.endDate,
          status: contract.status,
        },
        signatures: contract.signatures.map((s) => ({
          partyId: s.partyId,
          userId: s.userId,
          signedAt: s.signedAt,
          signature: s.signature,
          signatureHash: s.signatureHash,
          certificate: s.certificate,
          algorithm: s.algorithm,
          verified: s.verified,
        })),
        createdBy: createdBy
          ? {
            userId: new mongoose.Types.ObjectId(createdBy.userId),
            companyId: new mongoose.Types.ObjectId(createdBy.companyId),
          }
          : undefined,
        reason,
        amendmentId: amendmentId
          ? new mongoose.Types.ObjectId(amendmentId)
          : undefined,
      });

      logger.info(
        `Created version ${versionNumber} snapshot for contract ${contract._id}`
      );
    } catch (error) {
      logger.error(
        `Failed to create version snapshot for contract ${contract._id}:`,
        error
      );
      // Don't throw - version snapshot is not critical for contract operations
    }
  }

  /**
   * Get version history for a contract
   */
  async getVersionHistory(
    contractId: string,
    requesterCompanyId?: string,
    requesterRole?: Role
  ): Promise<ContractVersionResponse[]> {
    const contract = await this.repository.findById(contractId);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    // Admin and Government can view all versions
    if (requesterRole === Role.ADMIN || requesterRole === Role.GOVERNMENT) {
      const versions = await this.versionRepository.findByContractId(contractId);
      return versions.map((v) => this.toVersionResponse(v));
    }

    // For other roles, check if user's company is involved in the contract
    if (requesterCompanyId) {
      const isBuyer = contract.buyerCompanyId.toString() === requesterCompanyId;
      const isParty = contract.parties.some(
        (party) => party.companyId.toString() === requesterCompanyId
      );

      if (!isBuyer && !isParty) {
        throw new AppError(
          'Access denied: Your company is not a party to this contract',
          403
        );
      }
    }

    const versions = await this.versionRepository.findByContractId(contractId);
    return versions.map((v) => this.toVersionResponse(v));
  }

  /**
   * Get a specific version of a contract
   */
  async getContractVersion(
    contractId: string,
    versionNumber: number,
    requesterCompanyId?: string,
    requesterRole?: Role
  ): Promise<ContractVersionResponse> {
    const contract = await this.repository.findById(contractId);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    // Admin and Government can view all versions
    if (requesterRole !== Role.ADMIN && requesterRole !== Role.GOVERNMENT) {
      // For other roles, check if user's company is involved in the contract
      if (requesterCompanyId) {
        const isBuyer = contract.buyerCompanyId.toString() === requesterCompanyId;
        const isParty = contract.parties.some(
          (party) => party.companyId.toString() === requesterCompanyId
        );

        if (!isBuyer && !isParty) {
          throw new AppError(
            'Access denied: Your company is not a party to this contract',
            403
          );
        }
      }
    }

    const version = await this.versionRepository.findByVersion(
      contractId,
      versionNumber
    );

    if (!version) {
      throw new AppError(
        `Version ${versionNumber} not found for contract ${contractId}`,
        404
      );
    }

    return this.toVersionResponse(version);
  }

  /**
   * Compare two versions of a contract
   */
  async compareVersions(
    contractId: string,
    version1: number,
    version2: number,
    requesterCompanyId?: string,
    requesterRole?: Role
  ): Promise<VersionDiffResponse> {
    const contract = await this.repository.findById(contractId);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    // Admin and Government can view all versions
    if (requesterRole !== Role.ADMIN && requesterRole !== Role.GOVERNMENT) {
      // For other roles, check if user's company is involved in the contract
      if (requesterCompanyId) {
        const isBuyer = contract.buyerCompanyId.toString() === requesterCompanyId;
        const isParty = contract.parties.some(
          (party) => party.companyId.toString() === requesterCompanyId
        );

        if (!isBuyer && !isParty) {
          throw new AppError(
            'Access denied: Your company is not a party to this contract',
            403
          );
        }
      }
    }

    const v1 = await this.versionRepository.findByVersion(contractId, version1);
    const v2 = await this.versionRepository.findByVersion(contractId, version2);

    if (!v1) {
      throw new AppError(
        `Version ${version1} not found for contract ${contractId}`,
        404
      );
    }

    if (!v2) {
      throw new AppError(
        `Version ${version2} not found for contract ${contractId}`,
        404
      );
    }

    const differences = this.calculateDifferences(v1, v2);

    return {
      version1: this.toVersionResponse(v1),
      version2: this.toVersionResponse(v2),
      differences,
    };
  }

  /**
   * Calculate differences between two contract versions
   */
  private calculateDifferences(
    version1: any,
    version2: any
  ): Array<{ field: string; path: string; oldValue: any; newValue: any }> {
    const differences: Array<{
      field: string;
      path: string;
      oldValue: any;
      newValue: any;
    }> = [];

    const s1 = version1.snapshot;
    const s2 = version2.snapshot;

    // Compare terms
    if (s1.terms !== s2.terms) {
      differences.push({
        field: 'terms',
        path: 'terms',
        oldValue: s1.terms,
        newValue: s2.terms,
      });
    }

    // Compare amounts
    if (s1.amounts.total !== s2.amounts.total) {
      differences.push({
        field: 'amounts.total',
        path: 'amounts.total',
        oldValue: s1.amounts.total,
        newValue: s2.amounts.total,
      });
    }

    if (s1.amounts.currency !== s2.amounts.currency) {
      differences.push({
        field: 'amounts.currency',
        path: 'amounts.currency',
        oldValue: s1.amounts.currency,
        newValue: s2.amounts.currency,
      });
    }

    // Compare breakdown
    const breakdownDiff = this.compareArrays(
      s1.amounts.breakdown,
      s2.amounts.breakdown,
      'amounts.breakdown',
      (item: any) => item.partyId.toString()
    );
    differences.push(...breakdownDiff);

    // Compare payment schedule
    const paymentScheduleDiff = this.compareArrays(
      s1.paymentSchedule,
      s2.paymentSchedule,
      'paymentSchedule',
      (item: any) => item.milestone
    );
    differences.push(...paymentScheduleDiff);

    // Compare dates
    if (s1.startDate.getTime() !== s2.startDate.getTime()) {
      differences.push({
        field: 'startDate',
        path: 'startDate',
        oldValue: s1.startDate,
        newValue: s2.startDate,
      });
    }

    if (s1.endDate.getTime() !== s2.endDate.getTime()) {
      differences.push({
        field: 'endDate',
        path: 'endDate',
        oldValue: s1.endDate,
        newValue: s2.endDate,
      });
    }

    // Compare status
    if (s1.status !== s2.status) {
      differences.push({
        field: 'status',
        path: 'status',
        oldValue: s1.status,
        newValue: s2.status,
      });
    }

    return differences;
  }

  /**
   * Compare two arrays and find differences
   */
  private compareArrays(
    arr1: any[],
    arr2: any[],
    basePath: string,
    keyFn: (item: any) => string
  ): Array<{ field: string; path: string; oldValue: any; newValue: any }> {
    const differences: Array<{
      field: string;
      path: string;
      oldValue: any;
      newValue: any;
    }> = [];

    const map1 = new Map(arr1.map((item) => [keyFn(item), item]));
    const map2 = new Map(arr2.map((item) => [keyFn(item), item]));

    // Helper function to normalize dates for comparison
    const normalizeForComparison = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (obj instanceof Date) return obj.getTime();
      if (typeof obj === 'object') {
        const normalized: any = {};
        for (const [k, v] of Object.entries(obj)) {
          normalized[k] = normalizeForComparison(v);
        }
        return normalized;
      }
      return obj;
    };

    // Find items in arr1 but not in arr2 (removed)
    for (const [key, item1] of map1.entries()) {
      if (!map2.has(key)) {
        differences.push({
          field: `${basePath}[${key}]`,
          path: `${basePath}[${key}]`,
          oldValue: item1,
          newValue: null,
        });
      } else {
        // Compare items with same key
        const item2 = map2.get(key);
        const normalized1 = normalizeForComparison(item1);
        const normalized2 = normalizeForComparison(item2);
        const item1Str = JSON.stringify(normalized1);
        const item2Str = JSON.stringify(normalized2);
        if (item1Str !== item2Str) {
          differences.push({
            field: `${basePath}[${key}]`,
            path: `${basePath}[${key}]`,
            oldValue: item1,
            newValue: item2,
          });
        }
      }
    }

    // Find items in arr2 but not in arr1 (added)
    for (const [key, item2] of map2.entries()) {
      if (!map1.has(key)) {
        differences.push({
          field: `${basePath}[${key}]`,
          path: `${basePath}[${key}]`,
          oldValue: null,
          newValue: item2,
        });
      }
    }

    return differences;
  }

  /**
   * Convert IContractVersion to ContractVersionResponse
   */
  private toVersionResponse(version: any): ContractVersionResponse {
    return {
      id: version._id.toString(),
      contractId: version.contractId.toString(),
      version: version.version,
      snapshot: {
        purchaseRequestId: version.snapshot.purchaseRequestId.toString(),
        buyerCompanyId: version.snapshot.buyerCompanyId.toString(),
        parties: version.snapshot.parties.map((p: any) => ({
          companyId: p.companyId.toString(),
          userId: p.userId.toString(),
          role: p.role,
          bidId: p.bidId?.toString(),
        })),
        amounts: {
          total: version.snapshot.amounts.total,
          currency: version.snapshot.amounts.currency,
          breakdown: version.snapshot.amounts.breakdown.map((b: any) => ({
            partyId: b.partyId.toString(),
            amount: b.amount,
            description: b.description,
          })),
        },
        paymentSchedule: version.snapshot.paymentSchedule.map((ps: any) => ({
          milestone: ps.milestone,
          amount: ps.amount,
          dueDate: ps.dueDate,
          status: ps.status,
        })),
        terms: version.snapshot.terms,
        startDate: version.snapshot.startDate,
        endDate: version.snapshot.endDate,
        status: version.snapshot.status,
      },
      signatures: version.signatures.map((s: any) => ({
        partyId: s.partyId.toString(),
        userId: s.userId.toString(),
        signedAt: s.signedAt,
        signature: s.signature,
        signatureHash: s.signatureHash,
        certificate: s.certificate,
        algorithm: s.algorithm,
        verified: s.verified,
      })),
      createdBy: version.createdBy
        ? {
          userId: version.createdBy.userId.toString(),
          companyId: version.createdBy.companyId.toString(),
        }
        : undefined,
      reason: version.reason,
      amendmentId: version.amendmentId?.toString(),
      createdAt: version.createdAt,
    };
  }
}
