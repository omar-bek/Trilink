import { ContractVersion, IContractVersion } from './version.schema';
import mongoose from 'mongoose';

export class ContractVersionRepository {
  /**
   * Create a new version snapshot
   */
  async create(data: Partial<IContractVersion>): Promise<IContractVersion> {
    const version = new ContractVersion(data);
    return await version.save();
  }

  /**
   * Find all versions for a contract, ordered by version number
   */
  async findByContractId(contractId: string): Promise<IContractVersion[]> {
    return await ContractVersion.find({ contractId: new mongoose.Types.ObjectId(contractId) })
      .populate('createdBy.userId', 'email firstName lastName')
      .populate('createdBy.companyId', 'name')
      .populate('snapshot.parties.companyId', 'name')
      .populate('snapshot.parties.userId', 'email firstName lastName')
      .populate('signatures.userId', 'email firstName lastName')
      .sort({ version: -1 }) // Latest first
      .exec();
  }

  /**
   * Find a specific version by contract ID and version number
   */
  async findByVersion(
    contractId: string,
    versionNumber: number
  ): Promise<IContractVersion | null> {
    return await ContractVersion.findOne({
      contractId: new mongoose.Types.ObjectId(contractId),
      version: versionNumber,
    })
      .populate('createdBy.userId', 'email firstName lastName')
      .populate('createdBy.companyId', 'name')
      .populate('snapshot.parties.companyId', 'name')
      .populate('snapshot.parties.userId', 'email firstName lastName')
      .populate('signatures.userId', 'email firstName lastName')
      .exec();
  }

  /**
   * Get the latest version number for a contract
   */
  async getLatestVersionNumber(contractId: string): Promise<number> {
    const latest = await ContractVersion.findOne({
      contractId: new mongoose.Types.ObjectId(contractId),
    })
      .sort({ version: -1 })
      .select('version')
      .exec();

    return latest ? latest.version : 0;
  }

  /**
   * Check if a version exists
   */
  async versionExists(contractId: string, versionNumber: number): Promise<boolean> {
    const count = await ContractVersion.countDocuments({
      contractId: new mongoose.Types.ObjectId(contractId),
      version: versionNumber,
    });
    return count > 0;
  }
}
