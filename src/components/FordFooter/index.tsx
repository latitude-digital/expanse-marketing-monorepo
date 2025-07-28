import React from 'react';
import GlobeIcon from '../../assets/icons/ford/globe.svg';
import PrivacyChoicesIcon from '../../assets/icons/ford/privacy-choices.svg';
import FordSignature from '../../assets/ford-signature.svg';
import './_index.css';

interface FordFooterProps {
  supportedLanguages?: string[]; // Array of 2-char language codes
  onLanguageChange?: (languageCode: string) => void;
  onPrivacyChoicesClick?: () => void;
}

const FordFooter: React.FC<FordFooterProps> = ({
  supportedLanguages,
  onLanguageChange = () => {},
  onPrivacyChoicesClick = () => {}
}) => {
  const footerLinks = [
    { text: '© 2025 Ford Motor Company', url: 'https://www.ford.com' },
    { text: 'Privacy Notice', url: 'https://www.ford.com/help/privacy/' },
    // { text: 'Cookie Settings', url: 'https://www.ford.com/help/privacy/#cookies' },
    { text: 'Your Privacy Choices', url: 'https://www.ford.com/help/privacy/your-privacy-choices/' },
    { text: 'Interest Based Ads', url: 'https://www.ford.com/help/privacy/#interest' },
  ];

  return (
    <div className="footer-container">
      {/* Language Change Section - Only show if supported languages are provided */}
      {supportedLanguages && supportedLanguages.length > 0 && (
        <div className="language-change">
          <img 
            src={GlobeIcon}
            alt="Globe"
            className="globe-icon"
          />
          <select 
            className="language-select"
            onChange={(e) => onLanguageChange(e.target.value)}
          >
            {supportedLanguages.map((code) => (
              <option key={code} value={code}>
                {new Intl.DisplayNames([code], { type: 'language' }).of(code)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Links Section */}
      <div className="links-section">
        {footerLinks.map((link, index) => (
          <a
            key={index}
            href={link.url}
            className="footer-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {link.text}
            {link.text === 'Your Privacy Choices' && (
              <img
                src={PrivacyChoicesIcon}
                alt="Privacy Choices"
                className="privacy-icon"
                onClick={(e) => {
                  e.preventDefault();
                  onPrivacyChoicesClick();
                }}
              />
            )}
          </a>
        ))}
      </div>

      {/* Ford Logo */}
      <div className="ford-logo">
        <a href="https://www.ford.com" target="_blank" rel="noopener noreferrer">
          <img
            src={FordSignature}
            alt="Ford Logo"
            className="ford-signature"
          />
        </a>
      </div>
    </div>
  );
};

export default FordFooter;
