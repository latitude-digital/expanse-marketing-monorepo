import React from 'react';

// Skeleton component for loading states
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

// Survey skeleton loader - shows the shape of a survey being loaded
export function SurveySkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Title skeleton */}
      <Skeleton className="h-8 w-3/4" />
      
      {/* Question skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-2/3" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-4/5" />
          </div>
        </div>
      ))}
      
      {/* Button skeleton */}
      <Skeleton className="h-12 w-32" />
    </div>
  );
}

// Stats/Results skeleton loader
export function StatsSkeleton() {
  return (
    <div className="p-6 space-y-8">
      {/* Title skeleton */}
      <Skeleton className="h-8 w-96" />
      
      {/* Question result skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-7 w-80" />
          <div className="max-w-lg space-y-0">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex border border-gray-200 dark:border-gray-600 -mb-px">
                <Skeleton className="flex-1 h-10 m-1" />
                <Skeleton className="w-16 h-10 m-1" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Grid/Table skeleton loader for CheckIn/CheckOut screens
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full">
      {/* Header skeleton */}
      <div className="flex gap-4 p-4 border-b-2 border-gray-200 dark:border-gray-600">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-24" />
      </div>
      
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-gray-100 dark:border-gray-700">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-10 w-24" />
        </div>
      ))}
    </div>
  );
}

// Loading message with context
export function LoadingMessage({ 
  message, 
  subMessage 
}: { 
  message: string; 
  subMessage?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-2">
      <div className="text-lg font-medium text-gray-900 dark:text-white">
        {message}
      </div>
      {subMessage && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {subMessage}
        </div>
      )}
    </div>
  );
}

// Inline loading indicator (replaces spinner for small contexts)
export function InlineLoader({ text = "Loading" }: { text?: string }) {
  return (
    <span className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
      {text}
      <span className="inline-flex ml-1">
        <span className="animate-bounce delay-0 mr-px">.</span>
        <span className="animate-bounce delay-100 mr-px">.</span>
        <span className="animate-bounce delay-200">.</span>
      </span>
    </span>
  );
}

// Progress bar for multi-step operations
export function ProgressBar({ 
  progress, 
  label 
}: { 
  progress: number; 
  label?: string;
}) {
  return (
    <div className="w-full space-y-2">
      {label && (
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

// Simple spinner component
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 ${className}`}></div>
    </div>
  );
}

// Export all loading states as a namespace
export const LoadingStates = {
  Skeleton,
  SurveySkeleton,
  StatsSkeleton,
  TableSkeleton,
  LoadingMessage,
  InlineLoader,
  ProgressBar,
  Spinner
};

// Add CSS for the bounce animation delays
const styles = `
  @keyframes bounce {
    0%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-0.25rem);
    }
  }
  
  .animate-bounce {
    animation: bounce 1.4s infinite;
  }
  
  .delay-0 {
    animation-delay: 0ms;
  }
  
  .delay-100 {
    animation-delay: 100ms;
  }
  
  .delay-200 {
    animation-delay: 200ms;
  }
`;

// Inject styles (in a real app, add these to your global CSS)
if (typeof document !== 'undefined' && !document.getElementById('loading-states-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'loading-states-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}