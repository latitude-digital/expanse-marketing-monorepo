// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { QuestionTagboxModel } from "survey-core";
import { StyledSelectDropdown as SelectDropdown, StyledButton } from "@ui/ford-ui-components";
import { useQuestionValidation, renderLabel, renderDescription, getOptionalText, FDSQuestionWrapper } from "./FDSShared";

// Functional component wrapper to use React hooks
const FDSTagboxComponent: React.FC<{ question: QuestionTagboxModel }> = ({ question }) => {
    const { isInvalid, errorMessage } = useQuestionValidation(question);
    const optionalText = getOptionalText(question);
    
    // State for dropdown open/closed
    const [isOpen, setIsOpen] = useState(false);
    
    // Ref for the dropdown container to detect clicks outside
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);
    
    // Transform SurveyJS visibleChoices to options format
    // visibleChoices includes special items like None and Other
    const options = question.visibleChoices.map((choice: any, index: number) => ({
        id: choice.value || index,
        label: choice.text || choice.value,
        value: choice.value
    }));
    
    // Get selected values (tagbox value is an array)
    const selectedValues = Array.isArray(question.value) ? question.value : [];
    
    // Handle selection change
    const handleSelectionChange = (selectedValue: any) => {
        const currentValues = Array.isArray(question.value) ? [...question.value] : [];
        
        if (currentValues.includes(selectedValue)) {
            // Remove if already selected
            const newValues = currentValues.filter(val => val !== selectedValue);
            question.value = newValues.length > 0 ? newValues : undefined;
        } else {
            // Add if not selected
            question.value = [...currentValues, selectedValue];
        }
        
        // Keep dropdown open for multi-select
        // setIsOpen(false); // Don't close immediately
    };
    
    // Handle chip removal
    const handleChipRemove = (valueToRemove: any) => {
        const currentValues = Array.isArray(question.value) ? [...question.value] : [];
        const newValues = currentValues.filter(val => val !== valueToRemove);
        question.value = newValues.length > 0 ? newValues : undefined;
    };
    
    // Render selected chips
    const renderSelectedChips = () => {
        if (selectedValues.length === 0) return null;
        
        return (
            <div className="flex flex-wrap gap-2 mb-2">
                {selectedValues.map((value: any) => {
                    const option = options.find(opt => opt.value === value);
                    if (!option) return null;
                    
                    return (
                        <div
                            key={value}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--semantic-color-fill-onlight-interactive)] text-white rounded-full text-sm"
                        >
                            <span>{option.label}</span>
                            <button
                                type="button"
                                onClick={() => handleChipRemove(value)}
                                className="ml-1 text-white hover:text-gray-200 focus:outline-none"
                                aria-label={`Remove ${option.label}`}
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    };
    
    // Render custom dropdown
    const renderDropdown = () => {
        return (
            <div className="relative" ref={dropdownRef}>
                {/* Selected chips display */}
                {renderSelectedChips()}
                
                {/* Dropdown trigger */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        w-full px-3 py-2 text-left border rounded-md bg-white
                        flex items-center justify-between
                        ${isInvalid ? 'border-red-500' : 'border-gray-300'}
                        ${question.isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400 cursor-pointer'}
                    `}
                    disabled={question.isReadOnly}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                >
                    <span className="text-gray-500">
                        {selectedValues.length > 0 
                            ? `${selectedValues.length} selected`
                            : question.placeholder || "Select..."
                        }
                    </span>
                    <svg 
                        className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                
                {/* Dropdown options */}
                {isOpen && (
                    <div 
                        className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg overflow-auto"
                        style={{ 
                            minHeight: '160px',  // Show at least 4 options
                            maxHeight: '240px'   // Keep reasonable max height
                        }}
                    >
                        {options.map((option) => {
                            const isSelected = selectedValues.includes(option.value);
                            
                            return (
                                <div
                                    key={option.id}
                                    onClick={() => handleSelectionChange(option.value)}
                                    className={`
                                        px-3 py-2 cursor-pointer flex items-center gap-2
                                        ${isSelected 
                                            ? 'bg-[var(--semantic-color-fill-onlight-interactive)] text-white' 
                                            : 'hover:bg-gray-100'
                                        }
                                    `}
                                    role="option"
                                    aria-selected={isSelected}
                                >
                                    <div className={`
                                        w-4 h-4 border rounded flex items-center justify-center
                                        ${isSelected ? 'bg-white border-white' : 'border-gray-400'}
                                    `}>
                                        {isSelected && (
                                            <svg className="w-3 h-3 text-[var(--semantic-color-fill-onlight-interactive)]" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <span>{option.label}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };
    
    // Handle labels that might contain JSX elements
    const labelContent = renderLabel(question.fullTitle);
    const label = typeof labelContent === 'string' ? labelContent : question.fullTitle;
    
    const descriptionContent = renderDescription(question.description);
    const description = typeof descriptionContent === 'string' ? descriptionContent : question.description;
    
    return (
        <FDSQuestionWrapper
            label={label}
            description={description}
            isRequired={question.isRequired}
            isInvalid={isInvalid}
            errorMessage={errorMessage}
            question={question}
        >
            {renderDropdown()}
        </FDSQuestionWrapper>
    );
};

export class FDSTagboxRenderer extends SurveyQuestionElementBase {
    constructor(props: any) {
        super(props);
    }

    protected get question(): QuestionTagboxModel {
        return this.questionBase as QuestionTagboxModel;
    }

    protected canRender(): boolean {
        return super.canRender();
    }

    protected renderElement(): JSX.Element {
        // Check if we're in designer mode - use default SurveyJS rendering for editing capabilities
        // The question object has isDesignMode property
        if (this.question.isDesignMode) {
            return super.renderElement();
        }
        
        return <FDSTagboxComponent question={this.question} />;
    }
}

// Register the tagbox renderer with useAsDefault: true to replace default SurveyJS tagbox
export function registerFDSTagboxRenderer(factory = ReactQuestionFactory.Instance) {
    factory.registerQuestion(
        "tagbox",
        (props) => {
            return React.createElement(FDSTagboxRenderer, props);
        },
        "customtype", // Using "customtype" for the third parameter to enable useAsDefault
        true // useAsDefault: true - replaces default SurveyJS tagbox renderer
    );
}
// @ts-nocheck
