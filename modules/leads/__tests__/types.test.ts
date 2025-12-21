import { describe, it, expect } from 'vitest';
import { leadFiltersSchema, updateStatusSchema, bulkAssignSchema } from '../types';

describe('Lead Zod Schemas', () => {
  describe('leadFiltersSchema', () => {
    it('should parse valid filters with defaults', () => {
      const result = leadFiltersSchema.parse({});

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.sortBy).toBe('updated_at');
      expect(result.sortOrder).toBe('desc');
    });

    it('should parse page as number from string', () => {
      const result = leadFiltersSchema.parse({ page: '5' });
      expect(result.page).toBe(5);
    });

    it('should parse pageSize as number from string', () => {
      const result = leadFiltersSchema.parse({ pageSize: '50' });
      expect(result.pageSize).toBe(50);
    });

    it('should reject page less than 1', () => {
      expect(() => leadFiltersSchema.parse({ page: '0' })).toThrow();
      expect(() => leadFiltersSchema.parse({ page: '-1' })).toThrow();
    });

    it('should reject pageSize outside valid range', () => {
      expect(() => leadFiltersSchema.parse({ pageSize: '5' })).toThrow(); // min is 10
      expect(() => leadFiltersSchema.parse({ pageSize: '501' })).toThrow(); // max is 500
    });

    it('should accept pageSize up to 500 for kanban view', () => {
      const result = leadFiltersSchema.parse({ pageSize: '200' });
      expect(result.pageSize).toBe(200);

      const result2 = leadFiltersSchema.parse({ pageSize: '500' });
      expect(result2.pageSize).toBe(500);
    });

    it('should accept valid search string', () => {
      const result = leadFiltersSchema.parse({ search: 'test search' });
      expect(result.search).toBe('test search');
    });

    it('should accept valid status', () => {
      const result = leadFiltersSchema.parse({ status: 'new' });
      expect(result.status).toBe('new');
    });

    it('should accept valid UUID for assignedTo', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = leadFiltersSchema.parse({ assignedTo: uuid });
      expect(result.assignedTo).toBe(uuid);
    });

    it('should accept valid sortBy values', () => {
      const validSortBy = ['updated_at', 'created_at', 'last_name', 'company', 'status'];

      validSortBy.forEach((sortBy) => {
        const result = leadFiltersSchema.parse({ sortBy });
        expect(result.sortBy).toBe(sortBy);
      });
    });

    it('should reject invalid sortBy value', () => {
      expect(() => leadFiltersSchema.parse({ sortBy: 'invalid' })).toThrow();
    });

    it('should accept valid sortOrder values', () => {
      expect(leadFiltersSchema.parse({ sortOrder: 'asc' }).sortOrder).toBe('asc');
      expect(leadFiltersSchema.parse({ sortOrder: 'desc' }).sortOrder).toBe('desc');
    });
  });

  describe('updateStatusSchema', () => {
    it('should parse valid status update', () => {
      const result = updateStatusSchema.parse({
        leadId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'rdv',
      });

      expect(result.leadId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.status).toBe('rdv');
    });

    it('should reject invalid UUID', () => {
      expect(() =>
        updateStatusSchema.parse({
          leadId: 'not-a-uuid',
          status: 'rdv',
        })
      ).toThrow();
    });

    it('should reject invalid status', () => {
      expect(() =>
        updateStatusSchema.parse({
          leadId: '550e8400-e29b-41d4-a716-446655440000',
          status: 'invalid_status',
        })
      ).toThrow();
    });

    it('should accept all valid statuses', () => {
      const validStatuses = [
        'new', // Legacy - still valid for existing leads
        'rdv',
        'no_answer_1',
        'no_answer_2',
        'wrong_number',
        'not_interested',
        'deposit',
        'callback',
        'relance',
        'mail',
      ];

      validStatuses.forEach((status) => {
        const result = updateStatusSchema.parse({
          leadId: '550e8400-e29b-41d4-a716-446655440000',
          status,
        });
        expect(result.status).toBe(status);
      });
    });
  });

  describe('bulkAssignSchema', () => {
    it('should parse valid bulk assign payload', () => {
      const result = bulkAssignSchema.parse({
        leadIds: ['550e8400-e29b-41d4-a716-446655440000'],
        assigneeId: '550e8400-e29b-41d4-a716-446655440001',
      });

      expect(result.leadIds).toHaveLength(1);
      expect(result.assigneeId).toBe('550e8400-e29b-41d4-a716-446655440001');
    });

    it('should accept multiple lead IDs', () => {
      const result = bulkAssignSchema.parse({
        leadIds: [
          '550e8400-e29b-41d4-a716-446655440000',
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
        ],
        assigneeId: '550e8400-e29b-41d4-a716-446655440003',
      });

      expect(result.leadIds).toHaveLength(3);
    });

    it('should reject empty leadIds array', () => {
      expect(() =>
        bulkAssignSchema.parse({
          leadIds: [],
          assigneeId: '550e8400-e29b-41d4-a716-446655440000',
        })
      ).toThrow();
    });

    it('should reject invalid lead ID', () => {
      expect(() =>
        bulkAssignSchema.parse({
          leadIds: ['not-a-uuid'],
          assigneeId: '550e8400-e29b-41d4-a716-446655440000',
        })
      ).toThrow();
    });

    it('should reject invalid assignee ID', () => {
      expect(() =>
        bulkAssignSchema.parse({
          leadIds: ['550e8400-e29b-41d4-a716-446655440000'],
          assigneeId: 'not-a-uuid',
        })
      ).toThrow();
    });
  });
});
