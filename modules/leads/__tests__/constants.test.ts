import { describe, it, expect } from 'vitest';
import {
  STATUS_COLORS,
  LEAD_STATUS_OPTIONS,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  COLUMN_LABELS,
  SEARCH_DEBOUNCE_MS,
} from '../config/constants';

describe('Lead Constants', () => {
  describe('STATUS_COLORS', () => {
    it('should have a color for each status', () => {
      const expectedStatuses = [
        'new',
        'contacted',
        'qualified',
        'proposal',
        'negotiation',
        'won',
        'lost',
        'no_answer',
      ];

      expectedStatuses.forEach((status) => {
        expect(STATUS_COLORS[status as keyof typeof STATUS_COLORS]).toBeDefined();
        expect(STATUS_COLORS[status as keyof typeof STATUS_COLORS]).toMatch(/^badge-/);
      });
    });

    it('should use badge CSS classes', () => {
      Object.values(STATUS_COLORS).forEach((color) => {
        expect(color).toMatch(/^badge-(primary|secondary|info|success|warning|error)$/);
      });
    });
  });

  describe('LEAD_STATUS_OPTIONS', () => {
    it('should have 8 status options', () => {
      expect(LEAD_STATUS_OPTIONS).toHaveLength(8);
    });

    it('should have French labels', () => {
      const frenchLabels = [
        'Nouveau',
        'Contacte',
        'Qualifie',
        'Proposition envoyee',
        'Negociation',
        'Gagne',
        'Perdu',
        'Pas de reponse',
      ];

      LEAD_STATUS_OPTIONS.forEach((option, index) => {
        expect(option.label).toBe(frenchLabels[index]);
      });
    });

    it('should have valid status values', () => {
      const validValues = [
        'new',
        'contacted',
        'qualified',
        'proposal',
        'negotiation',
        'won',
        'lost',
        'no_answer',
      ];

      LEAD_STATUS_OPTIONS.forEach((option, index) => {
        expect(option.value).toBe(validValues[index]);
      });
    });
  });

  describe('Pagination constants', () => {
    it('should have default page size of 20', () => {
      expect(DEFAULT_PAGE_SIZE).toBe(20);
    });

    it('should have valid page size options', () => {
      expect(PAGE_SIZE_OPTIONS).toEqual([20, 50, 100]);
    });

    it('should include default page size in options', () => {
      expect(PAGE_SIZE_OPTIONS).toContain(DEFAULT_PAGE_SIZE);
    });
  });

  describe('COLUMN_LABELS', () => {
    it('should have French labels for all columns', () => {
      expect(COLUMN_LABELS.name).toBe('Nom');
      expect(COLUMN_LABELS.email).toBe('Email');
      expect(COLUMN_LABELS.phone).toBe('Telephone');
      expect(COLUMN_LABELS.company).toBe('Entreprise');
      expect(COLUMN_LABELS.status).toBe('Statut');
      expect(COLUMN_LABELS.assignee).toBe('Commercial');
      expect(COLUMN_LABELS.updatedAt).toBe('Mis a jour');
    });

    it('should have empty labels for selection and actions', () => {
      expect(COLUMN_LABELS.selection).toBe('');
      expect(COLUMN_LABELS.actions).toBe('');
    });
  });

  describe('SEARCH_DEBOUNCE_MS', () => {
    it('should be 300ms', () => {
      expect(SEARCH_DEBOUNCE_MS).toBe(300);
    });

    it('should be a reasonable debounce value (100-500ms)', () => {
      expect(SEARCH_DEBOUNCE_MS).toBeGreaterThanOrEqual(100);
      expect(SEARCH_DEBOUNCE_MS).toBeLessThanOrEqual(500);
    });
  });
});
