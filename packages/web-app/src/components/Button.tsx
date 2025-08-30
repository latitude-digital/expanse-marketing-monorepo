import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500',
        secondary: 'bg-white text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20',
        tertiary: 'bg-indigo-50 text-indigo-600 shadow-xs hover:bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-400 dark:shadow-none dark:hover:bg-indigo-500/30',
        danger: 'bg-red-600 text-white shadow-xs hover:bg-red-500 dark:bg-red-500 dark:shadow-none dark:hover:bg-red-400',
        ghost: 'text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-white/10',
      },
      size: {
        xs: 'rounded-sm px-2 py-1 text-xs',
        sm: 'rounded-sm px-2 py-1 text-sm',
        md: 'rounded-md px-3 py-2 text-sm',
        lg: 'rounded-md px-3.5 py-2.5 text-sm',
        xl: 'rounded-md px-4 py-3 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, children, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <button
        className={`${buttonVariants({ variant, size, fullWidth })} ${className || ''}`}
        ref={ref}
        {...props}
      >
        {leftIcon && <span className="mr-2 -ml-0.5">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2 -mr-0.5">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

// Button Group component
export interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function ButtonGroup({ children, className = '' }: ButtonGroupProps) {
  return (
    <span className={`isolate inline-flex rounded-md shadow-xs dark:shadow-none ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        
        const isFirst = index === 0;
        const isLast = index === React.Children.count(children) - 1;
        
        let roundedClass = '';
        let marginClass = '';
        
        if (isFirst) {
          roundedClass = 'rounded-l-md';
        } else if (isLast) {
          roundedClass = 'rounded-r-md';
          marginClass = '-ml-px';
        } else {
          marginClass = '-ml-px';
        }
        
        return React.cloneElement(child as React.ReactElement<any>, {
          className: `${(child.props.className || '')} ${roundedClass} ${marginClass} relative focus:z-10`,
        });
      })}
    </span>
  );
}