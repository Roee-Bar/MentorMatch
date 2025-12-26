'use client';

// lib/hooks/useStatCardTables.ts
// Custom hook for managing stat card table state and data

import { useState, useEffect, useMemo, useRef } from 'react';
import { getFilteredAndSortedData, calculateDaysPending, type SortConfig } from '@/app/authenticated/admin/_utils/dataProcessing';
import { filterStudentsByStatCard, filterSupervisorsByStatCard, filterApplicationsByStatCard } from '@/app/authenticated/admin/_utils/dataFilters';
import { useStatCardData } from './useStatCardData';
import type { Student, Application, Supervisor } from '@/types/database';

export type StatCardType = 
  | 'total-students' 
  | 'students-without-projects' 
  | 'total-supervisors' 
  | 'available-capacity' 
  | 'approved-projects' 
  | 'pending-applications'
  | 'supervisor-partnerships'
  | null;

interface UseStatCardTablesParams {
  supervisors: Supervisor[];
}

interface UseStatCardTablesReturn {
  // State
  activeStatCard: StatCardType;
  filterText: string;
  sortConfig: SortConfig;
  
  // Data
  studentsData: Student[];
  supervisorsData: Supervisor[];
  applicationsData: Application[];
  studentsCache: Student[] | null;
  applicationsCache: Application[] | null;
  
  // Loading states
  studentsLoading: boolean;
  applicationsLoading: boolean;
  
  // Error states
  studentsError: string | null;
  applicationsError: string | null;
  
  // Actions
  setFilterText: (text: string) => void;
  handleSort: (column: string) => void;
  handleStatCardClick: (cardType: StatCardType) => void;
  clearCache: () => void;
  tableRef: React.RefObject<HTMLDivElement>;
}

/**
 * Hook for managing stat card table state and data
 * Handles lazy loading, caching, filtering, and sorting
 * 
 * @param params - Parameters including supervisors list
 * @returns Stat card table state and data
 */
export function useStatCardTables({ supervisors }: UseStatCardTablesParams): UseStatCardTablesReturn {
  // Stat card table state
  const [activeStatCard, setActiveStatCard] = useState<StatCardType>(null);
  const [filterText, setFilterText] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: '', direction: 'asc' });
  const tableRef = useRef<HTMLDivElement>(null);

  // Data fetching using extracted hook
  const {
    studentsCache,
    applicationsCache,
    studentsLoading,
    applicationsLoading,
    studentsError,
    applicationsError,
    clearCache,
  } = useStatCardData(activeStatCard);

  // Scroll to table when active stat card changes
  useEffect(() => {
    if (activeStatCard && tableRef.current) {
      setTimeout(() => {
        tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [activeStatCard]);

  // Stat card click handler
  const handleStatCardClick = (cardType: StatCardType) => {
    if (activeStatCard === cardType) {
      // Toggle off if same card clicked
      setActiveStatCard(null);
      setFilterText('');
      setSortConfig({ column: '', direction: 'asc' });
    } else {
      // Set new active card
      setActiveStatCard(cardType);
      setFilterText('');
      setSortConfig({ column: '', direction: 'asc' });
    }
  };

  // Handle column sort
  const handleSort = (column: string) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get processed data for each table type
  const getStudentsData = useMemo(() => {
    if (!studentsCache) return [];
    
    // Filter by stat card type
    const data = filterStudentsByStatCard(studentsCache, applicationsCache, activeStatCard);
    
    return getFilteredAndSortedData(
      data,
      filterText,
      (student, filter) => {
        const s = student as Student;
        return (
          s.fullName.toLowerCase().includes(filter) ||
          s.email.toLowerCase().includes(filter) ||
          s.studentId.toLowerCase().includes(filter) ||
          s.department.toLowerCase().includes(filter) ||
          s.matchStatus.toLowerCase().includes(filter)
        );
      },
      sortConfig,
      (a, b) => {
        const sa = a as Student;
        const sb = b as Student;
        switch (sortConfig.column) {
          case 'name': return sa.fullName.localeCompare(sb.fullName);
          case 'studentId': return sa.studentId.localeCompare(sb.studentId);
          case 'email': return sa.email.localeCompare(sb.email);
          case 'department': return sa.department.localeCompare(sb.department);
          case 'matchStatus': return sa.matchStatus.localeCompare(sb.matchStatus);
          case 'registrationDate': 
            return new Date(sa.registrationDate).getTime() - new Date(sb.registrationDate).getTime();
          default: return 0;
        }
      }
    );
  }, [studentsCache, applicationsCache, activeStatCard, filterText, sortConfig]);

  const getSupervisorsData = useMemo(() => {
    if (!supervisors) return [];
    
    // Filter by stat card type
    const data = filterSupervisorsByStatCard(supervisors, activeStatCard);
    
    return getFilteredAndSortedData(
      data,
      filterText,
      (supervisor, filter) => {
        const s = supervisor as Supervisor;
        return (
          s.fullName.toLowerCase().includes(filter) ||
          s.email.toLowerCase().includes(filter) ||
          s.department.toLowerCase().includes(filter) ||
          s.availabilityStatus.toLowerCase().includes(filter)
        );
      },
      sortConfig,
      (a, b) => {
        const sa = a as Supervisor;
        const sb = b as Supervisor;
        switch (sortConfig.column) {
          case 'name': return sa.fullName.localeCompare(sb.fullName);
          case 'email': return sa.email.localeCompare(sb.email);
          case 'department': return sa.department.localeCompare(sb.department);
          case 'capacity': return (sa.currentCapacity / sa.maxCapacity) - (sb.currentCapacity / sb.maxCapacity);
          case 'availableSlots': 
            return (sa.maxCapacity - sa.currentCapacity) - (sb.maxCapacity - sb.currentCapacity);
          case 'availabilityStatus': return sa.availabilityStatus.localeCompare(sb.availabilityStatus);
          default: return 0;
        }
      }
    );
  }, [supervisors, activeStatCard, filterText, sortConfig]);

  const getApplicationsData = useMemo(() => {
    if (!applicationsCache) return [];
    
    // Filter by stat card type
    const data = filterApplicationsByStatCard(applicationsCache, activeStatCard);
    
    return getFilteredAndSortedData(
      data,
      filterText,
      (application, filter) => {
        const app = application as Application;
        return (
          app.projectTitle.toLowerCase().includes(filter) ||
          app.studentName.toLowerCase().includes(filter) ||
          app.supervisorName.toLowerCase().includes(filter) ||
          app.status.toLowerCase().includes(filter)
        );
      },
      sortConfig,
      (a, b) => {
        const appA = a as Application;
        const appB = b as Application;
        switch (sortConfig.column) {
          case 'projectTitle': return appA.projectTitle.localeCompare(appB.projectTitle);
          case 'studentName': return appA.studentName.localeCompare(appB.studentName);
          case 'supervisorName': return appA.supervisorName.localeCompare(appB.supervisorName);
          case 'status': return appA.status.localeCompare(appB.status);
          case 'dateApplied': 
            return new Date(appA.dateApplied).getTime() - new Date(appB.dateApplied).getTime();
          case 'responseDate': 
            const dateA = appA.responseDate ? new Date(appA.responseDate).getTime() : 0;
            const dateB = appB.responseDate ? new Date(appB.responseDate).getTime() : 0;
            return dateA - dateB;
          case 'daysPending':
            return calculateDaysPending(appA.dateApplied) - calculateDaysPending(appB.dateApplied);
          default: return 0;
        }
      }
    );
  }, [applicationsCache, activeStatCard, filterText, sortConfig]);

  return {
    // State
    activeStatCard,
    filterText,
    sortConfig,
    
    // Data
    studentsData: getStudentsData,
    supervisorsData: getSupervisorsData,
    applicationsData: getApplicationsData,
    studentsCache,
    applicationsCache,
    
    // Loading states
    studentsLoading,
    applicationsLoading,
    
    // Error states
    studentsError,
    applicationsError,
    
    // Actions
    setFilterText,
    handleSort,
    handleStatCardClick,
    clearCache,
    tableRef,
  };
}

