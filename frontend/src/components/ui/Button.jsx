import React from "react";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  isLoading = false,
  type = "button",
  onClick,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center font-display uppercase tracking-wider text-sm btn-tactile disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

  const sizes = {
    sm: "px-3 py-1.5 min-h-[36px] text-xs",
    md: "px-5 py-2.5 min-h-[44px]",
    lg: "px-7 py-3.5 min-h-[50px] text-base",
  };

  const variants = {
    primary:
      "bg-[#f4f0e8] text-[#0c0c0e] hover:bg-[#ffffff] font-semibold border border-transparent",
    signal:
      "bg-[#e65100] text-white hover:bg-[#ff6d00] font-semibold shadow-md",
    secondary:
      "bg-transparent text-[#f4f0e8] border border-[rgba(244,240,232,0.2)] hover:border-[#f4f0e8] hover:bg-[rgba(244,240,232,0.05)]",
    ghost:
      "bg-transparent text-[#9a989f] hover:text-[#f4f0e8] hover:bg-[rgba(244,240,232,0.05)]",
    danger:
      "bg-red-600 text-white hover:bg-red-500",
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Đang xử lý...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export function Input({
  label,
  error,
  className = "",
  id,
  type = "text",
  ...props
}) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs uppercase tracking-wider text-[#9a989f] font-medium">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`w-full min-h-[44px] px-3.5 py-2.5 bg-[#161619] border ${
          error ? "border-red-500 focus:border-red-500" : "border-[rgba(244,240,232,0.15)] focus:border-[#e65100]"
        } text-[#f4f0e8] placeholder-[#6b6973] text-sm rounded-none transition-colors duration-150 ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-400 mt-0.5">{error}</span>}
    </div>
  );
}

export function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-[#25252b] text-[#f4f0e8] border border-[rgba(244,240,232,0.1)]",
    signal: "bg-[rgba(230,81,0,0.15)] text-[#ff6d00] border border-[rgba(230,81,0,0.4)]",
    success: "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50",
    warning: "bg-amber-950/60 text-amber-400 border border-amber-800/50",
    danger: "bg-red-950/60 text-red-400 border border-red-800/50",
    cobalt: "bg-blue-950/60 text-blue-400 border border-blue-800/50",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-mono tracking-wider uppercase ${variants[variant] || variants.default} ${className}`}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-[#1e1e23] border border-[rgba(244,240,232,0.05)] ${className}`} />
  );
}
