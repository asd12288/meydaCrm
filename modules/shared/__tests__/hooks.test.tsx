import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormState } from '../hooks/use-form-state';
import { useModal } from '../ui/modal';

describe('useFormState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useFormState());

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(false);
  });

  it('sets error correctly', () => {
    const { result } = renderHook(() => useFormState());

    act(() => {
      result.current.setError('Test error message');
    });

    expect(result.current.error).toBe('Test error message');
  });

  it('clears error with resetError', () => {
    const { result } = renderHook(() => useFormState());

    act(() => {
      result.current.setError('Test error');
    });
    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.resetError();
    });
    expect(result.current.error).toBeNull();
  });

  it('sets and clears success state', () => {
    const { result } = renderHook(() => useFormState());

    act(() => {
      result.current.setSuccess(true);
    });
    expect(result.current.success).toBe(true);

    act(() => {
      result.current.resetSuccess();
    });
    expect(result.current.success).toBe(false);
  });

  it('resets all state with resetAll', () => {
    const { result } = renderHook(() => useFormState());

    act(() => {
      result.current.setError('Test error');
      result.current.setSuccess(true);
    });

    expect(result.current.error).toBe('Test error');
    expect(result.current.success).toBe(true);

    act(() => {
      result.current.resetAll();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(false);
  });

  it('handleFormSuccess sets success to true', () => {
    const { result } = renderHook(() => useFormState());

    act(() => {
      result.current.handleFormSuccess();
    });

    expect(result.current.success).toBe(true);
  });

  it('handleFormSuccess calls onSuccess after delay', () => {
    const { result } = renderHook(() => useFormState());
    const onSuccess = vi.fn();

    act(() => {
      result.current.handleFormSuccess({ onSuccess, onSuccessDelay: 500 });
    });

    expect(result.current.success).toBe(true);
    expect(onSuccess).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('handleFormSuccess uses default 1000ms delay for onSuccess', () => {
    const { result } = renderHook(() => useFormState());
    const onSuccess = vi.fn();

    act(() => {
      result.current.handleFormSuccess({ onSuccess });
    });

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(onSuccess).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('handleFormSuccess auto-resets success after autoResetDelay', () => {
    const { result } = renderHook(() => useFormState());

    act(() => {
      result.current.handleFormSuccess({ autoResetDelay: 2000 });
    });

    expect(result.current.success).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.success).toBe(false);
  });

  it('provides startTransition function', () => {
    const { result } = renderHook(() => useFormState());

    expect(typeof result.current.startTransition).toBe('function');
  });
});

describe('useModal', () => {
  it('initializes as closed with null data', () => {
    const { result } = renderHook(() => useModal());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('opens modal without data', () => {
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('opens modal with data', () => {
    const { result } = renderHook(() => useModal<{ id: string; name: string }>());

    act(() => {
      result.current.open({ id: '123', name: 'Test Item' });
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toEqual({ id: '123', name: 'Test Item' });
  });

  it('closes modal and clears data', () => {
    const { result } = renderHook(() => useModal<{ id: string }>());

    act(() => {
      result.current.open({ id: '123' });
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toEqual({ id: '123' });

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('works with typed data', () => {
    interface User {
      id: string;
      email: string;
      role: 'admin' | 'sales';
    }

    const { result } = renderHook(() => useModal<User>());

    const testUser: User = {
      id: 'user-1',
      email: 'test@example.com',
      role: 'admin',
    };

    act(() => {
      result.current.open(testUser);
    });

    expect(result.current.data).toEqual(testUser);
    expect(result.current.data?.role).toBe('admin');
  });

  it('can open multiple times with different data', () => {
    const { result } = renderHook(() => useModal<string>());

    act(() => {
      result.current.open('first');
    });
    expect(result.current.data).toBe('first');

    act(() => {
      result.current.close();
    });
    expect(result.current.data).toBeNull();

    act(() => {
      result.current.open('second');
    });
    expect(result.current.data).toBe('second');
  });
});
