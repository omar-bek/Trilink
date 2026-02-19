import { UserService } from '../../../src/modules/users/service';
import { UserRepository } from '../../../src/modules/users/repository';
import { CompanyRepository } from '../../../src/modules/companies/repository';
import { AppError } from '../../../src/middlewares/error.middleware';
import { Role } from '../../../src/config/rbac';
import { Status } from '../../../src/types/common';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Mock repositories
jest.mock('../../../src/modules/users/repository');
jest.mock('../../../src/modules/companies/repository');

describe('UserService - Unit Tests', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockCompanyRepository: jest.Mocked<CompanyRepository>;

  const testCompanyId = new mongoose.Types.ObjectId().toString();
  const testUserId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
    userService = new UserService();
    mockUserRepository = userService['repository'] as jest.Mocked<UserRepository>;
    mockCompanyRepository = userService['companyRepository'] as jest.Mocked<CompanyRepository>;
  });

  describe('createUser', () => {
    const createUserDto = {
      email: 'test@example.com',
      password: 'Password123!',
      role: Role.BUYER,
      companyId: testCompanyId,
      firstName: 'Test',
      lastName: 'User',
    };

    it('should create user successfully', async () => {
      const mockCompany = {
        _id: new mongoose.Types.ObjectId(testCompanyId),
        status: Status.APPROVED,
      } as any;

      const mockUser = {
        _id: new mongoose.Types.ObjectId(testUserId),
        ...createUserDto,
        password: 'hashedPassword',
        status: Status.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockCompanyRepository.findById.mockResolvedValue(mockCompany);
      mockUserRepository.emailExists.mockResolvedValue(false);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await userService.createUser(createUserDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.create.mock.calls[0][0].password).not.toBe(createUserDto.password);
    });

    it('should throw error if email already exists', async () => {
      mockUserRepository.emailExists.mockResolvedValue(true);

      await expect(userService.createUser(createUserDto)).rejects.toThrow(AppError);
      await expect(userService.createUser(createUserDto)).rejects.toThrow('Email already registered');
    });

    it('should throw error if company not found', async () => {
      mockUserRepository.emailExists.mockResolvedValue(false);
      mockCompanyRepository.findById.mockResolvedValue(null);

      await expect(userService.createUser(createUserDto)).rejects.toThrow(AppError);
      await expect(userService.createUser(createUserDto)).rejects.toThrow('Company not found');
    });

    it('should throw error if company not approved', async () => {
      const mockCompany = {
        _id: new mongoose.Types.ObjectId(testCompanyId),
        status: Status.PENDING,
      } as any;

      mockUserRepository.emailExists.mockResolvedValue(false);
      mockCompanyRepository.findById.mockResolvedValue(mockCompany);

      await expect(userService.createUser(createUserDto)).rejects.toThrow(AppError);
      await expect(userService.createUser(createUserDto)).rejects.toThrow('Cannot create user for unapproved company');
    });

    it('should skip company check if admin creates user', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(testUserId),
        ...createUserDto,
        password: 'hashedPassword',
        status: Status.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockUserRepository.emailExists.mockResolvedValue(false);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await userService.createUser(createUserDto, true);

      expect(result).toBeDefined();
      expect(mockCompanyRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(testUserId),
        email: 'test@example.com',
        role: Role.BUYER,
        companyId: new mongoose.Types.ObjectId(testCompanyId),
        status: Status.ACTIVE,
      } as any;

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById(testUserId);

      expect(result).toBeDefined();
      expect(result.id).toBe(testUserId);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserById(testUserId)).rejects.toThrow(AppError);
      await expect(userService.getUserById(testUserId)).rejects.toThrow('User not found');
    });

    it('should enforce company isolation', async () => {
      const differentCompanyId = new mongoose.Types.ObjectId().toString();
      const mockUser = {
        _id: new mongoose.Types.ObjectId(testUserId),
        email: 'test@example.com',
        companyId: new mongoose.Types.ObjectId(differentCompanyId),
      } as any;

      mockUserRepository.findById.mockResolvedValue(mockUser);

      await expect(
        userService.getUserById(testUserId, testCompanyId)
      ).rejects.toThrow(AppError);
      await expect(
        userService.getUserById(testUserId, testCompanyId)
      ).rejects.toThrow('Access denied: User belongs to different company');
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const plainPassword = 'Password123!';
      const hashedPassword = await bcrypt.hash(plainPassword, 12);

      const result = await userService.verifyPassword(plainPassword, hashedPassword);
      expect(result).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const plainPassword = 'Password123!';
      const wrongPassword = 'WrongPassword!';
      const hashedPassword = await bcrypt.hash(plainPassword, 12);

      const result = await userService.verifyPassword(wrongPassword, hashedPassword);
      expect(result).toBe(false);
    });
  });
});
