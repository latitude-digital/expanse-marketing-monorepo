import React, { useState, useRef, useEffect } from 'react';
import fordOvalLogo from '../assets/ford-oval-logo.svg';
import lincolnLogo from '../assets/lincoln-logo.svg';
import globeIcon from '../assets/icons/ford/globe.svg';

interface GlobalHeaderProps {
  brand: 'Ford' | 'Lincoln';
  showLanguageChooser?: boolean;
  supportedLocales?: string[];
  currentLocale?: string;
  onLanguageChange?: (locale: string) => void;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  brand,
  showLanguageChooser = false,
  supportedLocales = ['en', 'es'],
  currentLocale = 'en',
  onLanguageChange
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLanguageSelect = (locale: string) => {
    if (onLanguageChange) {
      onLanguageChange(locale);
    }
    setIsDropdownOpen(false);
  };

  const getLanguageDisplayCode = () => {
    return currentLocale.toUpperCase().slice(0, 2);
  };

  const getLanguageDisplayName = (locale: string) => {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'es': brand === 'Ford' ? 'Spanish' : 'Español',
      'fr': 'French'
    };
    return languageNames[locale] || locale;
  };

  // Filter out any non-language options like 'Other' from supported locales
  const filteredSupportedLocales = supportedLocales.filter(locale => 
    locale !== 'Other' && locale !== 'other' && locale.length <= 5
  );
  
  const shouldShowLanguageSelector = showLanguageChooser && filteredSupportedLocales.length > 1;

  const getLanguageCode = (locale: string) => {
    return locale.toUpperCase().slice(0, 2);
  };

  return (
    <header className="fds-global-header" style={{
      width: '100%',
      height: brand === 'Ford' ? '56px' : '70px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: brand === 'Ford' ? '0 16px' : '0 20px',
      backgroundColor: 'var(--semantic-color-fill-onlight-subtle, #ffffff)',
      borderBottom: '1px solid var(--semantic-color-stroke-onlight-subtle, #e0e0e0)'
    }}>
      {/* Left: Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: '100%'
      }}>
        {brand === 'Ford' ? (
          <img 
            src={fordOvalLogo} 
            alt="Ford" 
            style={{
              height: '28px',
              width: '74px',
              objectFit: 'contain'
            }}
          />
        ) : (
          <img 
            src={lincolnLogo} 
            alt="Lincoln" 
            style={{
              height: '36px',
              width: '102px',
              objectFit: 'contain'
            }}
          />
        )}
      </div>
      
      {/* Right: Language selector only */}
      <div style={{
        display: 'flex',
        alignItems: 'center'
      }}>
        {shouldShowLanguageSelector && (
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={handleLanguageClick}
              className="fds-language-button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--semantic-color-text-onlight-moderate-default, #333333)',
                fontSize: '14px',
                fontWeight: '400',
                borderRadius: '4px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--semantic-color-fill-onlight-subtle-hover, #f5f5f5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label={`Change language from ${brand === 'Ford' ? getLanguageDisplayName(currentLocale) : getLanguageDisplayCode()}`}
              aria-expanded={isDropdownOpen}
              aria-haspopup="listbox"
            >
              {brand === 'Ford' ? (
                <>
                  <img 
                    src={globeIcon} 
                    alt="" 
                    style={{
                      width: '16px',
                      height: '16px'
                    }}
                  />
                  <span>{getLanguageDisplayName(currentLocale)}</span>
                </>
              ) : (
                <span>{getLanguageDisplayCode()}</span>
              )}
            </button>
            
            {/* Language Dropdown */}
            {isDropdownOpen && (
              <div
                role="listbox"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  backgroundColor: 'var(--semantic-color-fill-onlight-subtle, #ffffff)',
                  border: '1px solid var(--semantic-color-stroke-onlight-subtle, #e0e0e0)',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  minWidth: brand === 'Ford' ? '120px' : '80px',
                  width: brand === 'Ford' ? 'auto' : '80px',
                  zIndex: 1000,
                  marginTop: '4px'
                }}
              >
                {filteredSupportedLocales.map((locale) => (
                  <button
                    key={locale}
                    role="option"
                    aria-selected={locale === currentLocale}
                    onClick={() => handleLanguageSelect(locale)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--semantic-color-text-onlight-moderate-default, #333333)',
                      fontSize: '14px',
                      fontWeight: locale === currentLocale ? '600' : '400',
                      textAlign: 'left',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      if (locale !== currentLocale) {
                        e.currentTarget.style.backgroundColor = 'var(--semantic-color-fill-onlight-subtle-hover, #f5f5f5)';
                      }
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {brand === 'Ford' ? (
                      getLanguageDisplayName(locale)
                    ) : (
                      getLanguageCode(locale)
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default GlobalHeader;