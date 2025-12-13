/**
 * Table Component
 * 
 * A compound component for creating consistent, styled tables throughout the application.
 * 
 * @example
 * ```tsx
 * <Table.Container>
 *   <Table.Header>
 *     <tr>
 *       <Table.HeaderCell>Name</Table.HeaderCell>
 *       <Table.HeaderCell>Email</Table.HeaderCell>
 *       <Table.HeaderCell align="right">Actions</Table.HeaderCell>
 *     </tr>
 *   </Table.Header>
 *   <Table.Body>
 *     <Table.Row>
 *       <Table.Cell>John Doe</Table.Cell>
 *       <Table.Cell>john@example.com</Table.Cell>
 *       <Table.Cell>
 *         <button>Edit</button>
 *       </Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 * </Table.Container>
 * ```
 */

import {
  tableWrapper,
  tableBase,
  tableHeader,
  tableHeaderCell,
  tableHeaderCellRight,
  tableBody,
  tableRowHover,
  tableCell,
} from '@/lib/styles/shared-styles';

interface TableContainerProps {
  children: React.ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface TableHeaderCellProps {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps {
  children: React.ReactNode;
  hover?: boolean;
  className?: string;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

function Container({ children, className = '' }: TableContainerProps) {
  return (
    <div className={`${tableWrapper} ${className}`}>
      <table className={tableBase}>{children}</table>
    </div>
  );
}

function Header({ children, className = '' }: TableHeaderProps) {
  return <thead className={`${tableHeader} ${className}`}>{children}</thead>;
}

function HeaderCell({ children, align = 'left', className = '' }: TableHeaderCellProps) {
  const alignClass = align === 'right' ? tableHeaderCellRight : tableHeaderCell;
  return <th className={`${alignClass} ${className}`}>{children}</th>;
}

function Body({ children, className = '' }: TableBodyProps) {
  return <tbody className={`${tableBody} ${className}`}>{children}</tbody>;
}

function Row({ children, hover = true, className = '' }: TableRowProps) {
  const hoverClass = hover ? tableRowHover : '';
  return <tr className={`${hoverClass} ${className}`}>{children}</tr>;
}

function Cell({ children, className = '' }: TableCellProps) {
  return <td className={`${tableCell} ${className}`}>{children}</td>;
}

// Export as compound component
const Table = {
  Container,
  Header,
  HeaderCell,
  Body,
  Row,
  Cell,
};

export default Table;
