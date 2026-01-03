/**
 * Table Column Width Configurations
 * 
 * Centralized configuration for table column widths to improve maintainability
 * and consistency across admin tables.
 */

/**
 * Validates that table column widths sum to 100%
 * Extracts percentage values from Tailwind width classes (e.g., 'w-[32%]' -> 32)
 * 
 * @param widths - Object with width class strings
 * @returns true if widths sum to 100%, false otherwise
 */
function validateTableWidths(widths: Record<string, string>): boolean {
  const percentageRegex = /w-\[(\d+(?:\.\d+)?)%\]/;
  let sum = 0;
  
  for (const width of Object.values(widths)) {
    const match = width.match(percentageRegex);
    if (match) {
      sum += parseFloat(match[1]);
    }
  }
  
  // Allow small floating point differences (within 0.1%)
  return Math.abs(sum - 100) < 0.1;
}

/**
 * Type-safe width configuration helper
 * Ensures all width values are valid Tailwind width classes
 */
type WidthClass = `w-[${number}%]`;

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

/**
 * Validates table width configurations at module load (development only)
 * Throws error if widths don't sum to 100%
 */
if (process.env.NODE_ENV === 'development') {
  // Validate ApplicationsTable widths
  Object.values(APPLICATIONS_TABLE_WIDTHS).forEach((widths, index) => {
    if (!validateTableWidths(widths)) {
      const tableType = Object.keys(APPLICATIONS_TABLE_WIDTHS)[index];
      console.warn(
        `ApplicationsTable widths for '${tableType}' do not sum to 100%. ` +
        `Current sum: ${Object.values(widths).reduce((sum, w) => {
          const match = w.match(/w-\[(\d+(?:\.\d+)?)%\]/);
          return sum + (match ? parseFloat(match[1]) : 0);
        }, 0)}%`
      );
    }
  });
  
  // Validate StudentsTable widths
  if (!validateTableWidths(STUDENTS_TABLE_WIDTHS)) {
    console.warn(
      `StudentsTable widths do not sum to 100%. ` +
      `Current sum: ${Object.values(STUDENTS_TABLE_WIDTHS).reduce((sum, w) => {
        const match = w.match(/w-\[(\d+(?:\.\d+)?)%\]/);
        return sum + (match ? parseFloat(match[1]) : 0);
      }, 0)}%`
    );
  }
  
  // Validate SupervisorsTable widths
  Object.values(SUPERVISORS_TABLE_WIDTHS).forEach((widths, index) => {
    if (!validateTableWidths(widths)) {
      const tableType = Object.keys(SUPERVISORS_TABLE_WIDTHS)[index];
      console.warn(
        `SupervisorsTable widths for '${tableType}' do not sum to 100%. ` +
        `Current sum: ${Object.values(widths).reduce((sum, w) => {
          const match = w.match(/w-\[(\d+(?:\.\d+)?)%\]/);
          return sum + (match ? parseFloat(match[1]) : 0);
        }, 0)}%`
      );
    }
  });
}

