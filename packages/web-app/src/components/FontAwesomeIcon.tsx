import React from 'react';

interface FontAwesomeIconProps {
  src: string;
  className?: string;
  'aria-hidden'?: boolean;
}

/**
 * Simple wrapper component for FontAwesome SVG icons
 */
export const FontAwesomeIcon: React.FC<FontAwesomeIconProps> = ({ src, className = '', ...props }) => {
  return <img src={src} className={className} alt="" {...props} />;
};