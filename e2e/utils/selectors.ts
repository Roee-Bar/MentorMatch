/**
 * Centralized Selector Definitions
 * 
 * Single source of truth for all test selectors.
 * Priority: data-testid > aria-label > role > semantic HTML
 */

/**
 * Selector builder functions
 */
export const Selectors = {
  // Application Cards
  applicationCard: '[data-testid="application-card"]',
  applicationCardById: (id: string) => `[data-testid="application-card-${id}"]`,
  applicationCardByIndex: (index: number) => `[data-testid="application-card"]:nth-of-type(${index + 1})`,
  
  // Supervisor Cards
  supervisorCard: '[data-testid="supervisor-card"]',
  supervisorCardById: (id: string) => `[data-testid="supervisor-card-${id}"]`,
  supervisorCardByIndex: (index: number) => `[data-testid="supervisor-card"]:nth-of-type(${index + 1})`,
  
  // Student Cards
  studentCard: '[data-testid="student-card"]',
  studentCardById: (id: string) => `[data-testid="student-card-${id}"]`,
  studentCardByIndex: (index: number) => `[data-testid="student-card"]:nth-of-type(${index + 1})`,
  
  // Form Inputs
  formInput: (name: string) => `[data-testid="form-input-${name}"]`,
  formSelect: (name: string) => `[data-testid="form-select-${name}"]`,
  formTextarea: (name: string) => `[data-testid="form-textarea-${name}"]`,
  
  // Login Form
  loginForm: '[data-testid="login-form"]',
  loginEmailInput: '[data-testid="form-input-email"]',
  loginPasswordInput: '[data-testid="form-input-password"]',
  loginButton: '[data-testid="login-button"]',
  
  // Register Form
  registerForm: '[data-testid="register-form"]',
  registerEmailInput: '[data-testid="form-input-email"]',
  registerPasswordInput: '[data-testid="form-input-password"]',
  registerConfirmPasswordInput: '[data-testid="form-input-confirmPassword"]',
  registerSubmitButton: '[data-testid="register-submit-button"]',
  
  // Messages
  errorMessage: '[role="alert"], [data-testid="error-message"], [data-testid="error"], .error, .error-message',
  successMessage: '[role="status"], [data-testid="success-message"], [data-testid="success"], .success, .success-message',
  
  // Modals
  modal: '[role="dialog"], [data-testid="modal"]',
  modalTitle: '[data-testid="modal-title"]',
  modalCloseButton: '[data-testid="modal-close-button"]',
  modalConfirmButton: '[data-testid="modal-confirm-button"]',
  modalCancelButton: '[data-testid="modal-cancel-button"]',
  
  // Tables
  table: 'table, [role="table"], [data-testid="table"]',
  tableRow: 'tbody tr, [role="row"]',
  tableHeader: 'thead tr, [role="columnheader"]',
  
  // Buttons
  button: (text: string) => `button:has-text("${text}"), [data-testid="button-${text.toLowerCase().replace(/\s+/g, '-')}"]`,
  deleteButton: '[data-testid*="delete-button"], button:has-text("delete"), button:has-text("Delete")',
  editButton: '[data-testid*="edit-button"], button:has-text("edit"), button:has-text("Edit")',
  submitButton: '[data-testid*="submit-button"], button[type="submit"]',
  cancelButton: '[data-testid*="cancel-button"], button:has-text("cancel"), button:has-text("Cancel")',
  
  // Navigation
  navigationLink: (text: string) => `a:has-text("${text}"), [data-testid="nav-link-${text.toLowerCase().replace(/\s+/g, '-')}"]`,
  
  // Loading States
  loadingSpinner: '[data-testid="loading"], .loading, [aria-busy="true"]',
  
  // Dashboard Sections
  dashboardSection: (section: string) => `[data-testid="dashboard-${section}"]`,
  
  // Stat Cards
  statCard: '[data-testid="stat-card"]',
  statCardByTitle: (title: string) => `[data-testid="stat-card"]:has-text("${title}")`,
} as const;

/**
 * Helper function to build compound selectors
 */
export function combineSelectors(...selectors: string[]): string {
  return selectors.join(' ');
}

/**
 * Helper function to create data-testid selector
 */
export function testId(id: string): string {
  return `[data-testid="${id}"]`;
}

/**
 * Fallback selector strategy - tries multiple selectors in order
 */
export function fallbackSelector(...selectors: string[]): string {
  return selectors.join(', ');
}

export default Selectors;

