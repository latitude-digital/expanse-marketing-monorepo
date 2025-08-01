import React, { useState } from 'react';
import globeIcon from '../assets/icons/ford/globe.svg';

// Survey type placeholder - this will be properly typed when we convert the main Survey component
interface Survey {
  locale: string;
}

interface LanguageSelectorProps {
  survey: Survey;
  supportedLocales: string[];
  currentLocale: string;
  onChange: (locale: string) => void;
}

// Standard Language selector component
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  survey, 
  supportedLocales, 
  currentLocale, 
  onChange 
}) => {
  if (!supportedLocales || supportedLocales.length <= 1) return null;
  
  return (
    <div className="language-selector" style={{ textAlign: 'right', padding: '10px 20px' }}>
      <select 
        value={currentLocale} 
        onChange={(e) => onChange(e.target.value)}
        style={{ 
          padding: '5px 10px', 
          borderRadius: '4px',
          border: '1px solid #ccc',
          minWidth: '120px',
          width: 'auto'
        }}
      >
        {supportedLocales.map(locale => (
          <option key={locale} value={locale}>
            {getLocaleDisplayName(locale)}
          </option>
        ))}
      </select>
    </div>
  );
};

// Ford Language selector component with globe icon
export const FordLanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  survey, 
  supportedLocales, 
  currentLocale, 
  onChange 
}) => {
  if (!supportedLocales || supportedLocales.length <= 1) return null;
  
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleDropdown = () => setIsOpen(!isOpen);
  
  const selectLanguage = (locale: string) => {
    onChange(locale);
    setIsOpen(false);
  };
  
  return (
    <div className="ford-language-selector" style={{ position: 'relative' }}>
      <button 
        onClick={toggleDropdown}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '5px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <img src={globeIcon} alt="Language" style={{ height: '24px', width: '24px' }} />
      </button>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          background: 'white',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderRadius: '4px',
          zIndex: 1000,
          minWidth: '150px'
        }}>
          {supportedLocales.map(locale => (
            <div 
              key={locale}
              onClick={() => selectLanguage(locale)}
              style={{
                padding: '10px 15px',
                cursor: 'pointer',
                backgroundColor: locale === currentLocale ? '#f0f0f0' : 'transparent',
                borderBottom: '1px solid #eee'
              }}
            >
              {getLocaleDisplayName(locale)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to get display name for locale
const getLocaleDisplayName = (locale: string): string => {
  switch (locale) {
    case 'en': return 'English';
    case 'es': return 'Español';
    case 'fr': return 'Français';
    case 'de': return 'Deutsch';
    case 'pt': return 'Português';
    case 'it': return 'Italiano';
    case 'nl': return 'Nederlands';
    case 'ru': return 'Русский';
    case 'ja': return '日本語';
    case 'zh': return '中文';
    default: return locale;
  }
};