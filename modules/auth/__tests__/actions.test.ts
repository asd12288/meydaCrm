import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redirect } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn(() =>
    Promise.resolve({
      get: vi.fn((key: string) => {
        if (key === 'x-forwarded-for') return '127.0.0.1';
        return null;
      }),
    })
  ),
}));

// Mock rate limiter
vi.mock('@/lib/rate-limit', () => ({
  loginRateLimiter: {
    limit: vi.fn(() => Promise.resolve({ success: true })),
  },
}));

// Mock Supabase client
const mockSupabaseAuth = {
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
};

const mockSupabaseFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: mockSupabaseAuth,
      from: mockSupabaseFrom,
    })
  ),
}));

// Mock lib/auth for normalizeProfile
vi.mock('@/lib/auth', () => ({
  normalizeProfile: vi.fn((profile) => ({
    id: profile.id,
    displayName: profile.display_name,
    role: profile.role,
    avatar: profile.avatar,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  })),
}));

// Import after mocks are set up
import {
  login,
  logout,
  getCurrentUser,
  requireAuth,
  requireAdmin,
  requireDeveloper,
  requireAdminOrDeveloper,
} from '../lib/actions';
import { loginRateLimiter } from '@/lib/rate-limit';

describe('Auth Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('returns error when rate limited', async () => {
      vi.mocked(loginRateLimiter.limit).mockResolvedValueOnce({
        success: false,
        remaining: 0,
        reset: Date.now() + 60000,
        limit: 5,
        pending: Promise.resolve(),
      });

      const formData = new FormData();
      formData.set('username', 'testuser');
      formData.set('password', 'password123');

      const result = await login(formData);

      expect(result).toEqual({
        error: 'Trop de tentatives. Réessayez dans une minute.',
      });
    });

    it('returns error for invalid username format', async () => {
      vi.mocked(loginRateLimiter.limit).mockResolvedValueOnce({
        success: true,
        remaining: 4,
        reset: Date.now() + 60000,
        limit: 5,
        pending: Promise.resolve(),
      });

      const formData = new FormData();
      formData.set('username', 'ab'); // Too short (min 3 chars)
      formData.set('password', 'password123');

      const result = await login(formData);

      expect(result?.error).toContain('Minimum 3');
    });

    it('returns error for missing password', async () => {
      vi.mocked(loginRateLimiter.limit).mockResolvedValueOnce({
        success: true,
        remaining: 4,
        reset: Date.now() + 60000,
        limit: 5,
        pending: Promise.resolve(),
      });

      const formData = new FormData();
      formData.set('username', 'testuser');
      formData.set('password', '');

      const result = await login(formData);

      expect(result?.error).toBe('Mot de passe requis');
    });

    it('returns error for invalid credentials', async () => {
      vi.mocked(loginRateLimiter.limit).mockResolvedValueOnce({
        success: true,
        remaining: 4,
        reset: Date.now() + 60000,
        limit: 5,
        pending: Promise.resolve(),
      });

      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      const formData = new FormData();
      formData.set('username', 'testuser');
      formData.set('password', 'wrongpassword');

      const result = await login(formData);

      expect(result).toEqual({
        error: 'Identifiant ou mot de passe incorrect',
      });
    });

    it('converts username to email format correctly', async () => {
      vi.mocked(loginRateLimiter.limit).mockResolvedValueOnce({
        success: true,
        remaining: 4,
        reset: Date.now() + 60000,
        limit: 5,
        pending: Promise.resolve(),
      });

      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: 'test-id' }, session: {} },
        error: null,
      });

      const formData = new FormData();
      formData.set('username', 'TestUser');
      formData.set('password', 'password123');

      await login(formData).catch(() => {}); // Ignore redirect error

      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'testuser@crm.local',
        password: 'password123',
      });
    });
  });

  describe('logout', () => {
    it('signs out and redirects to login', async () => {
      mockSupabaseAuth.signOut.mockResolvedValueOnce({ error: null });

      await logout().catch(() => {}); // Ignore redirect error

      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith('/login');
    });
  });

  describe('getCurrentUser', () => {
    it('returns null when not authenticated', async () => {
      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });

    it('returns user with profile when authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@crm.local' };
      const mockProfile = {
        id: 'user-123',
        display_name: 'Test User',
        role: 'admin',
        avatar: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockProfile, error: null }),
      });

      const result = await getCurrentUser();

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@crm.local',
        profile: {
          id: 'user-123',
          displayName: 'Test User',
          role: 'admin',
          avatar: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      });
    });

    it('returns user with null profile when profile not found', async () => {
      const mockUser = { id: 'user-123', email: 'test@crm.local' };

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
      });

      const result = await getCurrentUser();

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@crm.local',
        profile: null,
      });
    });
  });

  describe('requireAuth', () => {
    it('redirects to login when not authenticated', async () => {
      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      await requireAuth().catch(() => {});

      expect(redirect).toHaveBeenCalledWith('/login');
    });

    it('returns user when authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@crm.local' };
      const mockProfile = {
        id: 'user-123',
        display_name: 'Test User',
        role: 'admin',
        avatar: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockProfile, error: null }),
      });

      const result = await requireAuth();

      expect(result.id).toBe('user-123');
    });
  });

  describe('requireAdmin', () => {
    it('redirects to dashboard when not admin', async () => {
      const mockUser = { id: 'user-123', email: 'test@crm.local' };
      const mockProfile = {
        id: 'user-123',
        display_name: 'Test User',
        role: 'sales', // Not admin
        avatar: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockProfile, error: null }),
      });

      await requireAdmin().catch(() => {});

      expect(redirect).toHaveBeenCalledWith('/dashboard');
    });

    it('returns user when admin', async () => {
      const mockUser = { id: 'user-123', email: 'test@crm.local' };
      const mockProfile = {
        id: 'user-123',
        display_name: 'Test User',
        role: 'admin',
        avatar: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockProfile, error: null }),
      });

      const result = await requireAdmin();

      expect(result.profile?.role).toBe('admin');
    });
  });

  describe('requireDeveloper', () => {
    it('redirects to dashboard when not developer', async () => {
      const mockUser = { id: 'user-123', email: 'test@crm.local' };
      const mockProfile = {
        id: 'user-123',
        display_name: 'Test User',
        role: 'sales',
        avatar: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockProfile, error: null }),
      });

      await requireDeveloper().catch(() => {});

      expect(redirect).toHaveBeenCalledWith('/dashboard');
    });

    it('returns user when developer', async () => {
      const mockUser = { id: 'user-123', email: 'test@crm.local' };
      const mockProfile = {
        id: 'user-123',
        display_name: 'Test User',
        role: 'developer',
        avatar: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockProfile, error: null }),
      });

      const result = await requireDeveloper();

      expect(result.profile?.role).toBe('developer');
    });
  });

  describe('requireAdminOrDeveloper', () => {
    it('allows admin', async () => {
      const mockUser = { id: 'user-123', email: 'test@crm.local' };
      const mockProfile = {
        id: 'user-123',
        display_name: 'Test User',
        role: 'admin',
        avatar: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockProfile, error: null }),
      });

      const result = await requireAdminOrDeveloper();

      expect(result.profile?.role).toBe('admin');
    });

    it('allows developer', async () => {
      const mockUser = { id: 'user-123', email: 'test@crm.local' };
      const mockProfile = {
        id: 'user-123',
        display_name: 'Test User',
        role: 'developer',
        avatar: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockProfile, error: null }),
      });

      const result = await requireAdminOrDeveloper();

      expect(result.profile?.role).toBe('developer');
    });

    it('redirects sales to dashboard', async () => {
      const mockUser = { id: 'user-123', email: 'test@crm.local' };
      const mockProfile = {
        id: 'user-123',
        display_name: 'Test User',
        role: 'sales',
        avatar: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockProfile, error: null }),
      });

      await requireAdminOrDeveloper().catch(() => {});

      expect(redirect).toHaveBeenCalledWith('/dashboard');
    });
  });
});
