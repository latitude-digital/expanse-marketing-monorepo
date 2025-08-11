import React, { useState } from "react";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { QuestionDropdownModel } from "survey-core";
import { StyledSelectDropdown as SelectDropdown } from "@ui/ford-ui-components/src/v2/selectDropdown/SelectDropdown";
import { useQuestionValidation, renderLabel, renderDescription, getOptionalText } from "./FDSShared";

// Functional component wrapper to use React hooks
const FDSDropdownComponent: React.FC<{ question: QuestionDropdownModel }> = ({ question }) => {
    const { isInvalid, errorMessage } = useQuestionValidation(question);
    const optionalText = getOptionalText(question);
    
    // Determine if this should be a searchable combobox 
    // Use ComboBox for any question with choicesByUrl (external data source)
    const isSearchable = Boolean(question.choicesByUrl?.url);
    
    // Use React hook for filter state if this is a combobox
    const [searchValue, setSearchValue] = useState('');

    // State to track when choices are loaded
    const [choicesLoaded, setChoicesLoaded] = React.useState(false);

    // Monitor when choices are loaded for searchable questions
    React.useEffect(() => {
        if (isSearchable && question.choices.length > 0) {
            setChoicesLoaded(true);
        }
    }, [isSearchable, question.choices.length]);
    
    // Transform SurveyJS visibleChoices to SelectDropdown options format
    // visibleChoices includes special items like None and Other
    const options = question.visibleChoices.map((choice: any, index: number) => ({
        id: choice.value || index,
        label: choice.text || choice.value,
        value: choice.value
    }));
    
    
    // Filter options based on search value for combobox variant
    const filteredOptions = isSearchable 
        ? options.filter(option => 
            option.label.toLowerCase().includes(searchValue.toLowerCase())
          )
        : options;
        

    // Handle labels that might contain JSX elements
    const labelContent = renderLabel(question.fullTitle);
    const label = typeof labelContent === 'string' ? labelContent : question.fullTitle;
    
    const descriptionContent = renderDescription(question.description);
    const description = typeof descriptionContent === 'string' ? descriptionContent : question.description;

    return (
        <SelectDropdown
            label={label}
            description={description}
            placeholder={question.placeholder || (isSearchable ? "Search / Select..." : "Please select...")}
            options={filteredOptions}
            selectedKey={question.value || null}
            variant={isSearchable ? "combobox" : "select"}
            searchValue={isSearchable ? searchValue : undefined}
            filterPlaceholder={isSearchable ? "Type to search..." : undefined}
            isInvalid={isInvalid}
            errorMessage={errorMessage}
            isRequired={question.isRequired}
            requiredMessage={!question.isRequired ? optionalText : undefined}
            isDisabled={question.isReadOnly}
            listBoxProps={isSearchable ? { 
                style: { maxHeight: '240px' }, // Override max-h-60 which seems to be 60px instead of 240px
                className: 'outline-none overflow-auto'
            } : undefined}
            onSelectionChange={(key: any) => {
                // SelectDropdown onSelectionChange provides Key type, need to find corresponding option value
                const selectedOption = filteredOptions.find(opt => opt.id === key);
                if (selectedOption) {
                    question.value = selectedOption.value;
                }
            }}
            onFilter={isSearchable ? setSearchValue : undefined}
            onBlur={() => {
                question.validate();
            }}
            data-testid={`fds-dropdown-${question.name}`}
            aria-label={question.fullTitle}
        />
    );
};

export class FDSDropdownRenderer extends SurveyQuestionElementBase {
    constructor(props: any) {
        super(props);
    }

    protected get question(): QuestionDropdownModel {
        return this.questionBase as QuestionDropdownModel;
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
        
        return <FDSDropdownComponent question={this.question} />;
    }
}

// Register the dropdown renderer with useAsDefault: true to replace default SurveyJS dropdown
ReactQuestionFactory.Instance.registerQuestion(
    "dropdown",
    (props) => {
        return React.createElement(FDSDropdownRenderer, props);
    },
    "customtype", // Using "customtype" for the third parameter to enable useAsDefault  
    true // useAsDefault: true - replaces default SurveyJS dropdown renderer
);