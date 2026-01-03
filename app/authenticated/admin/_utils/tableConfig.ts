/**
 * Table Column Width Configurations
 * 
 * Centralized configuration for table column widths to improve maintainability
 * and consistency across admin tables.
 */

/**
 * Column width configuration for ApplicationsTable
 * Different widths based on table type (approved-projects vs pending-applications)
 */
export const APPLICATIONS_TABLE_WIDTHS = {
  'approved-projects': {
    projectTitle: 'w-[32%]',
    studentName: 'w-[22%]',
    supervisorName: 'w-[22%]',
    status: 'w-[12%]',
    submitted: 'w-[12%]',
  },
  'pending-applications': {
    projectTitle: 'w-[28%]',
    studentName: 'w-[18%]',
    supervisorName: 'w-[18%]',
    status: 'w-[10%]',
    daysPending: 'w-[12%]',
    submitted: 'w-[14%]',
  },
} as const;

/**
 * Column width configuration for StudentsTable
 */
export const STUDENTS_TABLE_WIDTHS = {
  name: 'w-[20%]',
  studentId: 'w-[12%]',
  email: 'w-[25%]',
  department: 'w-[18%]',
  status: 'w-[12%]',
  registered: 'w-[13%]',
} as const;

/**
 * Column width configuration for SupervisorsTable
 * Different widths based on whether available slots column is shown
 */
export const SUPERVISORS_TABLE_WIDTHS = {
  withAvailableSlots: {
    name: 'w-[20%]',
    email: 'w-[23%]',
    department: 'w-[16%]',
    capacity: 'w-[12%]',
    availableSlots: 'w-[12%]',
    status: 'w-[17%]',
  },
  withoutAvailableSlots: {
    name: 'w-[22%]',
    email: 'w-[25%]',
    department: 'w-[18%]',
    capacity: 'w-[15%]',
    status: 'w-[20%]',
  },
} as const;

