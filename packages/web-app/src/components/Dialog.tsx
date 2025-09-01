import React from 'react';
import { Dialog as HeadlessDialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { ExclamationTriangleIcon, CheckIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export interface DialogProps {
  open: boolean;
  onClose: (value: boolean) => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  type?: 'default' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const iconMap = {
  default: null,
  success: CheckIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

const iconColorMap = {
  default: '',
  success: 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400',
  warning: 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
};

const sizeMap = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

export default function Dialog({ 
  open, 
  onClose, 
  title, 
  children, 
  actions,
  type = 'default',
  size = 'md'
}: DialogProps) {
  const Icon = iconMap[type];
  const iconColor = iconColorMap[type];
  const maxWidth = sizeMap[size];

  return (
    <HeadlessDialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in dark:bg-gray-900/50"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full ${maxWidth} data-closed:sm:translate-y-0 data-closed:sm:scale-95 dark:bg-gray-800 dark:outline dark:-outline-offset-1 dark:outline-white/10`}
          >
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 dark:bg-gray-800">
              <div className={Icon ? "sm:flex sm:items-start" : ""}>
                {Icon && (
                  <div className={`mx-auto flex size-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:size-10 ${iconColor}`}>
                    <Icon aria-hidden="true" className="size-6" />
                  </div>
                )}
                <div className={Icon ? "mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left" : "mt-3"}>
                  {title && (
                    <DialogTitle as="h3" className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                      {title}
                    </DialogTitle>
                  )}
                  <div className="mt-2">
                    {children}
                  </div>
                </div>
              </div>
            </div>
            {actions && (
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 dark:bg-gray-700/25">
                {actions}
              </div>
            )}
          </DialogPanel>
        </div>
      </div>
    </HeadlessDialog>
  );
}

// Dialog Actions Bar component for convenience
export function DialogActionsBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 dark:bg-gray-700/25">
      {children}
    </div>
  );
}