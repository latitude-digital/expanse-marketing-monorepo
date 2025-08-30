import React, { useRef } from 'react';
import { useCalendar, useCalendarGrid, useCalendarCell } from '@react-aria/calendar';
import { useCalendarState } from '@react-stately/calendar';
import { CalendarDate, parseDate, getLocalTimeZone, toCalendarDate } from '@internationalized/date';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Button from './Button';

interface CalendarProps {
  id?: string;
  value?: Date | null;
  onChange?: (date: Date) => void;
  min?: Date;
  max?: Date;
  focusedDate?: Date;
  isDateAvailable?: (date: Date) => boolean;
  isDateDisabled?: (date: Date) => boolean;
  customCellRender?: (date: Date, isAvailable: boolean, isSelected: boolean) => React.ReactNode;
  className?: string;
}

function CalendarCell({ state, date, isDateAvailable, isDateDisabled, customCellRender }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const {
    cellProps,
    buttonProps,
    isSelected,
    isOutsideVisibleRange,
    isDisabled,
    isFocused,
    formattedDate,
  } = useCalendarCell({ date }, state, ref);

  const jsDate = new Date(date.year, date.month - 1, date.day);
  const isAvailable = isDateAvailable ? isDateAvailable(jsDate) : true;
  const isManuallyDisabled = isDateDisabled ? isDateDisabled(jsDate) : false;
  const finalDisabled = isDisabled || isManuallyDisabled || !isAvailable;

  if (customCellRender) {
    return (
      <td {...cellProps} className="relative p-0">
        <div 
          {...buttonProps} 
          ref={ref}
          className="w-full"
        >
          {customCellRender(jsDate, isAvailable, isSelected)}
        </div>
      </td>
    );
  }

  return (
    <td {...cellProps} className="relative p-0">
      <div
        {...buttonProps}
        ref={ref}
        className={`
          w-full h-full p-2 text-center cursor-pointer
          ${isSelected ? 'bg-blue-600 text-white font-bold' : ''}
          ${!isSelected && isAvailable && !isManuallyDisabled ? 'bg-blue-100 text-blue-900 font-semibold hover:bg-blue-200' : ''}
          ${finalDisabled ? 'text-gray-400 cursor-not-allowed opacity-50' : ''}
          ${isOutsideVisibleRange ? 'text-gray-300' : ''}
          ${isFocused && !finalDisabled ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        `}
        aria-disabled={finalDisabled}
      >
        {date.day}
      </div>
    </td>
  );
}

function CalendarGrid({ state, ...props }: any) {
  const { gridProps, headerProps, weekDays } = useCalendarGrid(props, state);

  return (
    <table {...gridProps} className="w-full">
      <thead {...headerProps}>
        <tr>
          {weekDays.map((day, index) => (
            <th key={index} className="text-xs font-medium text-gray-700 p-2">
              {day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...Array(state.visibleRange.start.compare(state.visibleRange.end) <= 0 ? 6 : 0)].map((_, weekIndex) => (
          <tr key={weekIndex}>
            {[...Array(7)].map((_, dayIndex) => {
              const dateIndex = weekIndex * 7 + dayIndex;
              const date = state.visibleRange.start.add({ days: dateIndex });
              if (date.compare(state.visibleRange.end) > 0) {
                return <td key={dayIndex} />;
              }
              return (
                <CalendarCell
                  key={dayIndex}
                  state={state}
                  date={date}
                  isDateAvailable={props.isDateAvailable}
                  isDateDisabled={props.isDateDisabled}
                  customCellRender={props.customCellRender}
                />
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Calendar({
  id,
  value,
  onChange,
  min,
  max,
  focusedDate,
  isDateAvailable,
  isDateDisabled,
  customCellRender,
  className = '',
}: CalendarProps) {
  // Convert JS Date to CalendarDate
  const convertToCalendarDate = (date: Date | null | undefined) => {
    if (!date) return null;
    return toCalendarDate(date);
  };

  const state = useCalendarState({
    value: convertToCalendarDate(value),
    onChange: (date) => {
      if (onChange && date) {
        // Convert CalendarDate back to JS Date
        const jsDate = new Date(date.year, date.month - 1, date.day);
        onChange(jsDate);
      }
    },
    minValue: min ? convertToCalendarDate(min) : undefined,
    maxValue: max ? convertToCalendarDate(max) : undefined,
    focusedValue: focusedDate ? convertToCalendarDate(focusedDate) : undefined,
    isDisabled: (date) => {
      const jsDate = new Date(date.year, date.month - 1, date.day);
      
      // Check if date is disabled
      if (isDateDisabled && isDateDisabled(jsDate)) {
        return true;
      }
      
      // Check if date is available
      if (isDateAvailable && !isDateAvailable(jsDate)) {
        return true;
      }
      
      return false;
    },
  });

  const ref = useRef<HTMLDivElement>(null);
  const { calendarProps, prevButtonProps, nextButtonProps, title } = useCalendar(
    {
      minValue: min ? convertToCalendarDate(min) : undefined,
      maxValue: max ? convertToCalendarDate(max) : undefined,
    },
    state,
    ref
  );

  return (
    <div {...calendarProps} ref={ref} className={`inline-block p-4 bg-white rounded-lg shadow ${className}`} id={id}>
      <div className="flex items-center justify-between mb-4">
        <button
          {...prevButtonProps}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <button
          {...nextButtonProps}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
      <CalendarGrid 
        state={state} 
        isDateAvailable={isDateAvailable}
        isDateDisabled={isDateDisabled}
        customCellRender={customCellRender}
      />
    </div>
  );
}