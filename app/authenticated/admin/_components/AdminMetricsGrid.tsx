'use client';

import StatCard from '@/app/components/shared/StatCard';
import type { DashboardStats } from '@/types/database';
import type { StatCardType } from '@/lib/hooks';

interface AdminMetricsGridProps {
  stats: DashboardStats | null;
  activeStatCard: StatCardType;
  onStatCardClick: (cardType: StatCardType) => void;
  isRefetching: boolean;
}

const METRICS_CONFIG = [
  {
    key: 'total-students' as const,
    title: 'Total Students',
    valueKey: 'totalStudents' as const,
    description: 'Students enrolled in the system',
    color: 'blue' as const,
  },
  {
    key: 'students-without-projects' as const,
    title: 'Students Without Projects',
    valueKey: 'studentsWithoutApprovedApp' as const,
    description: 'Students still needing project assignments',
    color: 'red' as const,
  },
  {
    key: 'total-supervisors' as const,
    title: 'Total Supervisors',
    valueKey: 'totalSupervisors' as const,
    description: 'Active supervisor accounts in system',
    color: 'green' as const,
  },
  {
    key: 'available-capacity' as const,
    title: 'Available Capacity',
    valueKey: 'totalAvailableCapacity' as const,
    description: 'Open project slots across all supervisors',
    color: 'blue' as const,
  },
  {
    key: 'approved-projects' as const,
    title: 'Approved Projects',
    valueKey: 'approvedApplications' as const,
    description: 'Successfully matched student-supervisor pairs',
    color: 'green' as const,
  },
  {
    key: 'pending-applications' as const,
    title: 'Pending Applications',
    valueKey: 'pendingApplications' as const,
    description: 'Applications currently awaiting supervisor review',
    color: 'gray' as const,
  },
  {
    key: 'supervisor-partnerships' as const,
    title: 'Supervisor Partnerships',
    valueKey: 'activeSupervisorPartnerships' as const,
    description: 'Active supervisor partnerships for co-supervision',
    color: 'purple' as const,
  },
] as const;

export default function AdminMetricsGrid({
  stats,
  activeStatCard,
  onStatCardClick,
  isRefetching,
}: AdminMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {METRICS_CONFIG.map((metric) => (
        <StatCard
          key={metric.key}
          title={metric.title}
          value={stats?.[metric.valueKey] ?? '-'}
          description={metric.description}
          color={metric.color}
          onClick={() => onStatCardClick(metric.key)}
          isActive={activeStatCard === metric.key}
          isLoading={metric.key === 'available-capacity' ? isRefetching : false}
        />
      ))}
    </div>
  );
}

