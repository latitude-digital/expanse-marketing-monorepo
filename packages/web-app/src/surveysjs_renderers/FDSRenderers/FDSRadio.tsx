import React from "react";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { QuestionRadiogroupModel } from "survey-core";
import { RadioButtonGroup } from "@ui/ford-ui-components/src/v2/radio/RadioButtonGroup";
import { FDSQuestionWrapper } from "./FDSShared/FDSQuestionWrapper";
import { useQuestionValidation, renderLabel, renderDescription, getOptionalText } from "./FDSShared";

export class FDSRadioRenderer extends SurveyQuestionElementBase {
    constructor(props: any) {
        super(props);
    }

    protected get question(): QuestionRadiogroupModel {
        return this.questionBase as QuestionRadiogroupModel;
    }

    protected canRender(): boolean {
        return super.canRender();
    }

    protected renderElement(): JSX.Element {
        const question = this.question;
        const { isInvalid, errorMessage } = useQuestionValidation(question);
        const optionalText = getOptionalText(question);
        
        
        // Transform SurveyJS choices to RadioButtonGroup options format
        const options = question.choices.map((choice: any) => ({
            label: choice.text || choice.value,
            value: choice.value
        }));

        return (
            <FDSQuestionWrapper
                label={question.fullTitle}
                description={question.description}
                isRequired={question.isRequired}
                isInvalid={isInvalid}
                errorMessage={errorMessage}
                question={question}
            >
                {/* Wrapper with relative positioning to contain absolutely positioned radio inputs */}
                <div className="relative">
                    <RadioButtonGroup
                        options={options}
                        value={question.value || ""}
                        isInvalid={isInvalid}
                        isDisabled={question.isReadOnly}
                        onChange={(value: string) => {
                            question.value = value;
                        }}
                        onBlur={() => {
                            question.validate();
                        }}
                        data-testid={`fds-radio-${question.name}`}
                        aria-label={question.fullTitle}
                        className="[&>*]:justify-center"
                    />
                </div>
            </FDSQuestionWrapper>
        );
    }
}

// Register the radio group renderer
ReactQuestionFactory.Instance.registerQuestion(
    "radiogroup",
    (props) => {
        return React.createElement(FDSRadioRenderer, props);
    }
);