import React from "react";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { QuestionDropdownModel } from "survey-core";
import { StyledSelectDropdown as SelectDropdown } from "@ui/ford-ui-components/src/v2/selectDropdown/SelectDropdown";
import { useQuestionValidation, renderLabel, renderDescription, getOptionalText } from "./FDSShared";

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
        const question = this.question;
        const { isInvalid, errorMessage } = useQuestionValidation(question);
        const optionalText = getOptionalText(question);
        
        // Transform SurveyJS choices to SelectDropdown options format
        const options = question.choices.map((choice: any, index: number) => ({
            id: choice.value || index,
            label: choice.text || choice.value,
            value: choice.value
        }));

        // Handle labels that might contain JSX elements
        const labelContent = renderLabel(question.fullTitle);
        const label = typeof labelContent === 'string' ? labelContent : question.fullTitle;
        
        const descriptionContent = renderDescription(question.description);
        const description = typeof descriptionContent === 'string' ? descriptionContent : question.description;

        return (
            <SelectDropdown
                label={label}
                description={description}
                placeholder={question.placeholder || "Please select..."}
                options={options}
                selectedKey={question.value || null}
                isInvalid={isInvalid}
                errorMessage={errorMessage}
                isRequired={question.isRequired}
                requiredMessage={optionalText}
                isDisabled={question.isReadOnly}
                onSelectionChange={(key: any) => {
                    // SelectDropdown onSelectionChange provides Key type, need to find corresponding option value
                    const selectedOption = options.find(opt => opt.id === key);
                    if (selectedOption) {
                        question.value = selectedOption.value;
                    }
                }}
                onBlur={() => {
                    question.validate();
                }}
                data-testid={`fds-dropdown-${question.name}`}
                aria-label={question.fullTitle}
            />
        );
    }
}

// Register the dropdown renderer
ReactQuestionFactory.Instance.registerQuestion(
    "dropdown",
    (props) => {
        return React.createElement(FDSDropdownRenderer, props);
    }
);