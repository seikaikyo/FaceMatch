import React from 'react';
import clsx from 'clsx';

interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, record: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TablePropsWithColumns<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyText?: string;
  className?: string;
  children?: never;
}

interface TablePropsWithChildren {
  children: React.ReactNode;
  className?: string;
  data?: never;
  columns?: never;
  loading?: never;
  emptyText?: never;
}

type TableProps<T> = TablePropsWithColumns<T> | TablePropsWithChildren;

export function Table<T extends Record<string, any>>(props: TableProps<T>) {
  // 如果有 children，使用簡單模式
  if ('children' in props && props.children) {
    return (
      <div className={clsx('overflow-x-auto', props.className)}>
        <table className="table">
          {props.children}
        </table>
      </div>
    );
  }

  // 否則使用完整模式
  const {
    data,
    columns,
    loading = false,
    emptyText = '暫無資料',
    className,
  } = props as TablePropsWithColumns<T>;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="table">
        <thead className="table-header">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={clsx('table-header-cell', {
                  'text-center': column.align === 'center',
                  'text-right': column.align === 'right',
                })}
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="table-body">
          {data.map((record, index) => (
            <tr key={index}>
              {columns.map((column) => {
                const value = column.key === 'index' ? index + 1 : record[column.key as keyof T];
                const content = column.render ? column.render(value, record) : value;
                
                return (
                  <td
                    key={String(column.key)}
                    className={clsx('table-cell', {
                      'text-center': column.align === 'center',
                      'text-right': column.align === 'right',
                    })}
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}