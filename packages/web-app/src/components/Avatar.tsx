import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { UserIcon } from '@heroicons/react/24/solid';

const avatarVariants = cva(
  'relative inline-flex items-center justify-center font-medium rounded-full',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg',
        xl: 'h-14 w-14 text-xl',
        '2xl': 'h-16 w-16 text-2xl'
      },
      color: {
        gray: 'bg-gray-100 text-gray-600',
        primary: 'bg-blue-100 text-blue-700',
        secondary: 'bg-gray-100 text-gray-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-yellow-100 text-yellow-700',
        danger: 'bg-red-100 text-red-700',
        indigo: 'bg-indigo-100 text-indigo-700',
        purple: 'bg-purple-100 text-purple-700',
        pink: 'bg-pink-100 text-pink-700'
      }
    },
    defaultVariants: {
      size: 'md',
      color: 'gray'
    }
  }
);

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  initials?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  children?: React.ReactNode;
}

export default function Avatar({
  src,
  alt,
  initials,
  icon: Icon = UserIcon,
  size,
  color,
  className,
  children
}: AvatarProps) {
  const iconSizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-7 w-7',
    '2xl': 'h-8 w-8'
  };

  return (
    <span className={avatarVariants({ size, color, className })}>
      {src ? (
        <img
          className="h-full w-full rounded-full object-cover"
          src={src}
          alt={alt || ''}
        />
      ) : children ? (
        children
      ) : initials ? (
        <span aria-hidden="true">{initials}</span>
      ) : (
        <Icon className={iconSizeClasses[size || 'md']} aria-hidden="true" />
      )}
    </span>
  );
}

// Avatar group component for displaying multiple avatars
export function AvatarGroup({
  children,
  max = 3,
  className = ''
}: {
  children: React.ReactNode;
  max?: number;
  className?: string;
}) {
  const childrenArray = React.Children.toArray(children);
  const visibleChildren = childrenArray.slice(0, max);
  const remainingCount = childrenArray.length - max;

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {visibleChildren}
      {remainingCount > 0 && (
        <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}