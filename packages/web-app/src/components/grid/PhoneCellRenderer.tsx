import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';

/**
 * PhoneCellRenderer - Makes phone numbers clickable with tel: links
 */
export const PhoneCellRenderer: React.FC<ICellRendererParams> = (params) => {
  const phoneNumber = params.value;
  
  if (!phoneNumber) {
    return null;
  }

  // Clean phone number for tel: link (remove non-numeric except + for international)
  const cleanPhone = String(phoneNumber).replace(/[^\d+]/g, '');
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = `tel:${cleanPhone}`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as any);
    }
  };

  return (
    <a
      href={`tel:${cleanPhone}`}
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
      aria-label={`Call ${phoneNumber}`}
    >
      📞 {phoneNumber}
    </a>
  );
};