import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateSubmissionUseCase } from '../../../../../src/application/usecases/Submission/UpdateSubmissionUseCase';
import type { ISubmissionRepository } from '../../../../../src/infrastructure/submissions/interfaces/ISubmissionRepository';
import type { Submission } from '../../../../../src/domain/entities/Submission/Submission';

const mockFindById = vi.fn();
const mockUpdate = vi.fn();

const mockRepo: ISubmissionRepository = {
  save: vi.fn(),
  findAll: vi.fn(),
  findById: mockFindById,
  findByEmail: vi.fn(),
  update: mockUpdate,
  deleteById: vi.fn(),
  saveAll: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

const existing: Submission = {
  id: 'sub-1',
  name: 'Old Name',
  email: 'old@example.com',
  message: 'Old message',
  status: 'Open',
  createdAt: '2024-01-01T10:00:00.000Z',
};

describe('UpdateSubmissionUseCase', () => {
  it('updates name, email and message while preserving id and createdAt', async () => {
    mockFindById.mockResolvedValue({ ...existing });
    mockUpdate.mockResolvedValue({
      ...existing,
      name: 'New Name',
      email: 'new@example.com',
      message: 'New message',
    });
    const useCase = new UpdateSubmissionUseCase(mockRepo);

    const result = await useCase.execute('sub-1', {
      name: 'New Name',
      email: 'new@example.com',
      message: 'New message',
    });

    expect(result.id).toBe('sub-1');
    expect(result.name).toBe('New Name');
    expect(result.email).toBe('new@example.com');
    expect(result.message).toBe('New message');
    expect(result.createdAt).toBe('2024-01-01T10:00:00.000Z');
  });

  it('persists the update via repository.update', async () => {
    mockFindById.mockResolvedValue({ ...existing });
    mockUpdate.mockResolvedValue({
      ...existing,
      name: 'New Name',
      email: 'new@example.com',
      message: 'Updated',
    });
    const useCase = new UpdateSubmissionUseCase(mockRepo);

    await useCase.execute('sub-1', {
      name: 'New Name',
      email: 'new@example.com',
      message: 'Updated',
    });

    expect(mockUpdate).toHaveBeenCalledOnce();
    expect(mockUpdate).toHaveBeenCalledWith('sub-1', expect.objectContaining({
      name: 'New Name',
      email: 'new@example.com',
      message: 'Updated',
    }));
  });

  it('throws "Submission not found" when id does not exist', async () => {
    mockFindById.mockResolvedValue(null);
    const useCase = new UpdateSubmissionUseCase(mockRepo);

    await expect(
      useCase.execute('does-not-exist', {
        name: 'X',
        email: 'x@x.com',
        message: 'X',
      }),
    ).rejects.toThrow('Submission not found');

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('throws validation error when updated data is invalid', async () => {
    mockFindById.mockResolvedValue({ ...existing });
    const useCase = new UpdateSubmissionUseCase(mockRepo);

    await expect(
      useCase.execute('sub-1', {
        name: '',
        email: 'valid@example.com',
        message: 'Some message',
      }),
    ).rejects.toThrow('Name is required');

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('lowercases the new email', async () => {
    mockFindById.mockResolvedValue({ ...existing });
    mockUpdate.mockResolvedValue({
      ...existing,
      name: 'Ivan',
      email: 'ivan@example.com',
      message: 'Hello',
    });
    const useCase = new UpdateSubmissionUseCase(mockRepo);

    const result = await useCase.execute('sub-1', {
      name: 'Ivan',
      email: 'IVAN@EXAMPLE.COM',
      message: 'Hello',
    });

    expect(result.email).toBe('ivan@example.com');
    expect(mockUpdate).toHaveBeenCalledWith('sub-1', expect.objectContaining({
      email: 'ivan@example.com',
    }));
  });

  it('passes city, country and status through to the repository', async () => {
    mockFindById.mockResolvedValue({ ...existing });
    mockUpdate.mockResolvedValue({
      ...existing,
      city: 'Sofia',
      country: 'Bulgaria',
      status: 'Approved',
    });
    const useCase = new UpdateSubmissionUseCase(mockRepo);

    const result = await useCase.execute('sub-1', {
      name: 'Old Name',
      email: 'old@example.com',
      message: 'Old message',
      city: 'Sofia',
      country: 'Bulgaria',
      status: 'Approved',
    });

    expect(mockUpdate).toHaveBeenCalledWith('sub-1', expect.objectContaining({
      city: 'Sofia',
      country: 'Bulgaria',
      status: 'Approved',
    }));
    expect(result.status).toBe('Approved');
  });
});
