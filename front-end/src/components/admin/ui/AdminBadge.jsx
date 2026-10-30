import React from 'react';

/**
 * Standard semantic badge for 404Studio Admin
 * @param {string} variant - 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary'
 * @param {boolean} dot - whether to show a status dot
 * @param {'sm' | 'md'} size - badge size
 */
export const AdminBadge = ({
  children,
  variant = 'neutral',
  dot = false,
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    success:
      'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
    warning:
      'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
    danger:
      'bg-red-50 text-red-700 border-red-200/80 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60',
    info:
      'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/60',
    primary:
      'bg-[#05251C]/10 text-[#05251C] border-[#05251C]/20 dark:bg-[#F5DD20]/15 dark:text-[#F5DD20] dark:border-[#F5DD20]/30',
    neutral:
      'bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  const dotStyles = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-sky-500',
    primary: 'bg-[#05251C] dark:bg-[#F5DD20]',
    neutral: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border tracking-wide transition-colors ${
        variantStyles[variant] || variantStyles.neutral
      } ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${
            dotStyles[variant] || dotStyles.neutral
          }`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};

export default AdminBadge;
