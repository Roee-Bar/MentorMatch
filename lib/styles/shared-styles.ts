// lib/styles/shared-styles.ts
// Centralized style constants for consistent theming across components

// ============= BUTTONS =============
export const btnBase = 'px-4 py-2 text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 dark:focus:ring-offset-slate-800';

export const btnPrimary = `${btnBase} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed`;
export const btnSecondary = `${btnBase} text-gray-600 border border-gray-200 hover:bg-gray-50 focus:ring-gray-500 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700`;
export const btnDanger = `${btnBase} text-red-600 border border-red-200 hover:bg-red-50 focus:ring-red-500 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950`;
export const btnSuccess = `${btnBase} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500`;

// ============= CARDS =============
export const cardBase = 'bg-white p-6 rounded-xl shadow-lg border border-gray-200 dark:bg-slate-800 dark:border-slate-700';
export const cardHover = `${cardBase} hover:shadow-xl transition-shadow duration-200`;

// ============= BADGES =============
export const badgeBase = 'px-4 py-1.5 rounded-full text-xs font-semibold';
export const badgeSuccess = `${badgeBase} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
export const badgeWarning = `${badgeBase} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
export const badgeInfo = `${badgeBase} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
export const badgeDanger = `${badgeBase} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;

// ============= TAGS =============
export const tagBase = 'px-4 py-1.5 text-xs rounded-full';
export const tagBlue = `${tagBase} bg-blue-50 text-blue-700 dark:bg-blue-800 dark:text-blue-200`;
export const tagPurple = `${tagBase} bg-purple-50 text-purple-700 dark:bg-purple-800 dark:text-purple-200`;
export const tagGray = `${tagBase} bg-gray-50 text-gray-500 dark:bg-slate-700 dark:text-slate-400`;

// ============= MODALS =============
export const modalBackdrop = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4';
export const modalContainer = 'bg-white rounded-xl shadow-xl max-w-md w-full p-6 dark:bg-slate-800';

// ============= TEXT UTILITIES =============
export const textMuted = 'text-gray-500 dark:text-slate-300';
export const textPrimary = 'text-gray-900 dark:text-slate-100';
export const textTertiary = 'text-gray-400 dark:text-slate-300';
export const textValue = 'text-gray-800 font-medium dark:text-slate-200';
export const textBody = 'text-sm text-gray-700 dark:text-slate-200';

// ============= ICON CONTAINERS =============
export const iconContainerBase = 'w-12 h-12 rounded-xl flex items-center justify-center';

// ============= FORM ELEMENTS =============
export const labelStyles = 'block mb-2 font-semibold text-gray-700 text-sm dark:text-slate-300';
export const checkboxLabel = 'text-sm font-medium text-gray-700 dark:text-slate-300';
export const inputStyles = 'w-full p-3 rounded-xl border border-gray-300 text-sm text-gray-900 bg-white placeholder-gray-400 outline-none transition-colors duration-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-blue-500';
export const textareaStyles = 'w-full p-3 rounded-xl border border-gray-300 text-sm text-gray-900 bg-white placeholder-gray-400 outline-none resize-y font-[inherit] transition-colors duration-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-blue-500';
export const helperStyles = 'text-gray-500 text-xs mt-1 block dark:text-slate-300';
export const charCounterStyles = 'text-gray-400 text-xs ml-auto dark:text-slate-400';

// ============= LINKS =============
export const linkPrimary = 'text-blue-600 dark:text-blue-400 font-bold underline text-sm hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer';
export const linkSubtle = 'text-blue-600 dark:text-blue-400 text-sm hover:underline';
export const linkEditAction = 'text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium';

// ============= BUTTON VARIANTS =============
export const btnPrimaryFullWidth = `${btnPrimary} w-full`;
export const btnWarning = `${btnBase} bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500 disabled:bg-gray-400 disabled:cursor-not-allowed`;

// ============= CARD VARIANTS =============
export const cardAuth = 'bg-white dark:bg-slate-800 p-12 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700';
export const cardFormSection = 'bg-gray-50 dark:bg-slate-900 p-10 rounded-xl border border-gray-200 dark:border-slate-700';

// ============= BACKGROUND UTILITIES =============
export const bgMain = 'bg-white dark:bg-slate-800';
export const bgPage = 'bg-white dark:bg-slate-900';
export const bgFooter = 'bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700';

// ============= SECTION HEADINGS =============
export const sectionTitle = 'text-xl font-bold text-gray-800 dark:text-slate-100 mb-4';

// ============= DIVIDERS =============
export const dividerTop = 'mt-4 pt-4 border-t border-gray-200 dark:border-slate-700';

// ============= PILLS (Rounded Tags) =============
export const pillBase = 'px-3 py-1 rounded-full text-sm font-medium';
export const pillBlue = `${pillBase} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
export const pillGreen = `${pillBase} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
export const pillPurple = `${pillBase} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`;

// ============= LINK VARIANTS =============
export const linkAction = 'text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline';

// ============= TEXT UTILITIES (Extended) =============
export const textSecondary = 'text-gray-600 dark:text-slate-300';
export const textLabel = 'text-xs text-gray-500 dark:text-slate-300';
export const textDescription = 'text-sm text-gray-700 leading-relaxed dark:text-slate-200';

// ============= CARD STRUCTURE PATTERNS =============
export const cardHeader = 'flex items-start justify-between mb-4';
export const cardTitle = 'text-lg font-bold text-gray-800 mb-1 dark:text-slate-100';
export const cardDetailsSection = 'space-y-2 border-t pt-4 dark:border-slate-700';
export const cardDetailRow = 'flex justify-between text-sm';
export const cardActionsSection = 'mt-4 pt-4 border-t flex gap-2 dark:border-slate-700';

// ============= MODAL PATTERNS (Extended) =============
export const modalContentBase = 'bg-white rounded-xl shadow-xl w-full max-h-[90vh] overflow-y-auto dark:bg-slate-800';
export const modalContentMd = `${modalContentBase} max-w-md`;
export const modalContentLg = `${modalContentBase} max-w-2xl`;
export const modalHeader = 'border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10 dark:bg-slate-800 dark:border-slate-700';
export const modalBody = 'p-6 space-y-6';

// ============= INFO BOXES =============
export const infoBoxBlue = 'bg-blue-50 border border-blue-200 rounded-xl p-3 dark:bg-blue-900/30 dark:border-blue-800';
export const infoBoxGray = 'bg-gray-50 p-4 rounded-xl border border-gray-200 dark:bg-slate-700 dark:border-slate-600';
export const infoBoxOrange = 'bg-orange-50 border border-orange-200 rounded-xl dark:bg-orange-900/20 dark:border-orange-800';
export const infoBoxOrangeRevision = 'bg-orange-50 border border-orange-200 rounded-xl p-4 dark:bg-orange-900/20 dark:border-orange-800';
export const textOrangeHeading = 'text-lg font-bold text-orange-900 dark:text-orange-200';
export const textOrangeBody = 'text-sm text-orange-800 dark:text-orange-300';
export const bgRevisionContent = 'bg-white p-3 rounded-xl border border-orange-200 dark:bg-slate-800 dark:border-orange-800';

// ============= MODAL UTILITIES =============
export const modalCloseBtn = 'text-gray-400 hover:text-gray-600 text-2xl leading-none dark:text-slate-400 dark:hover:text-slate-200';

// ============= FORM VALIDATION =============
export const errorText = 'text-red-600 text-xs mt-1 dark:text-red-400';
export const charCountText = 'text-gray-400 text-xs mt-1 dark:text-slate-400';

// ============= ICON UTILITIES =============
export const iconMuted = 'text-gray-400 dark:text-slate-400';

// ============= DISABLED INPUT =============
export const inputDisabled = `${inputStyles} bg-gray-50 cursor-not-allowed dark:bg-slate-900`;

// ============= NAVIGATION =============
export const mobileNavItem = 'flex items-center gap-3 p-3 min-h-[44px] rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-800 dark:text-slate-200';
export const dropdownItem = 'w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex gap-2 border-none bg-transparent cursor-pointer dark:hover:bg-slate-700';
export const dropdownItemDanger = `${dropdownItem} text-red-600 dark:text-red-400`;

// ============= AVATARS =============
export const avatarBase = 'rounded-full object-cover';
export const avatarSm = `${avatarBase} w-10 h-10 border-2 border-white`;
export const avatarMd = `${avatarBase} w-12 h-12 border-2 border-blue-600`;
export const avatarPlaceholderSm = 'w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center text-white font-bold text-sm border-2 border-white dark:bg-blue-900';
export const avatarPlaceholderMd = 'w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold';

// ============= LINKS (Extended) =============
export const linkEmail = 'text-blue-600 hover:underline dark:text-blue-400';
export const linkEmailWithTruncate = `${linkEmail} font-medium truncate ml-2`;

// ============= CARD VARIANTS (Extended) =============
export const cardBaseCompact = 'bg-white p-4 rounded-xl shadow-lg border border-gray-200 dark:bg-slate-800 dark:border-slate-700';

// ============= DIVIDERS (Extended) =============
export const dividerLight = 'mt-4 pt-4 border-t border-gray-100 dark:border-slate-700';

// ============= ERROR/VALIDATION BOXES =============
export const infoBoxRed = 'p-3 bg-red-50 border border-red-200 rounded-xl dark:bg-red-900/30 dark:border-red-800';
export const errorTextInline = 'text-sm text-red-600 dark:text-red-400';

// ============= HEADING VARIANTS =============
export const headingLg = 'text-lg font-bold text-gray-800 dark:text-slate-100';
export const headingLgSemibold = 'text-lg font-semibold text-gray-800 dark:text-slate-100';
export const headingXl = 'text-xl font-bold text-gray-800 dark:text-slate-100';
export const heading2xl = 'text-2xl font-bold text-gray-800 dark:text-slate-100';
export const heading3xl = 'text-3xl font-bold text-gray-800 dark:text-slate-100 mb-2 text-balance';

// ============= FILTER/TOGGLE BUTTONS =============
export const filterBtnBase = 'px-4 py-2 rounded-xl font-medium transition-colors';
export const filterBtnActive = `${filterBtnBase} bg-blue-600 text-white`;
export const filterBtnInactive = `${filterBtnBase} bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700`;

// ============= TEXT UTILITIES (Blue Accent) =============
export const textBlue = 'text-blue-600 dark:text-blue-400';
export const textBlueAccent = 'font-medium text-blue-600 dark:text-blue-400';

// ============= BORDERS & DIVIDERS (Extended) =============
export const borderTop = 'border-t border-gray-200 dark:border-slate-700';
export const borderBottom = 'border-b border-gray-200 dark:border-slate-700';
export const sectionDivider = 'pt-6 border-t dark:border-slate-700';
export const sectionDividerWithMargin = 'mt-4 pt-4 border-t dark:border-slate-700';

// ============= DROPDOWN MENUS =============
export const dropdownMenu = 'absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 text-gray-800 z-50 dark:bg-slate-800 dark:text-slate-200';

// ============= TOUCH TARGET BUTTONS =============
export const touchTargetBtn = 'p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors';
export const touchTargetBtnLight = `${touchTargetBtn} hover:bg-gray-100 dark:hover:bg-slate-700`;

// ============= SPECIAL BUTTONS =============
export const logoutBtnFull = 'flex items-center justify-center gap-3 w-full p-3 min-h-[44px] rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors text-red-600 dark:text-red-400 font-medium';

// ============= TABLE PATTERNS =============
export const tableWrapper = 'overflow-x-auto';
export const tableBase = 'min-w-full divide-y divide-gray-200 dark:divide-slate-700';
export const tableHeader = 'bg-gray-50 dark:bg-slate-800';
export const tableHeaderCell = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300';
export const tableHeaderCellCenter = 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300';
export const tableHeaderCellRight = 'px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300';
export const tableBody = 'bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-slate-700';
export const tableRowHover = 'hover:bg-gray-50 dark:hover:bg-slate-700';
export const tableCell = 'px-6 py-4 whitespace-nowrap dark:text-slate-200';

// ============= EMAIL LINKS =============
export const linkEmailWithMargin = `${linkEmail} ml-1`;

// ============= EMPTY STATES =============
export const emptyStateContainer = 'text-center py-8 text-gray-500 dark:text-slate-400';
export const emptyStateLoading = 'text-center py-8';

// ============= CAPACITY INDICATORS =============
export const capacityAvailable = 'text-green-600 font-semibold dark:text-green-400';
export const capacityUnavailable = 'text-gray-500 dark:text-slate-400';

// ============= SPACING UTILITIES =============
export const spacingSection = 'mb-8'; // Section spacing
export const spacingFormField = 'mb-5'; // Form field spacing
export const spacingFormGroup = 'mb-6'; // Form group spacing
export const spacingTop = 'mt-4'; // Top spacing
export const spacingTopLarge = 'mt-6'; // Large top spacing

// ============= TABLE VARIANTS (Spacious) =============
export const tableHeaderCellSpacious = 'px-8 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300';
export const tableHeaderCellSpaciousCenter = 'px-8 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300';
export const tableHeaderCellSpaciousRight = 'px-8 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300';
export const tableCellSpacious = 'px-8 py-4 whitespace-nowrap dark:text-slate-200';

// ============= SORTABLE TABLE HEADERS =============
export const sortableHeaderButton = 'flex items-center gap-2 hover:text-blue-600';

// ============= LOADING SPINNERS =============
export const spinnerSmall = 'w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin dark:border-slate-600 dark:border-t-blue-500';

// ============= COMMENT BOXES =============
export const commentBox = 'text-sm text-gray-700 bg-white p-3 rounded-xl border dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600';

// ============= RESPONSIVE GRID UTILITIES =============
export const responsiveGrid3Col = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
export const responsiveGrid2Col = 'grid grid-cols-1 sm:grid-cols-2 gap-5';

// ============= ACTION SELECTION BUTTONS =============
export const actionBtnBase = 'w-full p-4 rounded-xl border-2 text-left transition-all';
export const actionBtnDefault = 'bg-white border-gray-200 hover:border-gray-300 dark:bg-slate-700 dark:border-slate-600 dark:hover:border-slate-500 dark:text-slate-200';
export const actionBtnApprove = 'bg-green-100 border-green-500 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/70';
export const actionBtnRevision = 'bg-orange-100 border-orange-500 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/50 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-900/70';
export const actionBtnReject = 'bg-red-100 border-red-500 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/70';

// ============= PROFILE FIELDS =============
export const profileLabel = 'text-sm font-medium text-gray-600 dark:text-slate-300';
export const profileValue = 'text-gray-800 dark:text-slate-200 mt-1';

// ============= CHECKBOX INPUTS =============
export const checkboxBase = 'w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:checked:bg-blue-600 dark:focus:ring-blue-400';
export const checkboxLg = 'w-[18px] h-[18px] cursor-pointer text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700';

// ============= DECORATIVE BORDERS =============
export const borderLeftAccentBlue = 'border-l-4 border-blue-400 dark:border-blue-500';
export const borderLeftAccentBlueLight = 'border-l-2 border-blue-200 dark:border-blue-800';

// ============= HIGHLIGHT RINGS =============
export const ringPartnerHighlight = 'ring-2 ring-green-400 dark:ring-green-500';

// ============= RE-EXPORTS FROM COLOR UTILITIES =============
export {
  textGreen,
  textRed,
  textPurple,
  textYellow,
  textOrange,
  textGray,
  textInfoLight,
  textInfoDark,
  bgGreen,
  bgYellow,
  bgRed,
  bgBlue,
  iconContainerBlue,
  iconContainerGreen,
  iconContainerPurple,
  iconContainerYellow,
  iconContainerRed,
  textErrorCentered,
  textColorMap,
  bgColorMap,
  iconContainerMap,
} from './color-utilities';