import React from 'react';
import Icon from "@ui/ford-ui-components/src/v2/icon/Icon";

interface FDSErrorDisplayProps {
  message: string;
}

export const FDSErrorDisplay: React.FC<FDSErrorDisplayProps> = ({ message }) => {
  return (
    <div className="flex shrink-0 pt-1 text-ford-caption-semibold text-ford-fill-danger-strong text-xs font-semibold pl-1 items-center gap-1">
      <Icon name="errorCircle" height="18" width="18" />
      {message}
    </div>
  );
};