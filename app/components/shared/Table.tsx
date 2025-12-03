/**
 * Table Component
 * 
 * A compound component for creating consistent, styled tables throughout the application.
 * Uses the table utility classes from globals.css.
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
    <div className={`table-wrapper ${className}`}>
      <table className="table-base">{children}</table>
    </div>
  );
}

function Header({ children, className = '' }: TableHeaderProps) {
  return <thead className={`table-header ${className}`}>{children}</thead>;
}

function HeaderCell({ children, align = 'left', className = '' }: TableHeaderCellProps) {
  const alignClass = align === 'right' ? 'table-header-cell-right' : 'table-header-cell';
  return <th className={`${alignClass} ${className}`}>{children}</th>;
}

function Body({ children, className = '' }: TableBodyProps) {
  return <tbody className={`table-body ${className}`}>{children}</tbody>;
}

function Row({ children, hover = true, className = '' }: TableRowProps) {
  const hoverClass = hover ? 'table-row-hover' : '';
  return <tr className={`${hoverClass} ${className}`}>{children}</tr>;
}

function Cell({ children, className = '' }: TableCellProps) {
  return <td className={`table-cell ${className}`}>{children}</td>;
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

