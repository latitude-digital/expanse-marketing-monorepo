import React, { useEffect, useState } from 'react';
import tagsService from '../services/tagsService';

interface TagPillProps {
  tagId: string;
  showRemove?: boolean;
  onRemove?: () => void;
  className?: string;
}

const TagPill: React.FC<TagPillProps> = ({ tagId, showRemove = false, onRemove, className = '' }) => {
  const [tagName, setTagName] = useState<string>(tagId);
  const [tagColor, setTagColor] = useState<string>('#6B7280');

  useEffect(() => {
    const loadTag = async () => {
      const tag = await tagsService.getTag(tagId);
      if (tag) {
        setTagName(tag.name);
        setTagColor(tag.color || '#6B7280');
      }
    };
    loadTag();
  }, [tagId]);

  const baseClasses = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  const colorClasses = `bg-gray-100 text-gray-800`;

  return (
    <span
      className={`${baseClasses} ${colorClasses} ${className}`}
      style={{ 
        backgroundColor: `${tagColor}20`,
        color: tagColor,
        borderColor: tagColor,
        borderWidth: '1px',
        borderStyle: 'solid'
      }}
    >
      {tagName}
      {showRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-gray-200"
          aria-label={`Remove ${tagName}`}
        >
          <span className="text-gray-500">×</span>
        </button>
      )}
    </span>
  );
};

export default TagPill;