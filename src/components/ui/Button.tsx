import React from 'react';

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

  const variants = {
    primary: 'bg-primary text-white hover:bg-[#005f92] active:bg-[#004d77]',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-border',
    outline: 'border border-border bg-transparent text-secondary-foreground hover:bg-secondary',
    ghost: 'bg-transparent text-secondary-foreground hover:bg-secondary',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    accent: 'bg-accent text-accent-foreground hover:brightness-95',
  };

  const sizes = {
    xs: 'text-xs px-2.5 py-1 rounded-md',
    sm: 'text-sm px-3 py-1.5 rounded-lg',
    md: 'text-sm px-4 py-2 rounded-md',
    lg: 'text-base px-6 py-3 rounded-md',
  };

  return (
    <button
      {...props}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}

      {children}
    </button>
  );
}
