import { useEffect, useState, useRef } from 'react';

import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, collection, query, getDocs } from "firebase/firestore";
import auth from '../services/auth';

import { useAuthState } from 'react-firebase-hooks/auth';
import app from '../services/firebase';
import db from '../services/firestore';
import { ensureCloudFrontAccess } from '../services/cloudFrontAuth';

import { Model, Question, slk } from "survey-core";
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi, GridReadyEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

// Import custom survey question definitions
import AllSurveys from '../surveyjs_questions/AllSurveys';
import FordSurveysNew from '../surveyjs_questions/FordSurveysNew';
import LincolnSurveysNew from '../surveyjs_questions/LincolnSurveysNew';
import FMCSurveys from '../surveyjs_questions/FMCSurveys';
// Import AG Grid CSS
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import { ImageCellRenderer } from '../components/grid/ImageCellRenderer';
import { PhoneCellRenderer } from '../components/grid/PhoneCellRenderer';
import { EmailCellRenderer } from '../components/grid/EmailCellRenderer';
import './Dashboard.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

slk(
  "NDBhNThlYzYtN2EwMy00ZTgxLWIyNGQtOGFkZWJkM2NlNjI3OzE9MjAyNi0wNy0xOSwyPTIwMjYtMDctMTksND0yMDI2LTA3LTE5"
);

// Initialize only universal questions globally for the dashboard
// Brand-specific questions should be initialized per-event based on brand
AllSurveys.globalInit();

// Helper function to intelligently format array values
const formatArrayValue = (value: any): string => {
  if (!Array.isArray(value)) {
    return String(value);
  }

  // Check if this is an array of single characters (likely from incorrectly split string)
  const hasOnlyCharacters = value.every(item =>
    typeof item === 'string' && item.length === 1
  );

  if (hasOnlyCharacters && value.length > 3) {
    // Likely a string that was incorrectly split into characters, rejoin without commas
    return value.join('');
  } else {
    // Normal array of meaningful values, join with commas
    return value.map(v => String(v)).join(', ');
  }
};

// Helper function to dynamically format object values
const formatObjectValue = (obj: any, maxDepth: number = 2, currentDepth: number = 0): string => {
  console.log('[formatObjectValue] Called with:', { obj, type: typeof obj, isNull: obj === null });
  // Prevent infinite recursion
  if (currentDepth >= maxDepth) {
    return '[Complex Object]';
  }

  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return '';
  }

  // Handle primitives
  if (typeof obj !== 'object') {
    return String(obj);
  }

  // Handle dates
  if (obj instanceof Date) {
    return obj.toLocaleString();
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return formatArrayValue(obj);
  }

  // Handle objects - extract meaningful fields
  const keys = Object.keys(obj);

  // Filter out internal/private fields (starting with _)
  const publicKeys = keys.filter(k => !k.startsWith('_'));

  // If no public keys, return indication
  if (publicKeys.length === 0) {
    return '[No displayable data]';
  }

  // Build display pairs for meaningful fields
  const displayPairs: string[] = [];

  for (const key of publicKeys) {
    const value = obj[key];

    // Skip null/undefined/empty values
    if (value === null || value === undefined || value === '') {
      continue;
    }

    // Handle special data types
    if (typeof value === 'string') {
      // Check if it's an image/data URL
      if (value.startsWith('data:image') || (value.startsWith('http') && /\.(jpg|jpeg|png|gif|svg)$/i.test(value))) {
        displayPairs.push(`${key}: [Image]`);
      } else if (value.length > 100) {
        // Long strings - truncate
        displayPairs.push(`${key}: ${value.substring(0, 50)}...`);
      } else {
        displayPairs.push(`${key}: ${value}`);
      }
    } else if (typeof value === 'boolean') {
      displayPairs.push(`${key}: ${value ? 'Yes' : 'No'}`);
    } else if (typeof value === 'number') {
      displayPairs.push(`${key}: ${value}`);
    } else if (typeof value === 'object') {
      // Recursively format nested objects (with increased depth)
      const nestedValue = formatObjectValue(value, maxDepth, currentDepth + 1);
      if (nestedValue && nestedValue !== '[No displayable data]') {
        displayPairs.push(`${key}: ${nestedValue}`);
      }
    }

    // Limit number of fields shown to prevent overwhelming display
    if (displayPairs.length >= 5) {
      const remainingCount = publicKeys.length - displayPairs.length;
      if (remainingCount > 0) {
        displayPairs.push(`... +${remainingCount} more`);
      }
      break;
    }
  }

  // Return formatted pairs or indication of empty object
  return displayPairs.length > 0 ? displayPairs.join(', ') : '[No displayable data]';
};

// Helper function to build a map of choice values to display text for all questions
const buildChoicesMap = (survey: Model): Map<string, Map<any, string>> => {
  const choicesMap = new Map<string, Map<any, string>>();
  
  // Get all questions from the survey
  const allQuestions = survey.getAllQuestions();
  
  allQuestions.forEach(question => {
    const questionChoices = new Map<any, string>();
    const choiceSource: any = (question as any).contentQuestion || question;

    const registerChoice = (value: any, text: string) => {
      if (value === undefined || value === null) {
        return;
      }
      questionChoices.set(value, text);
      questionChoices.set(String(value), text);
    };

    // Check if choice source has explicit choices
    if (Array.isArray(choiceSource?.choices)) {
      choiceSource.choices.forEach((choice: any) => {
        if (typeof choice === 'string') {
          registerChoice(choice, choice);
        } else if (choice && typeof choice === 'object') {
          const value = choice.value !== undefined ? choice.value : choice;
          const text = choice.text || choice.title || choice.name || String(value);
          registerChoice(value, text);
        }
      });
    }

    // Handle dynamic choices loaded via choicesByUrl
    if (choiceSource?.choicesByUrl || choiceSource?.visibleChoices) {
      const visibleChoices = choiceSource.visibleChoices;
      if (Array.isArray(visibleChoices) && visibleChoices.length > 0) {
        visibleChoices.forEach((choice: any) => {
          if (typeof choice === 'string') {
            registerChoice(choice, choice);
          } else if (choice && typeof choice === 'object') {
            const value = choice.value !== undefined ? choice.value : (choice.id ?? choice.name);
            const text = choice.text || choice.title || choice.name || String(value);
            registerChoice(value, text);
          }
        });
      }
    }

    if (questionChoices.size > 0) {
      choicesMap.set(question.name, questionChoices);
    }
  });
  
  return choicesMap;
};

// Convert SurveyJS questions to AG Grid column definitions
const convertQuestionsToColumns = (
  questions: Question[], 
  showMetadata: boolean = false, 
  surveyModel?: Model,
  choicesMap?: Map<string, Map<any, string>>
): ColDef[] => {
  console.log('=== convertQuestionsToColumns called ===');
  console.log('Input questions length:', questions.length);
  console.log('Questions details:', questions.map(q => ({ 
    name: q.name, 
    title: q.title,
    visible: q.visible, 
    type: q.getType(),
    isVisible: q.isVisible
  })));
  
  const baseColumns: ColDef[] = [
    { field: 'id', headerName: 'ID', hide: !showMetadata, suppressColumnsToolPanel: !showMetadata },
    { 
      field: 'survey_date', 
      headerName: 'Survey Date', 
      filter: 'agDateColumnFilter',
      minWidth: 180,
      sort: 'desc', // Default sort by most recent first
      cellDataType: 'dateString',
      valueFormatter: (params) => {
        if (params.value) {
          try {
            // Parse the date - it could be in various formats
            let date: Date;
            
            // Check if it's a Firebase Timestamp
            if (params.value && typeof params.value === 'object' && 'seconds' in params.value) {
              date = new Date(params.value.seconds * 1000);
            } 
            // Check if it's already a Date object
            else if (params.value instanceof Date) {
              date = params.value;
            }
            // Try to parse as string
            else {
              date = new Date(params.value);
            }
            
            // If valid date, convert to local timezone
            if (!isNaN(date.getTime())) {
              // Use browser's locale and timezone
              return date.toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
              });
            }
          } catch (e) {
            console.error('Error parsing survey_date:', e);
          }
          // If parsing fails, return the original value
          return String(params.value);
        }
        return '';
      },
      // For sorting, convert to timestamp
      comparator: (valueA, valueB) => {
        const getTimestamp = (value: any) => {
          if (!value) return 0;
          try {
            if (value && typeof value === 'object' && 'seconds' in value) {
              return value.seconds * 1000;
            }
            const date = new Date(value);
            return isNaN(date.getTime()) ? 0 : date.getTime();
          } catch {
            return 0;
          }
        };
        return getTimestamp(valueA) - getTimestamp(valueB);
      }
    },
    { field: 'end_time', headerName: 'End Time', hide: true },
    { field: '_utm', headerName: 'UTM', hide: !showMetadata },
    { field: '_referrer', headerName: 'Referrer', hide: !showMetadata },
    { field: '_timeZone', headerName: 'Time Zone', hide: !showMetadata },
    { field: '_language', headerName: 'Language', hide: !showMetadata },
    { field: '_preSurveyID', headerName: 'Pre Survey ID', hide: !showMetadata }
  ];
  
  // Handle composite questions that need to be split into multiple columns
  const questionColumns: ColDef[] = questions.flatMap(q => {
    // Check if this is a composite question that stores an object
    const questionType = q.getType();
    
    // For multipletext questions, create columns for each item
    if (questionType === 'multipletext') {
      const items = (q as any).items || [];
      return items.map((item: any) => {
        const fieldName = `${q.name}.${item.name}`;
        const columnDef: ColDef = {
          field: fieldName,
          headerName: item.title || item.name,
          sortable: true,
          filter: 'agTextColumnFilter',
          resizable: true,
          minWidth: 100,
          wrapText: true,
          autoHeight: true,
          filterParams: {
            buttons: ['reset', 'apply'],
            closeOnApply: true
          },
          valueGetter: (params) => {
            // Extract nested value from the composite object
            const questionData = params.data[q.name];
            return questionData ? questionData[item.name] : '';
          },
          valueFormatter: (params) => {
            if (params.value === null || params.value === undefined) {
              return '';
            }

            // Check for "other" values with comments
            const commentFieldName = `${params.colDef.field}-Comment`;
            const commentValue = params.data[commentFieldName];
            const rawValue = params.data[params.colDef.field];
            if (rawValue === 'other' && commentValue) {
              return commentValue;
            }

            if (Array.isArray(params.value)) {
              return formatArrayValue(params.value);
            }
            return params.value;
          }
        };
        return columnDef;
      });
    }
    
    // For matrix questions, create columns for each row-column combination
    if (questionType === 'matrix' || questionType === 'matrixdropdown' || questionType === 'matrixdynamic') {
      const rows = (q as any).rows || [];
      const columns = (q as any).columns || [];
      
      // For matrix questions, create a column for each row-column combination
      const matrixColumns: ColDef[] = [];
      rows.forEach((row: any) => {
        if (columns.length > 1) {
          // Multiple columns - create a column for each combination
          columns.forEach((col: any) => {
            const fieldName = `${q.name}.${row.value || row}.${col.name || col}`;
            matrixColumns.push({
              field: fieldName,
              headerName: `${row.text || row} - ${col.title || col.text || col}`,
              sortable: true,
              filter: questionType === 'matrixdropdown' ? 'agSetColumnFilter' : 'agTextColumnFilter',
              resizable: true,
              minWidth: 120,
              wrapText: true,
              autoHeight: true,
              filterParams: {
                buttons: ['reset', 'apply'],
                closeOnApply: true
              },
              valueGetter: (params) => {
                const questionData = params.data[q.name];
                if (!questionData) return '';
                const rowData = questionData[row.value || row];
                return rowData ? rowData[col.name || col] : '';
              },
              valueFormatter: (params) => {
                if (params.value === null || params.value === undefined) {
                  return '';
                }

                // Check for "other" values with comments
                const commentFieldName = `${params.colDef.field}-Comment`;
                const commentValue = params.data[commentFieldName];
                const rawValue = params.data[params.colDef.field];
                if (rawValue === 'other' && commentValue) {
                  return commentValue;
                }

                if (Array.isArray(params.value)) {
                  return formatArrayValue(params.value);
                }
                // Try to get display value if available
                if (surveyModel && params.value) {
                  const question = surveyModel.getQuestionByName(q.name);
                  if (question && (question as any).columns) {
                    const column = (question as any).columns.find((c: any) => c.name === (col.name || col));
                    if (column && column.choices) {
                      const choice = column.choices.find((ch: any) => ch.value === params.value);
                      if (choice) return choice.text || params.value;
                    }
                  }
                }
                return params.value;
              }
            });
          });
        } else {
          // Single column or rating - create one column per row
          const fieldName = `${q.name}.${row.value || row}`;
          matrixColumns.push({
            field: fieldName,
            headerName: row.text || row,
            sortable: true,
            filter: 'agTextColumnFilter',
            resizable: true,
            minWidth: 120,
            wrapText: true,
            autoHeight: true,
            filterParams: {
              buttons: ['reset', 'apply'],
              closeOnApply: true
            },
            valueGetter: (params) => {
              const questionData = params.data[q.name];
              return questionData ? questionData[row.value || row] : '';
            },
            valueFormatter: (params) => {
              if (params.value === null || params.value === undefined) {
                return '';
              }

              // Check for "other" values with comments
              const commentFieldName = `${params.colDef.field}-Comment`;
              const commentValue = params.data[commentFieldName];
              const rawValue = params.data[params.colDef.field];
              if (rawValue === 'other' && commentValue) {
                return commentValue;
              }

              if (Array.isArray(params.value)) {
                // Convert array to comma-delimited string
                return params.value.map(v => String(v)).join(', ');
              }
              return params.value;
            }
          });
        }
      });
      
      return matrixColumns;
    }
    
    // For autocompleteaddress questions, create columns for address components
    if (questionType === 'autocompleteaddress' || questionType === 'autocompleteaddress2' || questionType === 'autocompleteaddresscan') {
      const addressFields = [
        { name: 'address1', title: 'Address' },
        { name: 'city', title: 'City' },
        { name: 'state', title: 'State' },
        { name: 'zip_code', title: 'Zip Code', isZipCode: true },
        { name: 'country', title: 'Country' }
      ];
      
      return addressFields.map(field => {
        const fieldName = `${q.name}.${field.name}`;
        const columnDef: ColDef = {
          field: fieldName,
          headerName: field.title,
          sortable: true,
          filter: 'agTextColumnFilter',
          resizable: true,
          minWidth: 100,
          wrapText: true,
          autoHeight: true,
          filterParams: {
            buttons: ['reset', 'apply'],
            closeOnApply: true
          },
          valueGetter: (params) => {
            // Extract nested value from the composite object
            const questionData = params.data[q.name];
            return questionData ? questionData[field.name] : '';
          },
          valueFormatter: (params) => {
            if (params.value === null || params.value === undefined) {
              return '';
            }

            // Check for "other" values with comments
            const commentFieldName = `${params.colDef.field}-Comment`;
            const commentValue = params.data[commentFieldName];
            const rawValue = params.data[params.colDef.field];
            if (rawValue === 'other' && commentValue) {
              return commentValue;
            }

            // For zip codes, ensure they're treated as strings and preserve leading zeros
            if ((field as any).isZipCode && params.value) {
              const zipStr = String(params.value);
              // Only pad if it looks like a US zip code (numeric and less than 5 digits)
              if (/^\d+$/.test(zipStr) && zipStr.length < 5) {
                return zipStr.padStart(5, '0');
              }
              return zipStr;
            }
            return params.value;
          }
        };
        return columnDef;
      });
    }
    
    // For non-composite questions, return a single column as before
    // Determine filter type based on SurveyJS question type
    let filterType = 'agTextColumnFilter'; // Default to text filter
    let cellDataType = undefined;
    let filterParams: any = {
      buttons: ['reset', 'apply'],
      closeOnApply: true
    };
    
    // Map SurveyJS question types to AG Grid filter types
    switch (q.getType()) {
      case 'panel':
        // Panel questions might contain waiver/signature data
        filterType = 'agTextColumnFilter';
        filterParams.filterOptions = ['contains', 'notContains', 'blank', 'notBlank'];
        break;

      case 'text':
        // Check inputType for more specific types
        if (q.inputType === 'number' || q.inputType === 'tel') {
          filterType = 'agNumberColumnFilter';
          cellDataType = 'number';
        } else if (q.inputType === 'date' || q.inputType === 'datetime-local') {
          filterType = 'agDateColumnFilter';
          cellDataType = 'date';
        } else if (q.inputType === 'email' || q.inputType === 'url') {
          filterType = 'agTextColumnFilter';
          filterParams.filterOptions = ['contains', 'equals', 'startsWith', 'endsWith'];
        }
        break;
        
      case 'radiogroup':
      case 'dropdown':
      case 'checkbox':
        // For choice-based questions, use set filter with the available options
        filterType = 'agSetColumnFilter';
        const choices = (q as any).choices;
        if (choices && choices.length > 0) {
          filterParams.values = choices.map((choice: any) => 
            typeof choice === 'string' ? choice : (choice.value || choice.text)
          );
        }
        break;
        
      case 'rating':
        filterType = 'agNumberColumnFilter';
        cellDataType = 'number';
        const rateValues = (q as any).rateValues;
        if (rateValues && rateValues.length > 0) {
          filterParams.filterOptions = ['equals', 'greaterThan', 'lessThan', 'inRange'];
        }
        break;
        
      case 'boolean':
      case 'switch':
        filterType = 'agSetColumnFilter';
        filterParams.values = ['true', 'false', 'Yes', 'No'];
        break;
        
      case 'matrix':
      case 'matrixdropdown':
      case 'matrixdynamic':
        // Matrix questions might need special handling
        filterType = 'agTextColumnFilter';
        break;
        
      case 'ranking':
      case 'nouislider':
        filterType = 'agNumberColumnFilter';
        cellDataType = 'number';
        break;
        
      case 'signaturepad':
      case 'file':
      case 'image':
        // These types might contain complex data
        filterType = 'agTextColumnFilter';
        filterParams.filterOptions = ['contains', 'notContains', 'blank', 'notBlank'];
        break;
        
      default:
        // Default case for any other question types
        filterType = 'agTextColumnFilter';
    }
    
    // Determine if this is an image question
    const isImageQuestion = ['file', 'image', 'signaturepad'].includes(q.getType());

    // Determine if this is a phone or email field
    const isPhoneQuestion = q.getType() === 'text' && (q.inputType === 'tel' || q.name.toLowerCase().includes('phone') || q.title?.toLowerCase().includes('phone'));
    const isEmailQuestion = q.getType() === 'text' && (q.inputType === 'email' || q.name.toLowerCase().includes('email') || q.title?.toLowerCase().includes('email'));
    
    const columnDef: ColDef = {
      field: q.name,
      headerName: q.title || q.name,
      sortable: true,
      filter: isImageQuestion ? 'agTextColumnFilter' : filterType,
      resizable: true,
      minWidth: isImageQuestion ? 140 : 100, // Wider for images
      width: isImageQuestion ? 140 : undefined, // Default width for image columns
      wrapText: !isImageQuestion && !isPhoneQuestion && !isEmailQuestion, // Don't wrap for special renderers
      autoHeight: !isImageQuestion && !isPhoneQuestion && !isEmailQuestion, // Don't auto-height for special renderers
      cellDataType: cellDataType,
      filterParams: isImageQuestion ? {
        filterOptions: ['contains', 'notContains', 'blank', 'notBlank'],
        textFormatter: (value: any) => {
          // For filtering, convert image data to searchable text
          if (typeof value === 'string') return value;
          if (Array.isArray(value)) return value.join(' ');
          if (typeof value === 'object') return JSON.stringify(value);
          return '';
        }
      } : filterParams,
      // Add tooltip to show question type
      headerTooltip: `Type: ${q.getType()}${q.inputType ? ` (${q.inputType})` : ''}`,
      // Add custom cell renderer based on type
      ...(isImageQuestion ? {
        cellRenderer: ImageCellRenderer
      } : isPhoneQuestion ? {
        cellRenderer: PhoneCellRenderer
      } : isEmailQuestion ? {
        cellRenderer: EmailCellRenderer
      } : {
        // Use SurveyJS to get display value for all non-special columns
        valueFormatter: (params) => {
          // Check for "other" values with comments FIRST
          const commentFieldName = `${params.colDef.field}-Comment`;
          const commentValue = params.data[commentFieldName];
          const rawValue = params.data[params.colDef.field];
          if (rawValue === 'other' && commentValue) {
            return commentValue;
          }

          // Debug: Log entry to valueFormatter
          if (params.colDef.field === 'question1' || (typeof params.value === 'object' && params.value !== null && !Array.isArray(params.value))) {
            console.log('[valueFormatter ENTRY] Field:', params.colDef.field, {
              value: params.value,
              valueType: typeof params.value,
              isObject: typeof params.value === 'object' && params.value !== null,
              isArray: Array.isArray(params.value),
              valueKeys: typeof params.value === 'object' && params.value !== null ? Object.keys(params.value) : 'N/A'
            });
          }

          if (params.value === null || params.value === undefined) {
            return '';
          }
          
          
          
          // Check if this is a zip code field
          const fieldName = params.colDef.field || '';
          const headerName = params.colDef.headerName || '';
          const isZipCodeField = fieldName.toLowerCase().includes('zip') || 
                                headerName.toLowerCase().includes('zip') ||
                                fieldName.toLowerCase().includes('postal') || 
                                headerName.toLowerCase().includes('postal') ||
                                fieldName.toLowerCase().includes('postcode') ||
                                headerName.toLowerCase().includes('postcode');
          
          if (isZipCodeField && params.value) {
            const zipStr = String(params.value);
            // Only pad if it looks like a US zip code (numeric and less than 5 digits)
            if (/^\d+$/.test(zipStr) && zipStr.length < 5) {
              return zipStr.padStart(5, '0');
            }
            return zipStr;
          }
          
          // Try to get the display value using choices map first
          if (choicesMap && params.colDef.field) {
            const questionChoices = choicesMap.get(params.colDef.field);
            if (questionChoices) {
              // Handle arrays - map each value to its display text
              if (Array.isArray(params.value)) {
                const displayValues = params.value.map(val => {
                  const displayText = questionChoices.get(val) || questionChoices.get(String(val));
                  return displayText || val;
                });
                return displayValues.join(', ');
              }
              // Handle single values
              const displayText = questionChoices.get(params.value) || questionChoices.get(String(params.value));
              if (displayText) {
                return displayText;
              }
            }
          }
          
          // Try to get the display value from the survey model
          if (surveyModel && params.colDef.field) {
            const question = surveyModel.getQuestionByName(params.colDef.field);
            if (question) {
              const displayQuestion: any = (question as any).contentQuestion || question;
              // Handle arrays - use smart array formatting instead of SurveyJS displayValue
              if (Array.isArray(params.value)) {
                // Try to map through choices if available on display question
                if (Array.isArray(displayQuestion?.choices) && displayQuestion.choices.length > 0) {
                  const mappedValues = params.value.map((val: any) => {
                    const match = displayQuestion.choices.find((choice: any) => choice.value === val || String(choice.value) === String(val));
                    return match ? (match.text || match.title || match.name || match.value) : val;
                  });
                  return formatArrayValue(mappedValues);
                }
                return formatArrayValue(params.value);
              }
              // For objects, use our formatter instead of SurveyJS displayValue
              if (typeof params.value === 'object' && params.value !== null) {
                console.log('[valueFormatter] Object in SurveyJS path, using formatObjectValue');
                return formatObjectValue(params.value);
              }


              // Handle single values
              const originalValue = displayQuestion.value;
              displayQuestion.value = params.value;
              const displayValue = displayQuestion.displayValue;
              displayQuestion.value = originalValue;
              return displayValue || params.value;
            }
          }
          
          // Fallback to default formatting
          if (Array.isArray(params.value)) {
            const result = formatArrayValue(params.value);
            console.log('[valueFormatter] Array formatted:', result);
            return result;
          }
          if (typeof params.value === 'object' && params.value !== null) {
            console.log('[valueFormatter] Object detected for field:', params.colDef.field, 'calling formatObjectValue');
            const result = formatObjectValue(params.value);
            console.log('[valueFormatter] Object formatted result:', result);
            return result;
          }
          console.log('[valueFormatter] Returning primitive value:', params.value);
          return params.value;
        }
      })
    };
    
    return [columnDef];
  });
  
  // Extract survey_date column
  const surveyDateColumn = baseColumns.find(col => col.field === 'survey_date');
  // Get other non-metadata columns (excluding survey_date)
  const otherBaseColumns = baseColumns.filter(col => col.field && col.field !== 'survey_date' && !col.field.startsWith('_'));
  // Get metadata columns
  const metadataColumns = baseColumns.filter(col => col.field && col.field.startsWith('_'));
  
  // Assemble columns: survey_date first, then questions in order, then other base columns, then metadata
  const allColumns = [
    ...(surveyDateColumn ? [surveyDateColumn] : []),
    ...questionColumns,
    ...otherBaseColumns,
    ...metadataColumns
  ];
  console.log('Total columns generated:', allColumns.length);
  console.log('Column fields:', allColumns.map(c => c.field));
  return allColumns;
};

function DashboardScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const [user, userLoading, userError] = useAuthState(auth);
  const [thisEvent, setThisEvent] = useState<any>();
  const [thisSurvey, setThisSurvey] = useState<Model>();
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [allAnswers, setAllAnswers] = useState<any[]>();
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [quickFilterText, setQuickFilterText] = useState<string>('');
  const [showMetadataFields, setShowMetadataFields] = useState<boolean>(false);
  const [choicesMap, setChoicesMap] = useState<Map<string, Map<any, string>>>(new Map());

  useEffect(() => {
    console.error(userError);
  }, [userError]);

  // Debug logging
  console.log('Dashboard render - columnDefs:', columnDefs.length, 'answers:', allAnswers?.length, 'questions:', allQuestions?.length);

  const eventID: string = params.eventID!;

  useEffect(() => {
    if (userLoading) return;

    // see if the user is logged in
    console.log('user', user);

    if (!user) {
      navigate('./login');
    } else {
      // Set CloudFront cookies for authenticated user
      ensureCloudFrontAccess().catch(err => {
        console.error('CloudFront access setup failed:', err);
      });
    }

    // get the event
    console.log('=== Fetching event with ID:', eventID);
    const eventRef = doc(db, "events", eventID);
    getDoc(eventRef).then((doc) => {
      console.log('=== Event document exists:', doc.exists());
      
      let incomingEvent;
      
      if (!doc.exists()) {
        console.error('Event not found with ID:', eventID);
        // Create a test event for debugging
        const testEvent: any = {
          name: 'Test Event',
          questions: JSON.stringify({
            pages: [{
              elements: [
                { type: 'text', name: 'firstName', title: 'First Name' },
                { type: 'text', name: 'lastName', title: 'Last Name' },
                { type: 'radiogroup', name: 'satisfaction', title: 'How satisfied are you?', choices: ['Very satisfied', 'Satisfied', 'Neutral', 'Unsatisfied'] }
              ]
            }]
          }),
          _preEventID: null
        };
        console.log('Using test event for debugging');
        setThisEvent(testEvent);
        incomingEvent = testEvent;
      } else {
        incomingEvent = doc.data();
        console.log('=== Event data:', incomingEvent);
        setThisEvent(incomingEvent);
      }

      // Initialize brand-specific questions based on event brand
      const eventBrand = incomingEvent?.brand?.toLowerCase();
      console.log('=== Event brand:', eventBrand);

      // Initialize the appropriate brand-specific questions
      if (eventBrand === 'ford') {
        console.log('Initializing Ford-specific questions for dashboard');
        FordSurveysNew.fordInit();
      } else if (eventBrand === 'lincoln') {
        console.log('Initializing Lincoln-specific questions for dashboard');
        LincolnSurveysNew.lincolnInit();
      } else if (eventBrand === 'fmc' || eventBrand === 'fleet') {
        console.log('Initializing FMC-specific questions for dashboard');
        FMCSurveys.fmcInit();
      }
      // AllSurveys.globalInit() is already called at the top of the file

      // Use new map field if available, otherwise parse JSON string
      const surveyJSON = incomingEvent?.surveyJSModel ||
                        (incomingEvent?.questions ? JSON.parse(incomingEvent.questions) : {});
      console.log('=== Original Survey JSON ===');
      console.log('Pages:', surveyJSON.pages?.length);
      console.log('Original survey structure:', JSON.stringify(surveyJSON, null, 2));

      // Check if surveyJSON has the expected structure
      if (!surveyJSON.pages || !Array.isArray(surveyJSON.pages) || surveyJSON.pages.length === 0) {
        console.error('Survey JSON is missing pages array or is empty!');
        // Create a minimal structure to prevent crashes
        surveyJSON.pages = [{elements: []}];
      }

      // add a couple fields to the survey json
      surveyJSON.pages[0].elements.unshift(
        {
          "type": "text",
          "name": "id",
          "visible": false,
        },
        {
          "type": "text",
          "name": "survey_date",
          "inputType": "datetime-local",
          "visible": false,
        },
      )
      surveyJSON.pages[surveyJSON.pages.length - 1].elements.push(
        {
          "type": "text",
          "name": "end_time",
          "inputType": "datetime-local",
          "visible": false,
        },
        {
          "type": "text",
          "name": "_utm",
          "visible": false,
        },
        {
          "type": "text",
          "name": "_referrer",
          "visible": false,
        },
        {
          "type": "text",
          "name": "_timeZone",
          "visible": false,
        },
        {
          "type": "text",
          "name": "_language",
          "visible": false,
        },
      )
      if (incomingEvent?._preEventID) {
        surveyJSON.pages[surveyJSON.pages.length - 1].elements.push(
          {
            "type": "text",
            "name": "_preSurveyID",
            "visible": false,
          },
        )
      }

      const survey = new Model(surveyJSON);

      setThisSurvey(survey);
      
      // Build the choices map for displaying pretty labels
      const newChoicesMap = buildChoicesMap(survey);
      setChoicesMap(newChoicesMap);
      console.log('=== Choices map built ===', newChoicesMap);
      
      // Define non-question types that should be excluded from the dashboard
      // These are display-only elements from the "Misc" category in SurveyJS
      const nonQuestionTypes = ['html', 'markdown', 'image', 'expression'];
      
      // Function to recursively get all questions from panels
      const getAllQuestionsFromPanel = (panel: any): any[] => {
        let questions: any[] = [];
        
        if (panel.elements) {
          for (const element of panel.elements) {
            if (element.type === 'panel') {
              // Recursively get questions from nested panels
              questions = questions.concat(getAllQuestionsFromPanel(element));
            } else if (!element.type || !nonQuestionTypes.includes(element.type)) {
              // This is a question (not a display-only element), add it
              questions.push(element);
            }
          }
        }
        
        return questions;
      };
      
      // Get all questions from all pages and panels
      let allQuestions: any[] = [];
      if (surveyJSON.pages) {
        for (const page of surveyJSON.pages) {
          if (page.elements) {
            for (const element of page.elements) {
              if (element.type === 'panel') {
                // Get questions from panel
                allQuestions = allQuestions.concat(getAllQuestionsFromPanel(element));
              } else if (!element.type || !nonQuestionTypes.includes(element.type)) {
                // This is a question (not a display-only element), add it
                allQuestions.push(element);
              }
            }
          }
        }
      }
      
      // Filter out metadata fields (those starting with underscore) if showMetadataFields is false
      // Note: We'll keep 'id' and 'survey_date' as they're always shown in the base columns
      const metadataFieldsToAlwaysExclude = ['id', 'survey_date', 'end_time'];
      const filteredQuestions = allQuestions.filter(q => {
        // Always exclude these metadata fields as they're handled separately
        if (metadataFieldsToAlwaysExclude.includes(q.name)) {
          return false;
        }
        // Double-check that non-question types are excluded
        if (q.type && nonQuestionTypes.includes(q.type)) {
          return false;
        }
        // If showMetadataFields is false, exclude fields starting with underscore
        if (!showMetadataFields && q.name && q.name.startsWith('_')) {
          return false;
        }
        return true;
      });
      
      // Convert question JSON definitions to Question objects
      const questions = filteredQuestions.map(qDef => {
        const question = survey.getQuestionByName(qDef.name);
        if (question) {
          return question;
        }
        // If question not found in survey model (because of visibility), create a temporary one
        // to get proper column definition
        const tempSurvey = new Model({ pages: [{ elements: [qDef] }] });
        return tempSurvey.getAllQuestions()[0];
      }).filter(q => q); // Remove any undefined values
      
      console.log('=== Survey Model Created ===');
      console.log('Survey questions found:', questions.length);
      console.log('Survey pages:', surveyJSON.pages?.length || 0);
      console.log('All question names from JSON:', allQuestions.map(q => q.name));
      console.log('Filtered question names:', questions.map(q => q.name));
      console.log('Show metadata fields:', showMetadataFields);
      
      // If no questions found, check if surveyJSON has the expected structure
      if (questions.length === 0) {
        console.error('No questions found! Survey JSON might be malformed.');
        console.log('Survey JSON after modifications:', JSON.stringify(surveyJSON, null, 2));
        
        // For debugging: Create some test questions to ensure grid renders
        const testQuestions = [
          { name: 'test_name', title: 'Name', type: 'text', getType: () => 'text', visible: true, isVisible: true, inputType: 'text' },
          { name: 'test_email', title: 'Email', type: 'text', getType: () => 'text', visible: true, isVisible: true, inputType: 'email' },
          { name: 'test_rating', title: 'Rating', type: 'rating', getType: () => 'rating', visible: true, isVisible: true }
        ] as any;
        console.log('Using test questions for debugging:', testQuestions);
        setAllQuestions(testQuestions);
      } else {
        setAllQuestions(questions);
      }

      // get the answers
      const answersRef = collection(db, "events", eventID, "surveys");
      const q = query(answersRef);
      getDocs(q).then((querySnapshot) => {
        const answers: any[] = [];

        querySnapshot.forEach((doc) => {
          answers.push({
            id: doc.id,
            _preEventID: incomingEvent?._preEventID,
            ...doc.data()
          });
        });

        // Debug: Log raw answer data from Firestore
        console.log('[Firestore Data] Raw answers:', answers.map(a => ({
          id: a.id,
          question1: a.question1,
          question1Type: typeof a.question1,
          allKeys: Object.keys(a).filter(k => k.includes('question'))
        })));
        setAllAnswers(answers);
      });
    }).catch((error) => {
      console.error('=== Error fetching event:', error);
    });
  }, [userLoading, user, showMetadataFields]);

  useEffect(() => {
    console.log('Dashboard useEffect - checking data:', {
      hasSurvey: !!thisSurvey,
      hasAnswers: !!allAnswers,
      answersLength: allAnswers?.length,
      hasQuestions: !!allQuestions,
      questionsLength: allQuestions?.length
    });
    
    if (!thisSurvey || !allAnswers) return;

    // Convert questions to AG Grid column definitions
    let baseColumns = convertQuestionsToColumns(allQuestions || [], showMetadataFields, thisSurvey, choicesMap);
    
    // If we have very few questions but have answer data, dynamically add columns
    // from the actual data fields (excluding system fields)
    if (allAnswers.length > 0 && allQuestions && allQuestions.length < 5) {
      const firstAnswer = allAnswers[0];
      const existingFields = new Set(baseColumns.map(col => col.field));
      const systemFields = new Set([
        'id', 'survey_date', 'end_time', '_utm', '_referrer', '_timeZone', 
        '_language', '_preSurveyID', 'event_id', 'app_version', 'device_id',
        '_exported', '_claimed', '_used', '_email', '_sms', '_checkedIn', 
        '_checkedOut', '_offset', '_screenWidth', 'abandoned', 'start_time'
      ]);
      
      // Separate regular fields from metadata fields
      const additionalRegularFields: ColDef[] = [];
      const additionalMetadataFields: ColDef[] = [];
      
      // Add columns for fields that exist in data but not in survey questions
      Object.keys(firstAnswer).forEach(field => {
        if (!existingFields.has(field) && !systemFields.has(field)) {
          // Skip metadata fields if showMetadataFields is false
          if (!showMetadataFields && field.startsWith('_')) {
            return;
          }
          
          // Check if field contains image data
          const fieldValue = firstAnswer[field];
          const isImageField = (
            (typeof fieldValue === 'string' && (
              fieldValue.startsWith('http') || 
              fieldValue.startsWith('data:image')
            )) ||
            (Array.isArray(fieldValue) && fieldValue.length > 0 && 
              typeof fieldValue[0] === 'string' && fieldValue[0].startsWith('http'))
          );
          
          // Check if field is phone or email
          const fieldNameLower = field.toLowerCase();
          const isPhoneField = fieldNameLower.includes('phone') || fieldNameLower.includes('tel') || fieldNameLower.includes('mobile');
          const isEmailField = fieldNameLower.includes('email') || fieldNameLower.includes('mail');
          
          const columnDef: ColDef = {
            field: field,
            headerName: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1').trim(),
            sortable: true,
            filter: 'agTextColumnFilter',
            resizable: true,
            minWidth: isImageField ? 140 : 100,
            width: isImageField ? 140 : undefined,
            wrapText: !isImageField && !isPhoneField && !isEmailField,
            autoHeight: !isImageField && !isPhoneField && !isEmailField,
            hide: !showMetadataFields && field.startsWith('_'),
            ...(isImageField ? {
              cellRenderer: ImageCellRenderer
            } : isPhoneField ? {
              cellRenderer: PhoneCellRenderer
            } : isEmailField ? {
              cellRenderer: EmailCellRenderer
            } : {
              valueFormatter: (params) => {
                if (params.value === null || params.value === undefined) {
                  return '';
                }

                // EARLY CHECK FOR "OTHER" VALUES - BEFORE ANY OTHER PROCESSING
                // When user selects "other" option, Firestore stores:
                // - fieldName: "other"
                // - fieldName-Comment: "user's custom text"
                const commentFieldName = `${params.colDef.field}-Comment`;
                const commentValue = params.data[commentFieldName];
                const rawValue = params.data[params.colDef.field];

                // Check if raw value is "other" and there's a comment field
                if (rawValue === 'other' && commentValue) {
                  console.log(`Returning comment for ${params.colDef.field}: "${commentValue}" instead of "${params.value}"`);
                  return commentValue;
                }

                // Check if this is a zip code field
                const fieldNameLower = field.toLowerCase();
                const isZipCodeField = fieldNameLower.includes('zip') ||
                                      fieldNameLower.includes('postal') ||
                                      fieldNameLower.includes('postcode');
                
                if (isZipCodeField && params.value) {
                  const zipStr = String(params.value);
                  // Only pad if it looks like a US zip code (numeric and less than 5 digits)
                  if (/^\d+$/.test(zipStr) && zipStr.length < 5) {
                    return zipStr.padStart(5, '0');
                  }
                  return zipStr;
                }
                
                // Try to get the display value from the survey model
                if (thisSurvey && params.colDef.field) {
                  const question = thisSurvey.getQuestionByName(params.colDef.field);
                  if (question) {
                    // Handle arrays - convert each value to display value
                    if (Array.isArray(params.value)) {
                      const originalValue = question.value;
                      const displayValues = params.value.map(val => {
                        question.value = val;
                        const displayVal = question.displayValue;
                        return displayVal || val;
                      });
                      question.value = originalValue;
                      return displayValues.join(', ');
                    }
                    // Handle single values
                    const originalValue = question.value;
                    question.value = params.value;
                    const displayValue = question.displayValue;
                    question.value = originalValue;
                    return displayValue || params.value;
                  }
                }
                
                // Fallback to default formatting
                if (Array.isArray(params.value)) {
                  return formatArrayValue(params.value);
                }
                if (typeof params.value === 'object') {
                  return formatObjectValue(params.value);
                }
                return params.value;
              }
            })
          };
          
          // Add to appropriate array based on whether it's metadata
          if (field.startsWith('_')) {
            additionalMetadataFields.push(columnDef);
          } else {
            additionalRegularFields.push(columnDef);
          }
        }
      });
      
      // Since baseColumns already has the correct order from convertQuestionsToColumns,
      // we just need to insert additional fields in the right place
      const firstMetadataIndex = baseColumns.findIndex(col => col.field && col.field.startsWith('_'));
      
      // Insert additional regular fields before metadata fields
      const insertIndex = firstMetadataIndex !== -1 ? firstMetadataIndex : baseColumns.length;
      const columns = [
        ...baseColumns.slice(0, insertIndex),
        ...additionalRegularFields,
        ...baseColumns.slice(insertIndex),
        ...additionalMetadataFields
      ];
      
      console.log('Generated columns:', columns.length, columns);
      setColumnDefs(columns);
    } else {
      // No additional fields needed, columns are already in correct order
      console.log('Generated columns:', baseColumns.length, baseColumns);
      setColumnDefs(baseColumns);
    }

  }, [thisSurvey, allAnswers, allQuestions, showMetadataFields, choicesMap]);

  // Track if we've auto-sized columns on first data load
  const [hasAutoSized, setHasAutoSized] = useState(false);

  // Grid Ready Event Handler
  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  // Auto-size columns when data first loads
  useEffect(() => {
    if (gridApi && allAnswers && allAnswers.length > 0 && !hasAutoSized) {
      // Small delay to ensure grid is fully rendered
      setTimeout(() => {
        gridApi.autoSizeAllColumns();
        setHasAutoSized(true);
      }, 100);
    }
  }, [gridApi, allAnswers, hasAutoSized]);

  // Export to Excel
  const exportToExcel = () => {
    if (!gridApi) return;
    
    // Get only visible columns in their current order
    const columns = gridApi.getColumns();
    const visibleColumns = columns?.filter(col => col.isVisible()) || [];
    
    
    // Get filtered and sorted data
    const rowData: any[] = [];
    gridApi.forEachNodeAfterFilterAndSort(node => {
      if (node.data) {
        // Create row with only visible columns
        const row: any = {};
        visibleColumns.forEach(col => {
          const field = col.getColDef().field;
          const headerName = col.getColDef().headerName || field;
          if (field) {
            let value = node.data[field];
            
            // Handle nested values for composite questions
            if (field.includes('.')) {
              const parts = field.split('.');
              value = node.data[parts[0]];
              for (let i = 1; i < parts.length && value; i++) {
                value = value[parts[i]];
              }
            }
            
            // Use the column's valueGetter if available
            const colDef = col.getColDef();
            if (colDef.valueGetter && typeof colDef.valueGetter === 'function') {
              value = colDef.valueGetter({ data: node.data, colDef: colDef, node: node, api: gridApi, column: col, getValue: () => value, context: {} });
            }
            
            // Format the value using valueFormatter if available
            if (value !== null && value !== undefined && colDef.valueFormatter && typeof colDef.valueFormatter === 'function') {
              value = colDef.valueFormatter({ value: value, data: node.data, colDef: colDef, node: node, api: gridApi, column: col, context: {} });
            }
            
            row[headerName || field || ''] = value;
          }
        });
        rowData.push(row);
      }
    });
    
    // Create worksheet with special handling for zip codes
    const ws = XLSX.utils.json_to_sheet(rowData);
    
    // Force zip code columns to be text format to preserve leading zeros
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const headers = Object.keys(rowData[0] || {});
    
    headers.forEach((header, colIndex) => {
      // Check if this is a zip code field
      const isZipCode = header.toLowerCase().includes('zip') || 
                       header.toLowerCase().includes('postal') ||
                       header.toLowerCase().includes('postcode');
      
      if (isZipCode) {
        // Apply text format to all cells in this column
        for (let rowIndex = 0; rowIndex <= range.e.r; rowIndex++) {
          const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
          if (ws[cellAddress]) {
            // Prepend with apostrophe to force text format
            if (ws[cellAddress].v && typeof ws[cellAddress].v === 'number') {
              ws[cellAddress].v = String(ws[cellAddress].v).padStart(5, '0');
            }
            ws[cellAddress].t = 's'; // Force string type
            // Set number format to text
            if (!ws[cellAddress].z) ws[cellAddress].z = '@';
          }
        }
      }
    });
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Survey Data");
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const fileName = thisEvent?.name ? `${thisEvent.name}_survey_data.xlsx` : 'survey_data.xlsx';
    saveAs(data, fileName);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!gridApi) return;
    
    const fileName = thisEvent?.name ? `${thisEvent.name}_survey_data.csv` : 'survey_data.csv';
    
    // Export with current grid state (filtered, sorted, only visible columns)
    gridApi.exportDataAsCsv({ 
      fileName,
      onlySelected: false,
      allColumns: false, // Only export visible columns
      suppressQuotes: false,
      columnSeparator: ',',
      processCellCallback: (params) => {
        // Check if this is a zip code field
        const field = params.column.getColDef().field || '';
        const headerName = params.column.getColDef().headerName || '';
        const isZipCode = field.toLowerCase().includes('zip') || 
                         headerName.toLowerCase().includes('zip') ||
                         field.toLowerCase().includes('postal') ||
                         headerName.toLowerCase().includes('postal') ||
                         field.toLowerCase().includes('postcode') ||
                         headerName.toLowerCase().includes('postcode');
        
        if (isZipCode && params.value) {
          // Ensure zip codes are treated as strings and pad with zeros if needed
          const zipStr = String(params.value);
          // Only pad if it looks like a US zip code (numeric and less than 5 digits)
          if (/^\d+$/.test(zipStr) && zipStr.length < 5) {
            return zipStr.padStart(5, '0');
          }
          return zipStr;
        }
        
        return params.value;
      }
    });
  };



  return (
    <div className="dashboard-grid-container">
      <h1 style={{ margin: '10px 0', padding: '0 10px', flexShrink: 0 }}>{thisSurvey?.title || thisEvent?.name || 'Loading...'} (Responders: {allAnswers?.length || 0})</h1>
      
      {/* Quick Filter Search Box */}
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 10px', flexShrink: 0 }}>
        <input
          type="text"
          placeholder="Search across all columns..."
          value={quickFilterText}
          onChange={(e) => setQuickFilterText(e.target.value)}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            flexGrow: 1,
            maxWidth: '400px'
          }}
        />
        {quickFilterText && (
          <button
            onClick={() => setQuickFilterText('')}
            style={{
              padding: '8px 12px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        )}
      </div>
      
      {/* Toolbar with Export and Grid Options */}
      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', padding: '0 10px', flexShrink: 0 }}>
        {/* Export Section */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={exportToExcel}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Export to Excel
          </button>
          <button 
            onClick={exportToCSV}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Export to CSV
          </button>
        </div>
        
        {/* Separator */}
        <div style={{ borderLeft: '1px solid #ccc', height: '30px' }}></div>
        
        {/* Metadata Fields Checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="checkbox"
            id="showMetadataFields"
            checked={showMetadataFields}
            onChange={(e) => setShowMetadataFields(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <label 
            htmlFor="showMetadataFields" 
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            Show Metadata Fields
          </label>
        </div>
        
        {/* Separator */}
        <div style={{ borderLeft: '1px solid #ccc', height: '30px' }}></div>
        
        {/* Grid Options */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => gridApi?.setFilterModel(null)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear All Filters
          </button>
          <button
            onClick={() => {
              gridApi?.deselectAll();
              gridApi?.resetColumnState();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reset Grid
          </button>
          <button
            onClick={() => gridApi?.autoSizeAllColumns()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#607D8B',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Auto-size Columns
          </button>
        </div>
      </div>

      {/* AG Grid */}
      <div className="ag-theme-material" style={{ flex: 1, width: '100%', padding: '0 10px 10px 10px' }}>
        {(() => {
          console.log('=== Rendering Grid Section ===', { 
            columnDefsLength: columnDefs.length, 
            hasAnswers: !!allAnswers,
            answersLength: allAnswers?.length 
          });
          return null;
        })()}
        {columnDefs.length > 0 ? (
          <AgGridReact
            rowData={allAnswers || []}
            columnDefs={columnDefs}
            quickFilterText={quickFilterText}
            theme="legacy"
            defaultColDef={{
              sortable: true,
              filter: true,
              resizable: true,
              flex: 1,
              minWidth: 100,
              floatingFilter: true, // Show filter inputs below headers
              menuTabs: ['filterMenuTab', 'generalMenuTab', 'columnsMenuTab'], // Enable column menu
              headerComponentParams: {
                menuIcon: 'fa-bars' // Show menu icon in headers
              }
            }}
            onGridReady={onGridReady}
            pagination={true}
            paginationPageSize={100}
            paginationPageSizeSelector={[20, 50, 100, 200, 500]} // Page size options
            animateRows={true}
            domLayout='normal'
            enableCellTextSelection={true} // Allow text selection
            ensureDomOrder={true}
            rowSelection='multiple' // Enable row selection
            suppressMenuHide={true} // Always show column menu
            suppressColumnVirtualisation={true} // Ensure all columns render
            getRowHeight={(params) => {
              // Check if any cell in this row has image data
              const hasImages = allQuestions.some(q => {
                const questionType = q.getType();
                if (['file', 'image', 'signaturepad'].includes(questionType)) {
                  const value = params.data[q.name];
                  return value && (
                    (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image'))) ||
                    (Array.isArray(value) && value.length > 0) ||
                    (typeof value === 'object' && value?.url)
                  );
                }
                return false;
              });
              // Return 136px for rows with images (120px + padding), default 50px for others
              return hasImages ? 136 : 50;
            }}
            statusBar={{
              statusPanels: [
                { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
                { statusPanel: 'agTotalRowCountComponent', align: 'center' },
                { statusPanel: 'agFilteredRowCountComponent', align: 'right' }
              ]
            }}
          />
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            <p>No columns defined. Waiting for survey questions to load...</p>
            <p>Debug info: columnDefs.length = {columnDefs.length}, allQuestions.length = {allQuestions?.length}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardScreen;
