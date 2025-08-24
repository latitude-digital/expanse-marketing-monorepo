import React, { useState, useRef, useEffect } from 'react';
import GlobeIcon from '../assets/icons/ford/globe.svg';
import PrivacyChoicesIcon from '../assets/icons/ford/privacy-choices.svg';
import FordOvalLogo from '../assets/ford-oval-logo.svg';
import LincolnSignature from '../assets/lincoln-signature.svg';
import LincolnStarLogo from '../assets/lincoln-star-logo.svg';
import './GlobalFooter.css';

interface GlobalFooterProps {
  brand: 'Ford' | 'Lincoln';
  supportedLanguages?: string[];
  currentLocale?: string;
  onLanguageChange?: (languageCode: string) => void;
  showLanguageSelector?: boolean;
}

const GlobalFooter: React.FC<GlobalFooterProps> = ({
  brand,
  supportedLanguages = [],
  currentLocale = 'en',
  onLanguageChange = () => {},
  showLanguageSelector = false
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
    onLanguageChange(locale);
    setIsDropdownOpen(false);
  };

  const getLanguageDisplayName = (locale: string) => {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'es': brand === 'Ford' ? 'Spanish' : 'Español',
      'fr': 'French'
    };
    return languageNames[locale] || locale;
  };

  const getLanguageCode = (locale: string) => {
    return locale.toUpperCase().slice(0, 2);
  };

  // Filter out any non-language options like 'Other' from supported locales
  const filteredSupportedLanguages = supportedLanguages.filter(locale => 
    locale !== 'Other' && locale !== 'other' && locale.length <= 5
  );

  // Brand-specific link mapping
  const getFooterLinks = () => {
    if (brand === 'Lincoln') {
      return [
        { text: '© 2025 Lincoln Motor Company', url: 'https://www.lincoln.com' },
        { text: 'Privacy Notice', url: 'https://www.lincoln.com/help/privacy-terms/' },
        { text: 'Your Privacy Choices', url: 'https://www.lincoln.com/help/privacy/ccpa/' },
        { text: 'Interest Based Ads', url: 'https://www.lincoln.com/help/privacy-terms/#privacy' },
      ];
    }
    // Default to Ford links
    return [
      { text: '© 2025 Ford Motor Company', url: 'https://www.ford.com' },
      { text: 'Privacy Notice', url: 'https://www.ford.com/help/privacy/' },
      { text: 'Your Privacy Choices', url: 'https://www.ford.com/help/privacy/ccpa/' },
      { text: 'Interest Based Ads', url: 'https://www.ford.com/help/privacy/#interest' },
    ];
  };

  const footerLinks = getFooterLinks();
  const shouldShowLanguageSelector = showLanguageSelector && filteredSupportedLanguages.length > 1 && brand === 'Ford';

  return (
    <footer className={`global-footer-container brand-${brand.toLowerCase()}`}>
      
      {/* Language Section - Ford only */}
      {shouldShowLanguageSelector && (
        <div className="global-footer-language-change">
          <img 
            src={GlobeIcon}
            alt="Globe"
            className="global-footer-globe-icon"
          />
          
          {/* Ford: Dropdown with full language names */}
          <div ref={dropdownRef} className="global-footer-language-dropdown-container">
            <button
              onClick={handleLanguageClick}
              className="global-footer-language-dropdown-button"
            >
              <span>{getLanguageDisplayName(currentLocale)}</span>
              <span className="global-footer-dropdown-arrow">▼</span>
            </button>
            
            {isDropdownOpen && (
              <div className="global-footer-language-dropdown">
                {filteredSupportedLanguages.map((locale) => (
                  <button
                    key={locale}
                    onClick={() => handleLanguageSelect(locale)}
                    className={`global-footer-language-dropdown-option ${locale === currentLocale ? 'selected' : ''}`}
                  >
                    {getLanguageDisplayName(locale)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lincoln: Logo and Links side by side */}
      {brand === 'Lincoln' && (
        <div className="global-footer-lincoln-content">
          <div className="global-footer-logo">
            <a href="https://www.lincoln.com" target="_blank" rel="noopener noreferrer">
              <img
                src={LincolnStarLogo}
                alt="Lincoln Logo"
                className="global-footer-logo-image"
              />
            </a>
          </div>
          <div className="global-footer-links-section">
            {footerLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="global-footer-link"
              >
                {link.text.toUpperCase()}
                {link.text === 'Your Privacy Choices' && (
                  <img
                    src={PrivacyChoicesIcon}
                    alt="Privacy Choices"
                    className="global-footer-privacy-icon"
                  />
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Ford: Links Section */}
      {brand === 'Ford' && (
        <div className="global-footer-links-section">
          {footerLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="global-footer-link"
            >
              {link.text}
              {link.text === 'Your Privacy Choices' && (
                <img
                  src={PrivacyChoicesIcon}
                  alt="Privacy Choices"
                  className="global-footer-privacy-icon"
                />
              )}
            </a>
          ))}
        </div>
      )}

      {/* Brand Logo - Ford shows logo last */}
      {brand === 'Ford' && (
        <div className="global-footer-logo">
          <a href="https://www.ford.com" target="_blank" rel="noopener noreferrer">
            <img
              src={FordOvalLogo}
              alt="Ford Logo"
              className="global-footer-logo-image"
            />
          </a>
        </div>
      )}
    </footer>
  );
};

export default GlobalFooter;