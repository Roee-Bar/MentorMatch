'use client';

// lib/hooks/useStatCardData.ts
// Custom hook for fetching stat card table data (students and applications)

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/firebase';
import { apiClient } from '@/lib/api/client';
import type { Student, Application } from '@/types/database';
import type { StatCardType } from './useStatCardTables';

interface UseStatCardDataReturn {
  studentsCache: Student[] | null;
  applicationsCache: Application[] | null;
  studentsLoading: boolean;
  applicationsLoading: boolean;
  studentsError: string | null;
  applicationsError: string | null;
  clearCache: () => void;
}

/**
 * Hook for fetching stat card table data
 * Handles lazy loading and caching of students and applications data
 * 
 * @param activeStatCard - The currently active stat card type
 * @returns Data caches, loading states, error states, and cache clearing function
 */
export function useStatCardData(activeStatCard: StatCardType): UseStatCardDataReturn {
  const [studentsCache, setStudentsCache] = useState<Student[] | null>(null);
  const [applicationsCache, setApplicationsCache] = useState<Application[] | null>(null);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);

  // Fetch students when needed
  useEffect(() => {
    const fetchStudents = async () => {
      if (studentsCache) return; // Use cache if available
      if (activeStatCard !== 'total-students' && activeStatCard !== 'students-without-projects') return;
      
      setStudentsLoading(true);
      setStudentsError(null);
      try {
        const token = await getAuthToken();
        if (!token) return;
        const response = await apiClient.getStudents(token);
        const data = response.data || [];
        setStudentsCache(data);
      } catch (err: any) {
        setStudentsError(err.message || 'Failed to load students');
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatCard]);

  // Fetch applications when needed
  useEffect(() => {
    const fetchApplications = async () => {
      if (applicationsCache) return; // Use cache if available
      if (activeStatCard !== 'approved-projects' && activeStatCard !== 'pending-applications') return;
      
      setApplicationsLoading(true);
      setApplicationsError(null);
      try {
        const token = await getAuthToken();
        if (!token) return;
        const response = await apiClient.getApplications(token);
        const data = response.data || [];
        setApplicationsCache(data);
      } catch (err: any) {
        setApplicationsError(err.message || 'Failed to load applications');
      } finally {
        setApplicationsLoading(false);
      }
    };
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatCard]);

  const clearCache = () => {
    setStudentsCache(null);
    setApplicationsCache(null);
    setStudentsError(null);
    setApplicationsError(null);
  };

  return {
    studentsCache,
    applicationsCache,
    studentsLoading,
    applicationsLoading,
    studentsError,
    applicationsError,
    clearCache,
  };
}

