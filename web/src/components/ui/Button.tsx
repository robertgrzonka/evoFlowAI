'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    icon,
    iconPosition = 'left',
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-primary-500 hover:bg-primary-600 text-text-primary focus:ring-primary-500 shadow-md shadow-primary-900/20 hover:shadow-lg',
      secondary: 'bg-surface hover:bg-surface-elevated text-text-primary border border-border hover:border-info-500/30 focus:ring-primary-500',
      ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated focus:ring-primary-500',
      danger: 'bg-red-600 hover:bg-red-700 text-text-primary focus:ring-red-500 shadow-md hover:shadow-lg'
    };
    
    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-9 px-3.5 text-sm',
      lg: 'h-10 px-4 text-sm'
    };

    return (
      <motion.button
        ref={ref}
        whileHover={disabled || loading ? undefined : { y: -1 }}
        whileTap={disabled || loading ? undefined : { scale: 0.99 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={clsx(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {icon && iconPosition === 'left' && !loading && (
          <span className="mr-2">{icon}</span>
        )}
        
        {children}
        
        {icon && iconPosition === 'right' && !loading && (
          <span className="ml-2">{icon}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
