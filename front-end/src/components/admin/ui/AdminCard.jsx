import React from 'react';

/**
 * Standard Surface Card for 404Studio Admin Dashboard
 */
export const AdminCard = ({
  title,
  subtitle,
  extra,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  padding = 'p-6',
  noPadding = false,
}) => {
  const hasHeader = Boolean(title || subtitle || extra);

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-[0_1px_3px_0_rgb(0_0_0/0.03)] transition-all ${className}`}
    >
      {hasHeader && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 px-6 py-4.5 ${headerClassName}`}
        >
          <div>
            {title && (
              <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {extra && <div className="flex items-center gap-2">{extra}</div>}
        </div>
      )}
      <div className={noPadding ? bodyClassName : `${padding} ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default AdminCard;
