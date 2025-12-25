import { describe, it, expect } from 'vitest';
import { ROLES, ROLE_LABELS, getRoleLabel } from '../roles';
import { TOAST } from '../toast-messages';
import { ICON_SIZE } from '../icon-sizes';
import { TEXTAREA_ROWS } from '../form-dimensions';
import { DISPLAY_LIMITS } from '../display-limits';
import { TIMING } from '../timing';

describe('Role Constants', () => {
  it('should have all required roles', () => {
    expect(ROLES.ADMIN).toBe('admin');
    expect(ROLES.SALES).toBe('sales');
    expect(ROLES.DEVELOPER).toBe('developer');
  });

  it('should have French labels for all roles', () => {
    expect(ROLE_LABELS.admin).toBe('Administrateur');
    expect(ROLE_LABELS.sales).toBe('Commercial');
    expect(ROLE_LABELS.developer).toBe('Développeur');
  });

  it('getRoleLabel should return label or fallback', () => {
    expect(getRoleLabel('admin')).toBe('Administrateur');
    expect(getRoleLabel('sales')).toBe('Commercial');
    expect(getRoleLabel('unknown')).toBe('unknown');
  });
});

describe('Toast Messages', () => {
  describe('Success messages', () => {
    it('should have all success messages in French', () => {
      expect(TOAST.LEAD_DELETED).toBe('Lead supprimé');
      expect(TOAST.COMMENT_ADDED).toBe('Commentaire ajouté');
      expect(TOAST.USER_CREATED).toBe('Utilisateur créé avec succès');
      expect(TOAST.MEETING_CREATED).toBe('Rendez-vous créé');
      expect(TOAST.NOTE_DELETED).toBe('Note supprimée');
      expect(TOAST.BANNER_CREATED).toBe('Annonce créée avec succès');
      expect(TOAST.TICKET_CREATED).toBe('Ticket créé avec succès');
    });

    it('should have proper French accents', () => {
      // Verify accents are correct (not typos)
      expect(TOAST.NOTE_DELETED).toContain('supprimée'); // Not 'supprimee'
      expect(TOAST.PAYMENT_ERROR).toContain('réessayer'); // Not 'reessayer'
      expect(TOAST.LEAD_TRANSFERRED).toContain('transféré'); // Has accent
    });
  });

  describe('Pluralization helpers', () => {
    it('LEADS_ASSIGNED should handle singular', () => {
      expect(TOAST.LEADS_ASSIGNED(1)).toBe('1 lead assigné');
    });

    it('LEADS_ASSIGNED should handle plural', () => {
      expect(TOAST.LEADS_ASSIGNED(5)).toBe('5 leads assignés');
      expect(TOAST.LEADS_ASSIGNED(100)).toBe('100 leads assignés');
    });

    it('LEADS_PARTIAL_ASSIGNED should format correctly', () => {
      expect(TOAST.LEADS_PARTIAL_ASSIGNED(3, 5)).toBe('3/5 leads assignés');
      expect(TOAST.LEADS_PARTIAL_ASSIGNED(0, 10)).toBe('0/10 leads assignés');
    });
  });

  describe('Error messages', () => {
    it('should have all error messages', () => {
      expect(TOAST.GENERIC_ERROR).toBe('Une erreur est survenue');
      expect(TOAST.ERROR_DELETE).toBe('Erreur lors de la suppression');
      expect(TOAST.ERROR_ASSIGN).toBe("Erreur lors de l'assignation");
    });
  });
});

describe('Icon Sizes', () => {
  it('should have consistent size progression', () => {
    expect(ICON_SIZE.XS).toBeLessThan(ICON_SIZE.SM);
    expect(ICON_SIZE.SM).toBeLessThan(ICON_SIZE.MD);
    expect(ICON_SIZE.MD).toBeLessThan(ICON_SIZE.LG);
    expect(ICON_SIZE.LG).toBeLessThan(ICON_SIZE.XL);
    expect(ICON_SIZE.XL).toBeLessThan(ICON_SIZE.XXL);
  });

  it('should have standard pixel values', () => {
    expect(ICON_SIZE.XS).toBe(14);
    expect(ICON_SIZE.SM).toBe(16);
    expect(ICON_SIZE.MD).toBe(18);
    expect(ICON_SIZE.LG).toBe(20);
    expect(ICON_SIZE.XL).toBe(24);
    expect(ICON_SIZE.XXL).toBe(32);
  });

  it('should only contain positive integers', () => {
    Object.values(ICON_SIZE).forEach((size) => {
      expect(Number.isInteger(size)).toBe(true);
      expect(size).toBeGreaterThan(0);
    });
  });
});

describe('Form Dimensions', () => {
  describe('Textarea rows', () => {
    it('should have reasonable row counts', () => {
      expect(TEXTAREA_ROWS.SINGLE_LINE).toBe(1);
      expect(TEXTAREA_ROWS.COMMENT).toBeGreaterThanOrEqual(1);
      expect(TEXTAREA_ROWS.MEETING_NOTES).toBeGreaterThanOrEqual(2);
      expect(TEXTAREA_ROWS.LEAD_NOTES).toBeGreaterThanOrEqual(3);
      expect(TEXTAREA_ROWS.NOTE_CONTENT).toBeGreaterThanOrEqual(4);
    });

    it('should only contain positive integers', () => {
      Object.values(TEXTAREA_ROWS).forEach((rows) => {
        expect(Number.isInteger(rows)).toBe(true);
        expect(rows).toBeGreaterThan(0);
      });
    });
  });
});

describe('Display Limits', () => {
  it('should have positive integer values', () => {
    Object.values(DISPLAY_LIMITS).forEach((value) => {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
    });
  });

  it('should have reasonable dashboard widget limits', () => {
    expect(DISPLAY_LIMITS.LEADS_STATS_CARD).toBeLessThanOrEqual(10);
    expect(DISPLAY_LIMITS.TOP_PERFORMERS).toBeLessThanOrEqual(10);
    expect(DISPLAY_LIMITS.TOP_TEAM_MEMBERS).toBeLessThanOrEqual(15);
    expect(DISPLAY_LIMITS.RECENT_ACTIVITIES).toBeLessThanOrEqual(10);
    expect(DISPLAY_LIMITS.RECENT_IMPORTS).toBeLessThanOrEqual(10);
  });

  it('should have reasonable import/mapping limits', () => {
    expect(DISPLAY_LIMITS.SAMPLE_ROWS_PREVIEW).toBeLessThanOrEqual(10);
    expect(DISPLAY_LIMITS.MAPPING_SAMPLE_VALUES).toBeLessThanOrEqual(5);
    expect(DISPLAY_LIMITS.IMPORT_ROWS_PREVIEW).toBeLessThanOrEqual(50);
  });

  it('should have reasonable file processing limits', () => {
    expect(DISPLAY_LIMITS.FILE_TYPE_DETECTION_BYTES).toBeGreaterThanOrEqual(1024);
    expect(DISPLAY_LIMITS.FILE_TYPE_DETECTION_BYTES).toBeLessThanOrEqual(16384);
  });
});

describe('Timing Constants', () => {
  describe('Form success delays', () => {
    it('should have positive millisecond values', () => {
      expect(TIMING.SUCCESS_DELAY_DEFAULT).toBeGreaterThan(0);
      expect(TIMING.SUCCESS_DELAY_PASSWORD).toBeGreaterThan(0);
      expect(TIMING.SUCCESS_DELAY_QUICK).toBeGreaterThan(0);
    });

    it('should have password delay >= default delay', () => {
      expect(TIMING.SUCCESS_DELAY_PASSWORD).toBeGreaterThanOrEqual(
        TIMING.SUCCESS_DELAY_DEFAULT
      );
    });

    it('should have quick delay <= default delay', () => {
      expect(TIMING.SUCCESS_DELAY_QUICK).toBeLessThanOrEqual(
        TIMING.SUCCESS_DELAY_DEFAULT
      );
    });
  });

  describe('Animation delays', () => {
    it('should have reasonable animation durations (< 1 second)', () => {
      expect(TIMING.UPLOAD_PROGRESS_CLEAR).toBeLessThan(1000);
      expect(TIMING.KANBAN_DROP_ANIMATION).toBeLessThan(1000);
      expect(TIMING.COLUMN_PULSE_ANIMATION).toBeLessThan(1000);
    });

    it('should have non-negative focus delay', () => {
      expect(TIMING.FOCUS_DELAY).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Debounce values', () => {
    it('should have reasonable debounce for search', () => {
      expect(TIMING.SEARCH_DEBOUNCE).toBeGreaterThanOrEqual(100);
      expect(TIMING.SEARCH_DEBOUNCE).toBeLessThanOrEqual(500);
    });
  });
});
