import React, { useState, useEffect } from "react";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { QuestionCheckboxModel } from "survey-core";
import { Checkbox } from "@ui/ford-ui-components/src/v2/checkbox/Checkbox";
import { StyledTextField } from "@ui/ford-ui-components/src/v2/inputField/Input";
import { FDSQuestionWrapper } from "./FDSShared/FDSQuestionWrapper";
import { useQuestionValidation, renderLabel } from "./FDSShared/utils";

// Functional component to handle the Other text input
const FDSCheckboxComponent: React.FC<{ question: QuestionCheckboxModel }> = ({ question }) => {
    const { isInvalid, errorMessage } = useQuestionValidation(question);
    
    // Track if "Other" is selected
    const [isOtherSelected, setIsOtherSelected] = useState(question.isOtherSelected);
    const [otherText, setOtherText] = useState(question.comment || "");
    
    // Update when question value changes
    useEffect(() => {
        setIsOtherSelected(question.isOtherSelected);
        setOtherText(question.comment || "");
    }, [question.value, question.comment, question.isOtherSelected]);
    
    // Get current values (SurveyJS checkboxes store arrays)
    const currentValues = question.value || [];
    
    const handleCheckboxChange = (choice: any, isSelected: boolean) => {
        if (question.isReadOnly) return;
        
        let newValues = [...currentValues];
        
        if (isSelected) {
            // Add value if not already present
            if (!newValues.includes(choice.value)) {
                newValues.push(choice.value);
            }
            
            // Check if "Other" was selected
            if (question.showOtherItem && choice.value === question.otherItem.value) {
                setIsOtherSelected(true);
            }
        } else {
            // Remove value
            newValues = newValues.filter(v => v !== choice.value);
            
            // Check if "Other" was deselected
            if (question.showOtherItem && choice.value === question.otherItem.value) {
                setIsOtherSelected(false);
                // Clear other text
                if (question.comment) {
                    question.comment = "";
                    setOtherText("");
                }
            }
        }
        
        question.value = newValues;
    };
    
    const handleOtherTextChange = (value: string) => {
        setOtherText(value);
        question.comment = value;
    };
    
    return (
        <FDSQuestionWrapper
            label={question.fullTitle}
            description={question.description}
            isRequired={question.isRequired}
            isInvalid={isInvalid}
            errorMessage={errorMessage}
            question={question}
        >
            <div data-testid={`fds-checkbox-${question.name}`}>
                {question.visibleChoices.map((choice: any, index: number) => {
                    const isChecked = currentValues.includes(choice.value);
                    const choiceLabel = renderLabel(choice.text || choice.value);
                    
                    return (
                        <div key={choice.value || index} style={{ marginBottom: '0.5rem' }}>
                            <Checkbox
                                isSelected={isChecked}
                                onChange={(isSelected) => handleCheckboxChange(choice, isSelected)}
                                isDisabled={question.isReadOnly}
                                isInvalid={isInvalid}
                                name={`${question.name}-${choice.value}`}
                                value={choice.value}
                                data-testid={`fds-checkbox-${question.name}-${choice.value}`}
                                aria-label={choice.text || choice.value}
                                onBlur={() => {
                                    question.validate();
                                }}
                            >
                                {choiceLabel}
                            </Checkbox>
                        </div>
                    );
                })}
                
                {/* Show text input for "Other" option when selected */}
                {isOtherSelected && (
                    <div className="mt-2 ml-6">
                        <StyledTextField
                            value={otherText}
                            onChange={(value: string) => handleOtherTextChange(value)}
                            placeholder={question.otherPlaceholder || "Please specify..."}
                            isDisabled={question.isReadOnly}
                            isInvalid={isInvalid && !otherText && question.isRequired}
                            onBlur={() => {
                                question.validate();
                            }}
                            data-testid={`fds-checkbox-other-${question.name}`}
                            aria-label="Other - Please specify"
                        />
                    </div>
                )}
            </div>
        </FDSQuestionWrapper>
    );
};

export class FDSCheckboxRenderer extends SurveyQuestionElementBase {
    constructor(props: any) {
        super(props);
    }

    protected get question(): QuestionCheckboxModel {
        return this.questionBase as QuestionCheckboxModel;
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
        
        return <FDSCheckboxComponent question={this.question} />;
    }
}

// Register the checkbox renderer with useAsDefault: true to replace default SurveyJS checkbox
ReactQuestionFactory.Instance.registerQuestion(
    "checkbox",
    (props) => {
        return React.createElement(FDSCheckboxRenderer, props);
    },
    "customtype", // Using "customtype" for the third parameter to enable useAsDefault
    true // useAsDefault: true - replaces default SurveyJS checkbox renderer
);