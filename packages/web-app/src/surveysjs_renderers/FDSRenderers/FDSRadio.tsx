import React, { useState, useEffect } from "react";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { QuestionRadiogroupModel } from "survey-core";
import { RadioButtonGroup } from "@ui/ford-ui-components/src/v2/radio/RadioButtonGroup";
import { StyledTextField } from "@ui/ford-ui-components/src/v2/inputField/Input";
import { FDSQuestionWrapper } from "./FDSShared/FDSQuestionWrapper";
import { useQuestionValidation, renderLabel, renderDescription, getOptionalText } from "./FDSShared";

// Functional component to handle the Other text input
const FDSRadioComponent: React.FC<{ question: QuestionRadiogroupModel }> = ({ question }) => {
    const { isInvalid, errorMessage } = useQuestionValidation(question);
    const optionalText = getOptionalText(question);
    
    // Track if "Other" is selected
    const [isOtherSelected, setIsOtherSelected] = useState(question.isOtherSelected);
    const [otherText, setOtherText] = useState(question.comment || "");
    
    // Update when question value changes
    useEffect(() => {
        setIsOtherSelected(question.isOtherSelected);
        setOtherText(question.comment || "");
    }, [question.value, question.comment, question.isOtherSelected]);
    
    // Transform SurveyJS visibleChoices to RadioButtonGroup options format
    // visibleChoices includes special items like None and Other
    const options = question.visibleChoices.map((choice: any) => ({
        label: choice.text || choice.value,
        value: choice.value
    }));
    
    const handleRadioChange = (value: string) => {
        question.value = value;
        
        // Check if "Other" was selected
        if (question.showOtherItem && value === question.otherItem.value) {
            setIsOtherSelected(true);
        } else {
            setIsOtherSelected(false);
            // Clear other text if not selected
            if (question.comment) {
                question.comment = "";
            }
        }
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
            {/* Wrapper with relative positioning to contain absolutely positioned radio inputs */}
            <div className="relative">
                <RadioButtonGroup
                    options={options}
                    value={question.value || ""}
                    isInvalid={isInvalid}
                    isDisabled={question.isReadOnly}
                    onChange={handleRadioChange}
                    onBlur={() => {
                        question.validate();
                    }}
                    data-testid={`fds-radio-${question.name}`}
                    aria-label={question.fullTitle}
                    className="[&>*]:justify-center"
                />
                
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
                            data-testid={`fds-radio-other-${question.name}`}
                            aria-label="Other - Please specify"
                        />
                    </div>
                )}
            </div>
        </FDSQuestionWrapper>
    );
};

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
        // Check if we're in designer mode - use default SurveyJS rendering for editing capabilities
        // The question object has isDesignMode property
        if (this.question.isDesignMode) {
            return super.renderElement();
        }
        
        return <FDSRadioComponent question={this.question} />;
    }
}

// Register the radio group renderer with useAsDefault: true to replace default SurveyJS radio
ReactQuestionFactory.Instance.registerQuestion(
    "radiogroup",
    (props) => {
        return React.createElement(FDSRadioRenderer, props);
    },
    "customtype", // Using "customtype" for the third parameter to enable useAsDefault
    true // useAsDefault: true - replaces default SurveyJS radio renderer
);