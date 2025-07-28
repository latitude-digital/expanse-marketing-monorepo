import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';

/**
 * EmailCellRenderer - Makes email addresses clickable with mailto: links
 */
export const EmailCellRenderer: React.FC<ICellRendererParams> = (params) => {
  const email = params.value;
  
  if (!email) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = `mailto:${email}`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as any);
    }
  };

  return (
    <a
      href={`mailto:${email}`}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      style={{
        color: '#1976d2',
        textDecoration: 'none',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}
      aria-label={`Email ${email}`}
    >
      ✉️ {email}
    </a>
  );
};