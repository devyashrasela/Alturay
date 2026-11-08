export function DataTableTable({
  columns = [],
  children,
  className = '',
  tableClassName = '',
}) {
  return (
    <div className={`db-wrap ${className}`.trim()}>
      <table className={`db ${tableClassName}`.trim()}>
        {columns.length > 0 && (
          <colgroup>
            {columns.map((col, idx) => (
              <col key={col.key || idx} style={col.width ? { width: col.width } : undefined} />
            ))}
          </colgroup>
        )}
        {children}
      </table>
    </div>
  );
}

export function DataTableHead({ columns = [], children }) {
  if (children) {
    return <thead>{children}</thead>;
  }

  return (
    <thead>
      <tr>
        {columns.map((col, idx) => {
          const headerClasses = [
            col.align === 'right' || col.num ? 'num' : '',
            col.headerClassName || '',
          ].filter(Boolean).join(' ');

          return (
            <th
              key={col.key || idx}
              scope="col"
              className={headerClasses || undefined}
              style={col.headerStyle}
            >
              {col.header}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

export function DataTableBody({ children }) {
  return <tbody>{children}</tbody>;
}

export function DataTableRow({
  children,
  onClick,
  className = '',
  style,
  ...props
}) {
  const isClickable = Boolean(onClick);
  return (
    <tr
      onClick={onClick}
      style={{ ...(isClickable ? { cursor: 'pointer' } : {}), ...style }}
      className={className}
      {...props}
    >
      {children}
    </tr>
  );
}

export function DataTableCell({
  children,
  className = '',
  num = false,
  price = false,
  tax = false,
  style,
  ...props
}) {
  const classes = [
    num ? 'num' : '',
    price ? 'price' : '',
    tax ? 'tax' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <td className={classes || undefined} style={style} {...props}>
      {children}
    </td>
  );
}
