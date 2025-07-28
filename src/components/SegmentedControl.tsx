import React from 'react';
import './SegmentedControl.css';

interface SegmentedControlProps {
  segments: string[];
  activeTab: number;
  onTabChange: (index: number) => void;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  activeTab,
  onTabChange
}) => {
  const shouldShowDivider = (index: number) => {
    const isCurrentActive = index === activeTab;
    const isNextActive = index + 1 === activeTab;
    return !isCurrentActive && !isNextActive && index < segments.length - 1;
  };

  return (
    <div className="segmented-control-container">
      {segments.map((label, index) => (
        <div key={index} className="segment-wrapper">
          <button
            onClick={() => onTabChange(index)}
            type="button"
            className={`segment-button ${activeTab === index ? 'active' : 'inactive'} body-2-bold`}
          >
            {label}
          </button>
          {shouldShowDivider(index) && <div className="segment-divider" />}
        </div>
      ))}
    </div>
  );
};

export default SegmentedControl;
