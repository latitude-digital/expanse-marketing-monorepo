import React from 'react';

interface FontAwesomeIconProps {
  icon: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * FontAwesome Icon Component
 * Renders SVG icons from FontAwesome Pro
 * 
 * Usage:
 * <FontAwesomeIcon icon={arrowsDownToPeople} className="h-4 w-4" />
 */
export const FontAwesomeIcon: React.FC<FontAwesomeIconProps> = ({ 
  icon, 
  className = '', 
  style,
  onClick 
}) => {
  return (
    <span 
      className={className}
      style={style}
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: icon }}
    />
  );
};