'use client';

import SectionHeader from '@/app/components/layout/SectionHeader';
import Table from '@/app/components/shared/Table';
import type { Supervisor } from '@/types/database';
import { btnPrimary } from '@/lib/styles/shared-styles';
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
      
      <div className="overflow-x-auto">
        <Table.Container>
          <Table.Header>
            <tr>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Department</Table.HeaderCell>
              <Table.HeaderCell align="center">Current / Max</Table.HeaderCell>
              <Table.HeaderCell align="center">Available</Table.HeaderCell>
              <Table.HeaderCell align="center">Actions</Table.HeaderCell>
            </tr>
          </Table.Header>
          <Table.Body>
            {supervisors.map((supervisor) => {
              const available = supervisor.maxCapacity - supervisor.currentCapacity;
              return (
                <Table.Row key={supervisor.id}>
                  <Table.Cell>{supervisor.fullName}</Table.Cell>
                  <Table.Cell>
                    <a href={`mailto:${supervisor.email}`} className="text-blue-600 hover:underline">
                      {supervisor.email}
                    </a>
                  </Table.Cell>
                  <Table.Cell>{supervisor.department}</Table.Cell>
                  <Table.Cell>
                    <div className="text-center">
                      {supervisor.currentCapacity} / {supervisor.maxCapacity}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="text-center">
                      <span className={available > 0 ? 'text-green-600 font-semibold' : 'text-gray-500'}>
                        {available}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex justify-center">
                      <button
                        onClick={() => onEdit(supervisor)}
                        className={btnPrimary}
                      >
                        Edit Capacity
                      </button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Container>
      </div>
    </div>
  );
}

