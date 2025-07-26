import React from 'react';
import clsx from 'clsx';

interface StatusBadgeProps {
  status?: string;
  variant?: 'success' | 'warning' | 'danger' | 'info';
  color?: 'red' | 'yellow' | 'green' | 'blue' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  children?: React.ReactNode;
  className?: string;
}

const statusConfig = {
  ACTIVE: { label: '啟用', className: 'status-active' },
  INACTIVE: { label: '未啟用', className: 'status-inactive' },
  SUSPENDED: { label: '暫停', className: 'status-suspended' },
  TERMINATED: { label: '終止', className: 'status-expired' },
  VALID: { label: '有效', className: 'status-active' },
  EXPIRED: { label: '過期', className: 'status-expired' },
  REVOKED: { label: '撤銷', className: 'status-expired' },
  DRAFT: { label: '草稿', className: 'status-inactive' },
  SUBMITTED: { label: '已提交', className: 'bg-blue-100 text-blue-800' },
  APPROVED: { label: '已核准', className: 'status-active' },
  IN_PROGRESS: { label: '進行中', className: 'bg-blue-100 text-blue-800' },
  COMPLETED: { label: '已完成', className: 'status-active' },
  CANCELLED: { label: '已取消', className: 'status-expired' },
  PENDING: { label: '等待中', className: 'bg-yellow-100 text-yellow-800' },
  SUCCESS: { label: '成功', className: 'status-active' },
  FAILED: { label: '失敗', className: 'status-expired' },
  PARTIAL: { label: '部分成功', className: 'status-suspended' },
  LOW: { label: '低', className: 'status-active' },
  MEDIUM: { label: '中', className: 'status-suspended' },
  HIGH: { label: '高', className: 'status-expired' },
};

const variantConfig = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

const colorConfig = {
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-800',
};

const sizeConfig = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  color,
  size = 'md',
  label,
  children,
  className,
}) => {
  // 如果提供了 color，則使用 color 樣式
  if (color) {
    return (
      <span
        className={clsx(
          'inline-flex items-center font-medium rounded-full',
          sizeConfig[size],
          colorConfig[color],
          className
        )}
      >
        {children || label}
      </span>
    );
  }

  // 如果提供了 variant，則使用 variant 樣式
  if (variant) {
    return (
      <span
        className={clsx(
          'inline-flex items-center font-medium rounded-full',
          sizeConfig[size],
          variantConfig[variant],
          className
        )}
      >
        {children || label}
      </span>
    );
  }

  // 否則使用原來的 status 邏輯
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    className: 'status-inactive',
  };

  return (
    <span
      className={clsx(
        'status-badge',
        config.className,
        className
      )}
    >
      {children || label || config.label}
    </span>
  );
};