'use client';

import SectionHeader from '@/app/components/layout/SectionHeader';
import Table from '@/app/components/shared/Table';
import type { Supervisor } from '@/types/database';
import { btnPrimary, linkEmail, capacityAvailable, capacityUnavailable } from '@/lib/styles/shared-styles';
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
              <Table.HeaderCell className="w-48 px-8">Name</Table.HeaderCell>
              <Table.HeaderCell className="w-64 px-8">Email</Table.HeaderCell>
              <Table.HeaderCell className="w-48 px-8">Department</Table.HeaderCell>
              <Table.HeaderCell align="center" className="w-32 px-8">Current / Max</Table.HeaderCell>
              <Table.HeaderCell align="center" className="w-28 px-8">Available</Table.HeaderCell>
              <Table.HeaderCell align="center" className="w-40 px-8">Actions</Table.HeaderCell>
            </tr>
          </Table.Header>
          <Table.Body>
            {supervisors.map((supervisor) => {
              const available = supervisor.maxCapacity - supervisor.currentCapacity;
              return (
                <Table.Row key={supervisor.id}>
                  <Table.Cell className="w-48 px-8">{supervisor.fullName}</Table.Cell>
                  <Table.Cell className="w-64 px-8">
                    <a href={`mailto:${supervisor.email}`} className={linkEmail}>
                      {supervisor.email}
                    </a>
                  </Table.Cell>
                  <Table.Cell className="w-48 px-8">{supervisor.department}</Table.Cell>
                  <Table.Cell className="w-32 px-8">
                    <div className="text-center">
                      {supervisor.currentCapacity} / {supervisor.maxCapacity}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="w-28 px-8">
                    <div className="text-center">
                      <span className={available > 0 ? capacityAvailable : capacityUnavailable}>
                        {available}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell className="w-40 px-8">
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

