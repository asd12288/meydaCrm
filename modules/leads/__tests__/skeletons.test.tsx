import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  LeadsTableSkeleton,
  LeadsFiltersSkeleton,
  LeadsPaginationSkeleton,
  LeadsPageSkeleton,
} from '../ui/leads-table-skeleton';

describe('Skeleton Components', () => {
  describe('LeadsTableSkeleton', () => {
    it('should render without crashing', () => {
      render(<LeadsTableSkeleton />);
      // Should have skeleton elements
      const skeletons = document.querySelectorAll('.skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render 10 skeleton rows', () => {
      render(<LeadsTableSkeleton />);
      const skeletonRows = document.querySelectorAll('.skeleton-row');
      expect(skeletonRows).toHaveLength(10);
    });
  });

  describe('LeadsFiltersSkeleton', () => {
    it('should render without crashing', () => {
      render(<LeadsFiltersSkeleton />);
      const skeletons = document.querySelectorAll('.skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render 3 filter skeletons', () => {
      render(<LeadsFiltersSkeleton />);
      const container = document.querySelector('.flex');
      const skeletons = container?.querySelectorAll('.skeleton');
      expect(skeletons).toHaveLength(3);
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

      // Should have filter skeletons
      const filterSkeletons = document.querySelectorAll('.mb-4 .skeleton');
      expect(filterSkeletons.length).toBeGreaterThan(0);

      // Should have table skeleton rows
      const skeletonRows = document.querySelectorAll('.skeleton-row');
      expect(skeletonRows).toHaveLength(10);
    });
  });
});
