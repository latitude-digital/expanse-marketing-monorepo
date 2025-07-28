import React, { useEffect, useState } from 'react';
import { ensureCloudFrontAccess } from '../services/cloudFrontAuth';

interface CloudFrontImageProps {
  src: string | { content: string; name?: string; type?: string } | any;
  alt?: string;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  fallback?: React.ReactNode;
  maxHeight?: number | string;
  maxWidth?: number | string;
}

/**
 * CloudFrontImage - Standardized component for displaying CloudFront authenticated images
 * 
 * Features:
 * - Handles various data formats (string URL, object with content property, etc.)
 * - Ensures CloudFront authentication is ready before displaying
 * - Shows loading state while waiting for auth
 * - Provides error handling with fallback
 * 
 * Use this component anywhere you need to display images from uploads.expansemarketing.com
 */
export const CloudFrontImage: React.FC<CloudFrontImageProps> = ({
  src,
  alt = 'Image',
  style,
  className,
  onClick,
  onLoad,
  onError,
  fallback,
  maxHeight = 120,
  maxWidth = 200
}) => {
  const [cloudFrontReady, setCloudFrontReady] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Extract URL from various formats
  const getImageUrl = (value: any): string | null => {
    if (!value) return null;
    
    // Direct URL string
    if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:'))) {
      return value;
    }
    
    // Object with content property (SurveyJS file upload format)
    if (typeof value === 'object' && value.content) {
      return value.content;
    }
    
    // Object with url property
    if (typeof value === 'object' && value.url) {
      return value.url;
    }
    
    // Array of images
    if (Array.isArray(value) && value.length > 0) {
      // Recursively get URL from first item
      return getImageUrl(value[0]);
    }
    
    return null;
  };

  const imageUrl = getImageUrl(src);

  useEffect(() => {
    // Ensure CloudFront access before showing image
    ensureCloudFrontAccess()
      .then(() => {
        setCloudFrontReady(true);
        setLoading(false);
      })
      .catch(err => {
        console.error('CloudFront access setup failed:', err);
        setCloudFrontReady(true); // Try anyway
        setLoading(false);
      });
  }, []);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageError(true);
    console.error('Failed to load CloudFront image:', imageUrl);
    if (onError) onError(e);
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setLoading(false);
    if (onLoad) onLoad(e);
  };

  // No valid image URL
  if (!imageUrl) {
    return null;
  }

  // Show error/fallback
  if (imageError && fallback) {
    return <>{fallback}</>;
  }

  // Default error state
  if (imageError) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        color: '#999',
        fontSize: '12px',
        padding: '8px',
        maxHeight,
        maxWidth,
        ...style
      }}>
        ❌ Image Error
      </div>
    );
  }

  // Loading state while waiting for CloudFront
  if (loading || !cloudFrontReady) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        color: '#999',
        fontSize: '12px',
        padding: '8px',
        maxHeight,
        maxWidth,
        ...style
      }}>
        Loading image...
      </div>
    );
  }

  // Render image
  const imgElement = (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      style={{
        maxHeight,
        maxWidth,
        objectFit: 'contain',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        padding: '4px',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
      onLoad={handleLoad}
      onError={handleError}
      onClick={onClick}
    />
  );

  // Wrap in link if clickable
  if (onClick) {
    return imgElement;
  }

  // Make it a link to open in new tab
  return (
    <a
      href={imageUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'inline-block' }}
    >
      {imgElement}
    </a>
  );
};

export default CloudFrontImage;