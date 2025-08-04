import React from "react";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { QuestionCheckboxModel } from "survey-core";
import { Checkbox } from "@ui/ford-ui-components/src/v2/checkbox/Checkbox";
import { FDSQuestionWrapper } from "./FDSShared/FDSQuestionWrapper";
import { useQuestionValidation, renderLabel } from "./FDSShared/utils";

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
        const question = this.question;
        const { isInvalid, errorMessage } = useQuestionValidation(question);
        
        
        // Get current values (SurveyJS checkboxes store arrays)
        const currentValues = question.value || [];

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
                    {question.choices.map((choice: any, index: number) => {
                        const isChecked = currentValues.includes(choice.value);
                        const choiceLabel = renderLabel(choice.text || choice.value);
                        
                        return (
                            <div key={choice.value || index} style={{ marginBottom: '0.5rem' }}>
                                <Checkbox
                                    isSelected={isChecked}
                                    onChange={(isSelected) => {
                                        if (question.isReadOnly) return;
                                        
                                        let newValues = [...currentValues];
                                        
                                        if (isSelected) {
                                            // Add value if not already present
                                            if (!newValues.includes(choice.value)) {
                                                newValues.push(choice.value);
                                            }
                                        } else {
                                            // Remove value
                                            newValues = newValues.filter(v => v !== choice.value);
                                        }
                                        
                                        question.value = newValues;
                                    }}
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
                </div>
            </FDSQuestionWrapper>
        );
    }
}

// Register the checkbox renderer
ReactQuestionFactory.Instance.registerQuestion(
    "checkbox",
    (props) => {
        return React.createElement(FDSCheckboxRenderer, props);
    }
);