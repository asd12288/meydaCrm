import { render, cleanup } from '@testing-library/react';
import { describe, expect, it, afterEach } from 'vitest';
import {
  LeadsFiltersSkeleton,
  LeadsPageSkeleton,
  LeadsPaginationSkeleton,
  LeadsTableSkeleton,
} from '../ui/leads-table-skeleton';

describe('Skeleton Components', () => {
  // Clean up after each test to prevent DOM pollution
  afterEach(() => {
    cleanup();
  });

  describe('LeadsTableSkeleton', () => {
    it('should render without crashing', () => {
      render(<LeadsTableSkeleton />);
      // Should have skeleton elements
      const skeletons = document.querySelectorAll('.skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render skeleton rows in table', () => {
      render(<LeadsTableSkeleton />);
      // TableSkeleton uses actual <tr> elements
      const tableRows = document.querySelectorAll('tbody tr');
      expect(tableRows.length).toBe(10);
    });
  });

  describe('LeadsFiltersSkeleton', () => {
    it('should render without crashing', () => {
      render(<LeadsFiltersSkeleton />);
      const skeletons = document.querySelectorAll('.skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render filter skeleton elements', () => {
      render(<LeadsFiltersSkeleton />);
      // The filters are direct children with .skeleton class
      const skeletons = document.querySelectorAll('.skeleton');
      expect(skeletons.length).toBe(3);
    });
  });

  describe('LeadsPaginationSkeleton', () => {
    it('should render without crashing', () => {
      render(<LeadsPaginationSkeleton />);
      const skeletons = document.querySelectorAll('.skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('LeadsPageSkeleton', () => {
    it('should render all skeleton components', () => {
      render(<LeadsPageSkeleton />);

      // Should have filter skeletons (more than 0)
      const allSkeletons = document.querySelectorAll('.skeleton');
      expect(allSkeletons.length).toBeGreaterThan(0);

      // Should have table rows
      const tableRows = document.querySelectorAll('tbody tr');
      expect(tableRows.length).toBe(10);
    });
  });
});
