import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * Page Header component with Breadcrumbs and Action Buttons
 */
export const AdminPageHeader = ({
  title,
  description,
  breadcrumbs = [],
  actions,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8 ${className}`}
    >
      <div>
        {breadcrumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-2 font-medium"
          >
            <Link
              to="/admin"
              className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Admin
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" />
                {crumb.path ? (
                  <Link
                    to={crumb.path}
                    className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-700 dark:text-slate-200 font-semibold">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>
      )}
    </div>
  );
};

export default AdminPageHeader;
