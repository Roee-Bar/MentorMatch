import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from './useAuth';
import { ROUTES } from '@/lib/routes';

const DEFAULT_BATCH_SIZE = 9; // 3 rows of 3 cards

export interface ApiResponse<T> {
  data?: T[];
  error?: string;
}

export interface BrowseEntitiesConfig<FilterValues extends Record<string, string>, Entity> {
  fetchFn: (filters: FilterValues, token: string) => Promise<ApiResponse<Entity>>;
  initialFilters: FilterValues;
  route: string;
  batchSize?: number;
  expectedRole?: 'student' | 'supervisor' | 'admin';
  filterToParams?: (filters: FilterValues) => Record<string, string | undefined>;
  paramsToFilters?: (searchParams: URLSearchParams) => FilterValues;
}

export interface BrowseEntitiesReturn<Entity> {
  // Entities
  entities: Entity[];
  displayedEntities: Entity[];
  
  // State
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  
  // Filters
  filters: Record<string, string>;
  setFilters: (filters: Record<string, string>) => void;
  handleFilterChange: (filters: Record<string, string>) => void;
  
  // Infinite scroll
  setLoadMoreRef: (node: HTMLDivElement | null) => void;
  
  // Auth
  isAuthLoading: boolean;
  userId: string | null;
}

/**
 * Generic hook for browsing entities with filtering, infinite scroll, and URL synchronization
 */
export function useBrowseEntities<FilterValues extends Record<string, string>, Entity>(
  config: BrowseEntitiesConfig<FilterValues, Entity>
): BrowseEntitiesReturn<Entity> {
  const {
    fetchFn,
    initialFilters,
    route,
    batchSize = DEFAULT_BATCH_SIZE,
    expectedRole,
    filterToParams,
    paramsToFilters,
  } = config;

  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Authentication
  const { userId, isAuthLoading, getToken } = useAuth({ expectedRole });
  
  // Entities state
  const [entities, setEntities] = useState<Entity[]>([]);
  const [displayedEntities, setDisplayedEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Infinite scroll refs
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreCallbackRef = useRef<() => void>(() => {});
  
  // Ref for URL update skip on initial mount
  const isInitialUrlUpdate = useRef(true);
  
  // Initialize filters from URL or use initial filters
  const [filters, setFilters] = useState<FilterValues>(() => {
    if (paramsToFilters) {
      return paramsToFilters(searchParams);
    }
    // Default: try to read from URL search params
    const urlFilters = { ...initialFilters };
    Object.keys(initialFilters).forEach(key => {
      const value = searchParams.get(key);
      if (value !== null) {
        urlFilters[key as keyof FilterValues] = value as FilterValues[keyof FilterValues];
      }
    });
    return urlFilters;
  });

  // Fetch entities with filters
  const fetchEntities = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();

      // Convert filters to params format if needed
      const params = filterToParams ? filterToParams(filters) : filters as Record<string, string | undefined>;
      
      const response = await fetchFn(filters, token);

      if (response.error) {
        throw new Error(response.error);
      }

      const data = response.data || [];
      setEntities(data);
      setDisplayedEntities(data.slice(0, batchSize));
      setHasMore(data.length > batchSize);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load items';
      if (errorMessage === 'Not authenticated') {
        router.push(ROUTES.LOGIN);
        return;
      }
      console.error('Error fetching entities:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, router, getToken, fetchFn, filterToParams, batchSize]);

  // Single effect for fetching - triggers on auth ready and filter changes
  useEffect(() => {
    if (!isAuthLoading && userId) {
      fetchEntities();
    }
  }, [isAuthLoading, userId, filters, fetchEntities]);

  // Update URL when filters change - skip initial mount
  useEffect(() => {
    if (isInitialUrlUpdate.current) {
      isInitialUrlUpdate.current = false;
      return;
    }

    const params = new URLSearchParams();
    const filterParams = filterToParams ? filterToParams(filters) : filters as Record<string, string | undefined>;
    
    Object.entries(filterParams).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      }
    });
    
    const queryString = params.toString();
    const newUrl = queryString ? `${route}?${queryString}` : route;
    
    router.replace(newUrl, { scroll: false });
  }, [filters, router, route, filterToParams]);

  // Infinite scroll: Load more entities
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const currentLength = displayedEntities.length;
    const nextBatch = entities.slice(currentLength, currentLength + batchSize);
    
    setTimeout(() => {
      setDisplayedEntities(prev => [...prev, ...nextBatch]);
      setHasMore(currentLength + nextBatch.length < entities.length);
      setLoadingMore(false);
    }, 300); // Small delay for smooth UX
  }, [displayedEntities.length, entities, loadingMore, hasMore, batchSize]);

  // Keep loadMoreCallbackRef in sync with latest loadMore
  loadMoreCallbackRef.current = loadMore;

  // Callback ref for IntersectionObserver - handles setup/cleanup properly
  const setLoadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    if (node) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMoreCallbackRef.current();
          }
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    }
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((newFilters: Record<string, string>) => {
    setFilters(newFilters as FilterValues);
  }, []);

  return {
    entities,
    displayedEntities,
    loading,
    loadingMore,
    error,
    hasMore,
    filters: filters as Record<string, string>,
    setFilters: handleFilterChange,
    handleFilterChange,
    setLoadMoreRef,
    isAuthLoading,
    userId,
  };
}

