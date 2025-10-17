import { useCallback, useRef } from 'react';
import { router } from 'expo-router';

/**
 * Hook to prevent rage clicking on navigation buttons
 * Debounces navigation calls to prevent duplicate navigation events
 *
 * @param delay - Delay in milliseconds before allowing next navigation (default: 500ms)
 * @returns Object with navigate and replace functions
 */
export const useDebounceNavigation = (delay: number = 500) => {
  const isNavigatingRef = useRef(false);

  const navigate = useCallback((href: string | { pathname: string; params?: Record<string, any> }) => {
    if (isNavigatingRef.current) {
      console.log('[useDebounceNavigation] Navigation blocked - already navigating');
      return;
    }

    isNavigatingRef.current = true;

    if (typeof href === 'string') {
      router.push(href);
    } else {
      router.push(href);
    }

    setTimeout(() => {
      isNavigatingRef.current = false;
    }, delay);
  }, [delay]);

  const replace = useCallback((href: string | { pathname: string; params?: Record<string, any> }) => {
    if (isNavigatingRef.current) {
      console.log('[useDebounceNavigation] Replace blocked - already navigating');
      return;
    }

    isNavigatingRef.current = true;

    if (typeof href === 'string') {
      router.replace(href);
    } else {
      router.replace(href);
    }

    setTimeout(() => {
      isNavigatingRef.current = false;
    }, delay);
  }, [delay]);

  return { navigate, replace };
};
