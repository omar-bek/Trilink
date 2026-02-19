import { Request, Response, NextFunction } from 'express';
import { UploadService } from './service';
import { UploadFileDto, FileCategory } from './types';
import { ApiResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';

export class UploadController {
  private service: UploadService;

  constructor() {
    this.service = new UploadService();
  }

  /**
   * Upload file
   * POST /api/uploads
   */
  uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file provided',
          requestId: getRequestId(req),
        });
        return;
      }

      const { category, description, entityType, entityId } = req.body as UploadFileDto;

      if (!category || !Object.values(FileCategory).includes(category as FileCategory)) {
        res.status(400).json({
          success: false,
          error: 'Invalid file category',
          requestId: getRequestId(req),
        });
        return;
      }

      const upload = await this.service.uploadFile(
        req.file,
        category as FileCategory,
        req.user.userId,
        req.user.companyId,
        description,
        entityType,
        entityId
      );

      const response: ApiResponse = {
        success: true,
        data: upload,
        requestId: getRequestId(req),
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Upload multiple files
   * POST /api/uploads/multiple
   */
  uploadMultipleFiles = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
        res.status(400).json({
          success: false,
          error: 'No files provided',
          requestId: getRequestId(req),
        });
        return;
      }

      const { category, description, entityType, entityId } = req.body as UploadFileDto;

      if (!category || !Object.values(FileCategory).includes(category as FileCategory)) {
        res.status(400).json({
          success: false,
          error: 'Invalid file category',
          requestId: getRequestId(req),
        });
        return;
      }

      const files = Array.isArray(req.files) ? req.files : [req.files];
      const uploads = await Promise.all(
        files.map((file) =>
          this.service.uploadFile(
            file,
            category as FileCategory,
            req.user!.userId,
            req.user!.companyId,
            description,
            entityType,
            entityId
          )
        )
      );

      const response: ApiResponse = {
        success: true,
        data: uploads,
        requestId: getRequestId(req),
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get upload by ID
   * GET /api/uploads/:id
   */
  getUploadById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const requesterCompanyId =
        req.user.role === 'ADMIN' || req.user.role === 'GOVERNMENT'
          ? undefined
          : req.user.companyId;

      const upload = await this.service.getUploadById(id, requesterCompanyId);

      const response: ApiResponse = {
        success: true,
        data: upload,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get uploads by company
   * GET /api/uploads
   */
  getUploads = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { category, entityType, entityId } = req.query;

      const uploads = await this.service.getUploadsByCompany(req.user.companyId, {
        category: category as FileCategory | undefined,
        entityType: entityType as string | undefined,
        entityId: entityId as string | undefined,
      });

      const response: ApiResponse = {
        success: true,
        data: uploads,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete upload
   * DELETE /api/uploads/:id
   */
  deleteUpload = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const requesterCompanyId =
        req.user.role === 'ADMIN' || req.user.role === 'GOVERNMENT'
          ? undefined
          : req.user.companyId;

      await this.service.deleteUpload(id, requesterCompanyId);

      const response: ApiResponse = {
        success: true,
        data: { message: 'Upload deleted successfully' },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get uploads by entity
   * GET /api/uploads/entity/:entityType/:entityId
   */
  getUploadsByEntity = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { entityType, entityId } = req.params;
      
      if (!['rfq', 'bid', 'contract', 'dispute'].includes(entityType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid entity type',
          requestId: getRequestId(req),
        });
        return;
      }

      const requesterCompanyId =
        req.user.role === 'ADMIN' || req.user.role === 'GOVERNMENT'
          ? undefined
          : req.user.companyId;

      const uploads = await this.service.getUploadsByEntity(
        entityType as 'rfq' | 'bid' | 'contract' | 'dispute',
        entityId,
        requesterCompanyId
      );

      const response: ApiResponse = {
        success: true,
        data: uploads,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Link upload to entity
   * POST /api/uploads/:uploadId/link
   */
  linkUploadToEntity = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { uploadId } = req.params;
      const { entityType, entityId } = req.body;

      if (!['rfq', 'bid', 'contract', 'dispute'].includes(entityType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid entity type',
          requestId: getRequestId(req),
        });
        return;
      }

      if (!entityId) {
        res.status(400).json({
          success: false,
          error: 'Entity ID is required',
          requestId: getRequestId(req),
        });
        return;
      }

      const requesterCompanyId =
        req.user.role === 'ADMIN' || req.user.role === 'GOVERNMENT'
          ? undefined
          : req.user.companyId;

      const upload = await this.service.linkUploadToEntity(
        uploadId,
        entityType as 'rfq' | 'bid' | 'contract' | 'dispute',
        entityId,
        requesterCompanyId
      );

      const response: ApiResponse = {
        success: true,
        data: upload,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
