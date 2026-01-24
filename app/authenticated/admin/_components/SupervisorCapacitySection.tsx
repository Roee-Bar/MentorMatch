'use client';

import SectionHeader from '@/app/components/layout/SectionHeader';
import type { Supervisor } from '@/types/database';
import { btnPrimary, linkEmail, capacityAvailable, capacityUnavailable, cardBase } from '@/lib/styles/shared-styles';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import EmptyState from '@/app/components/feedback/EmptyState';

interface SupervisorCapacitySectionProps {
  supervisors: Supervisor[];
  loading: boolean;
  onEdit: (supervisor: Supervisor) => void;
  onRefresh: () => void;
}

export default function SupervisorCapacitySection({
  supervisors,
  loading,
  onEdit,
  onRefresh,
}: SupervisorCapacitySectionProps) {
  if (loading) {
    return (
      <div className="mb-8">
        <SectionHeader title="Supervisor Capacity Management" />
        <div className="text-center py-8">
          <LoadingSpinner message="Loading supervisors..." />
        </div>
      </div>
    );
  }

  if (supervisors.length === 0) {
    return (
      <div className="mb-8">
        <SectionHeader title="Supervisor Capacity Management" />
        <EmptyState message="No supervisors found." />
      </div>
    );
  }

  return (
    <div className="mb-8">
      <SectionHeader 
        title="Supervisor Capacity Management"
        action={
          <button onClick={onRefresh} className={btnPrimary}>
            Refresh
          </button>
        }
      />
      
      <div className={cardBase}>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="w-[18%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300">Name</th>
                <th className="w-[22%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300">Email</th>
                <th className="w-[18%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300">Department</th>
                <th className="w-[14%] px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300">Current / Max</th>
                <th className="w-[12%] px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300">Available</th>
                <th className="w-[16%] px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-slate-700">
              {supervisors.map((supervisor) => {
                const available = supervisor.maxCapacity - supervisor.currentCapacity;
                return (
                  <tr key={supervisor.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="w-[18%] px-6 py-4 dark:text-slate-200">{supervisor.fullName}</td>
                    <td className="w-[22%] px-6 py-4 dark:text-slate-200">
                      <a href={`mailto:${supervisor.email}`} className={linkEmail}>
                        {supervisor.email}
                      </a>
                    </td>
                    <td className="w-[18%] px-6 py-4 dark:text-slate-200">{supervisor.department}</td>
                    <td className="w-[14%] px-6 py-4 dark:text-slate-200">
                      <div className="text-center">
                        {supervisor.currentCapacity} / {supervisor.maxCapacity}
                      </div>
                    </td>
                    <td className="w-[12%] px-6 py-4 dark:text-slate-200">
                      <div className="text-center">
                        <span className={available > 0 ? capacityAvailable : capacityUnavailable}>
                          {available}
                        </span>
                      </div>
                    </td>
                    <td className="w-[16%] px-6 py-4 dark:text-slate-200">
                      <div className="flex justify-center">
                        <button
                          onClick={() => onEdit(supervisor)}
                          className={btnPrimary}
                        >
                          Edit Capacity
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

