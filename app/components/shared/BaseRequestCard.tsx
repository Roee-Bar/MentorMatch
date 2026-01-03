// app/components/shared/BaseRequestCard.tsx
// Base component for displaying partnership request cards
// Provides common structure and styling, accepts render props for variant-specific content

import { ReactNode } from 'react';
import { 
  cardHover, 
  cardHeader,
  borderLeftAccentBlue,
  infoBoxBlue,
  spacingFormField
} from '@/lib/styles/shared-styles';

interface BaseRequestCardProps {
  /**
   * Render the header section (title, subtitle, status badge)
   */
  renderHeader: () => ReactNode;
  
  /**
   * Render the details section (request information)
   */
  renderDetails: () => ReactNode;
  
  /**
   * Render the message section (contextual information)
   */
  renderMessage: () => ReactNode;
  
  /**
   * Render the action buttons section
   */
  renderActions: () => ReactNode;
  
  /**
   * Whether to show the message section
   */
  showMessage?: boolean;
  
  /**
   * Additional CSS classes for the card container
   */
  className?: string;
}

/**
 * Base component for partnership request cards
 * Provides consistent structure and styling across different request types
 */
export default function BaseRequestCard({
  renderHeader,
  renderDetails,
  renderMessage,
  renderActions,
  showMessage = true,
  className = '',
}: BaseRequestCardProps) {
  return (
    <div className={`${cardHover} ${borderLeftAccentBlue} ${className}`}>
      {/* Header */}
      <div className={cardHeader}>
        {renderHeader()}
      </div>

      {/* Request Details */}
      <div className={`space-y-2 ${spacingFormField}`}>
        {renderDetails()}
      </div>

      {/* Message */}
      {showMessage && (
        <div className={`${infoBoxBlue} ${spacingFormField}`}>
          {renderMessage()}
        </div>
      )}

      {/* Action Buttons */}
      {renderActions()}
    </div>
  );
}

