import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSubmissionUseCase } from '../../../../../src/application/usecases/Submission/CreateSubmissionUseCase';
import type { ISubmissionRepository } from '../../../../../src/infrastructure/submissions/interfaces/ISubmissionRepository';

const mockSave = vi.fn();
const mockFindByEmail = vi.fn();

const mockRepo: ISubmissionRepository = {
  save: mockSave,
  findAll: vi.fn(),
  findById: vi.fn(),
  findByEmail: mockFindByEmail,
  update: vi.fn(),
  deleteById: vi.fn(),
  saveAll: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFindByEmail.mockResolvedValue(null);
});

describe('CreateSubmissionUseCase', () => {
  it('saves the entity and returns a response with correct fields', async () => {
    mockSave.mockResolvedValue(undefined);
    const useCase = new CreateSubmissionUseCase(mockRepo);

    const result = await useCase.execute({
      name: 'Ivan Ivanov',
      email: 'ivan@example.com',
      message: 'Hello world',
    });

    expect(mockSave).toHaveBeenCalledOnce();
    expect(result.name).toBe('Ivan Ivanov');
    expect(result.email).toBe('ivan@example.com');
    expect(result.message).toBe('Hello world');
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeDefined();
    expect(result.status).toBe('Open');
  });

  it('lowercases the email', async () => {
    mockSave.mockResolvedValue(undefined);
    const useCase = new CreateSubmissionUseCase(mockRepo);

    const result = await useCase.execute({
      name: 'Ivan',
      email: 'IVAN@EXAMPLE.COM',
      message: 'Test',
    });

    expect(result.email).toBe('ivan@example.com');
  });

  it('trims whitespace from name and message', async () => {
    mockSave.mockResolvedValue(undefined);
    const useCase = new CreateSubmissionUseCase(mockRepo);

    const result = await useCase.execute({
      name: '  Ivan  ',
      email: 'ivan@example.com',
      message: '  Hello  ',
    });

    expect(result.name).toBe('Ivan');
    expect(result.message).toBe('Hello');
  });

  it('stores trimmed city and country when provided', async () => {
    mockSave.mockResolvedValue(undefined);
    const useCase = new CreateSubmissionUseCase(mockRepo);

    const result = await useCase.execute({
      name: 'Ivan',
      email: 'ivan@example.com',
      message: 'Hello',
      city: '  Sofia  ',
      country: '  Bulgaria  ',
    });

    expect(result.city).toBe('Sofia');
    expect(result.country).toBe('Bulgaria');
  });

  it('throws when name is missing', async () => {
    const useCase = new CreateSubmissionUseCase(mockRepo);

    await expect(
      useCase.execute({ name: '', email: 'ivan@example.com', message: 'Hi' }),
    ).rejects.toThrow('Name is required');

    expect(mockSave).not.toHaveBeenCalled();
  });

  it('throws when name is only whitespace', async () => {
    const useCase = new CreateSubmissionUseCase(mockRepo);

    await expect(
      useCase.execute({ name: '   ', email: 'ivan@example.com', message: 'Hi' }),
    ).rejects.toThrow('Name is required');
  });

  it('throws when email is missing', async () => {
    const useCase = new CreateSubmissionUseCase(mockRepo);

    await expect(
      useCase.execute({ name: 'Ivan', email: '', message: 'Hi' }),
    ).rejects.toThrow('Email is required');
  });

  it('throws when email format is invalid', async () => {
    const useCase = new CreateSubmissionUseCase(mockRepo);

    await expect(
      useCase.execute({ name: 'Ivan', email: 'not-an-email', message: 'Hi' }),
    ).rejects.toThrow('Invalid email format');
  });

  it('throws when message is missing', async () => {
    const useCase = new CreateSubmissionUseCase(mockRepo);

    await expect(
      useCase.execute({ name: 'Ivan', email: 'ivan@example.com', message: '' }),
    ).rejects.toThrow('Message is required');
  });

  it('throws when message is only whitespace', async () => {
    const useCase = new CreateSubmissionUseCase(mockRepo);

    await expect(
      useCase.execute({ name: 'Ivan', email: 'ivan@example.com', message: '   ' }),
    ).rejects.toThrow('Message is required');
  });

  it('throws a friendly error when the email is already used', async () => {
    mockFindByEmail.mockResolvedValue({
      id: 'sub-1',
      name: 'Existing User',
      email: 'ivan@example.com',
      message: 'Existing message',
      status: 'Open',
      createdAt: '2024-01-01T10:00:00.000Z',
    });
    const useCase = new CreateSubmissionUseCase(mockRepo);

    await expect(
      useCase.execute({ name: 'Ivan', email: 'ivan@example.com', message: 'Hi' }),
    ).rejects.toThrow('A submission with this email already exists');

    expect(mockSave).not.toHaveBeenCalled();
  });
});
