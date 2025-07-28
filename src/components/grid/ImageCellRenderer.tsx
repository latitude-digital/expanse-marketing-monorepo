import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import CloudFrontImage from '../CloudFrontImage';

/**
 * ImageCellRenderer - Displays image thumbnails in AG Grid cells
 * 
 * Uses the standardized CloudFrontImage component to handle authentication
 * and various data formats consistently across the application.
 */
export const ImageCellRenderer: React.FC<ICellRendererParams> = (params) => {
  // No value to display
  if (!params.value) {
    return null;
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '8px',
      minHeight: '60px'
    }}>
      <CloudFrontImage
        src={params.value}
        alt={`${params.colDef?.headerName || 'Survey response'} image`}
        maxHeight={120}
        maxWidth={120}
        style={{
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      />
    </div>
  );
};

// For multiple images
export const MultiImageCellRenderer: React.FC<ICellRendererParams> = (params) => {
  // No value to display
  if (!params.value) {
    return null;
  }

  // If it's not an array, use single image renderer
  if (!Array.isArray(params.value)) {
    return <ImageCellRenderer {...params} />;
  }

  const images = params.value;
  
  if (images.length === 0) {
    return null;
  }

  if (images.length === 1) {
    return <ImageCellRenderer {...params} value={images[0]} />;
  }

  // Show first image with count badge
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center',
      gap: '8px',
      padding: '8px'
    }}>
      <CloudFrontImage
        src={images[0]}
        alt={`${params.colDef?.headerName || 'Survey response'} image 1 of ${images.length}`}
        maxHeight={120}
        maxWidth={120}
        style={{
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      />
      <span style={{ 
        fontSize: '12px', 
        color: '#666',
        whiteSpace: 'nowrap',
        backgroundColor: '#f0f0f0',
        padding: '4px 8px',
        borderRadius: '4px'
      }}>
        +{images.length - 1} more
      </span>
    </div>
  );
};