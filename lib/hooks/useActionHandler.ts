'use client';

/**
 * Generic Action Handler Hook
 * 
 * Provides a unified pattern for action hooks that handle:
 * - Loading state management per action
 * - Authentication token retrieval
 * - Error handling and callbacks
 * - Success callbacks and refresh triggers
 * - Unmount protection for components
 */

import { useState, useRef, useEffect } from 'react';
import { auth } from '@/lib/firebase';

export interface ActionConfig {
  userId: string | null;
  onRefresh?: () => Promise<void>;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  preventUnmountUpdates?: boolean; // For hooks that need mountedRef protection
}

export interface ActionDefinition<TParams = any, TResult = void> {
  key: string | ((params: TParams) => string);
  handler: (params: TParams, token: string) => Promise<TResult>;
  successMessage?: string | ((params: TParams, result?: TResult) => string);
  errorMessage?: string | ((error: any) => string);
  requiresUserId?: boolean; // Some actions don't need userId check (default: true)
  rethrowError?: boolean; // Whether to rethrow error after handling (default: false)
}

/**
 * Type helper to extract action handler types from action definitions
 */
type ActionHandlers<TActions extends Record<string, ActionDefinition>> = {
  [K in keyof TActions]: TActions[K] extends ActionDefinition<infer TParams, infer TResult>
    ? (params: TParams) => Promise<TResult>
    : never;
};

/**
 * Return type for useActionHandler
 */
type UseActionHandlerReturn<TActions extends Record<string, ActionDefinition>> = 
  ActionHandlers<TActions> & {
    isLoading: (key: string) => boolean;
    isLoadingAny: () => boolean;
  };

/**
 * Generic hook for managing action handlers with loading states and callbacks
 * 
 * @param config - Configuration with userId and callback functions
 * @param actions - Object mapping action names to action definitions
 * @returns Object with action handlers, isLoading, and isLoadingAny functions
 */
export function useActionHandler<TActions extends Record<string, ActionDefinition>>(
  config: ActionConfig,
  actions: TActions
): UseActionHandlerReturn<TActions> {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const mountedRef = useRef(true);

  const preventUnmount = config.preventUnmountUpdates ?? false;

  // Cleanup on unmount if needed
  useEffect(() => {
    if (preventUnmount) {
      return () => {
        mountedRef.current = false;
      };
    }
  }, [preventUnmount]);

  const setLoading = (key: string, value: boolean) => {
    if (preventUnmount && !mountedRef.current) {
      return;
    }
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  const createAction = <TParams, TResult>(
    actionDef: ActionDefinition<TParams, TResult>
  ) => {
    return async (params: TParams): Promise<TResult> => {
      const key = typeof actionDef.key === 'function' 
        ? actionDef.key(params) 
        : actionDef.key;
      
      setLoading(key, true);

      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          throw new Error('Not authenticated');
        }
        if (actionDef.requiresUserId !== false && !config.userId) {
          throw new Error('Not authenticated');
        }

        const result = await actionDef.handler(params, token);
        
        const successMsg = typeof actionDef.successMessage === 'function'
          ? actionDef.successMessage(params, result)
          : actionDef.successMessage || 'Operation completed successfully';
        
        config.onSuccess?.(successMsg);
        await config.onRefresh?.();
        
        return result;
      } catch (error: any) {
        const errorMsg = typeof actionDef.errorMessage === 'function'
          ? actionDef.errorMessage(error)
          : actionDef.errorMessage || error.message || 'Operation failed';
        
        config.onError?.(errorMsg);
        
        if (actionDef.rethrowError) {
          throw error;
        }
      } finally {
        setLoading(key, false);
      }
    };
  };

  const isLoading = (key: string) => loadingStates[key] || false;
  
  const isLoadingAny = () => Object.values(loadingStates).some(v => v);

  // Create action handlers dynamically
  const handlers = Object.entries(actions).reduce((acc, [name, actionDef]) => {
    acc[name] = createAction(actionDef);
    return acc;
  }, {} as Record<string, any>);

  return {
    ...handlers,
    isLoading,
    isLoadingAny,
  } as UseActionHandlerReturn<TActions>;
}

