import React from "react";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { QuestionTextModel } from "survey-core";
import { StyledTextField } from "@ui/ford-ui-components/src/v2/inputField/Input";
import { renderLabel, renderDescription, getOptionalText } from "./FDSShared/utils";

interface ParsedAddress {
  formatted_address?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export class FDSTextRenderer extends SurveyQuestionElementBase {
    constructor(props: any) {
        super(props);
        
        // Force re-render when errors change (for composite questions)
        const question = this.question;
        if (question) {
            question.registerFunctionOnPropertyValueChanged("errors", () => {
                this.forceUpdate();
            });
            
            // Also listen to parent errors if this is a child of a composite
            const parentQuestion = question.parent;
            if (parentQuestion) {
                parentQuestion.registerFunctionOnPropertyValueChanged("errors", () => {
                    this.forceUpdate();
                });
            }
        }
    }

    protected get question(): QuestionTextModel {
        return this.questionBase as QuestionTextModel;
    }

    protected canRender(): boolean {
        return super.canRender();
    }

    protected renderElement(): JSX.Element {
        const question = this.question;
        const inputType = this.getInputType();
        const optionalText = getOptionalText(question);
        
        // Get validation state from question or parent (for composite questions)
        // For composite questions, the error is on the parent question
        const parentQuestion = question.parent;
        
        const questionErrors = question.errors && question.errors.length > 0 ? question.errors : 
                              (parentQuestion && parentQuestion.errors && parentQuestion.errors.length > 0 ? parentQuestion.errors : []);
        const isInvalid = questionErrors.length > 0;
        // Get error text - it might be in .text or need to call .getText()
        const errorMessage = isInvalid ? 
            (questionErrors[0]?.getText ? questionErrors[0].getText() : questionErrors[0]?.text) : 
            undefined;
        
        // Determine if this question uses pattern masking
        const usesMasking = question.maskType === "pattern" && question.maskSettings?.pattern;
        
        // Get display value (masked if applicable)
        const getDisplayValue = (): string => {
            const rawValue = question.value || "";
            if (usesMasking) {
                return this.applyInputMask(rawValue, question.maskSettings.pattern);
            }
            return rawValue;
        };
        // For composite questions, check parent's isRequired too
        const isRequired = question.isRequired || (parentQuestion && parentQuestion.isRequired);
        
        return (
            <StyledTextField
                label={renderLabel(question.fullTitle)}
                description={renderDescription(question.description)}
                isRequired={isRequired}
                requiredMessage={!isRequired ? optionalText : undefined}
                placeholder={usesMasking 
                    ? this.getMaskPlaceholder(question.maskSettings.pattern) 
                    : (question.placeholder || "")}
                value={getDisplayValue()}
                isInvalid={isInvalid}
                errorMessage={errorMessage}
                type={inputType}
                isDisabled={question.isReadOnly}
                autoComplete={question.autocomplete}
                onChange={(value: string) => {
                    if (usesMasking) {
                        // Store only the unmasked (digits-only) value in the question
                        const unmaskedValue = this.removeMaskFormatting(value);
                        question.value = unmaskedValue;
                        
                        // Force re-render to show masked display
                        this.forceUpdate();
                    } else {
                        question.value = value;
                    }
                }}
                onBlur={() => {
                    // Trigger validation on blur
                    question.validate();
                }}
                data-testid={`fds-text-${question.name}`}
            />
        );
    }

    private getInputType(): string {
        const question = this.question;
        
        // Map SurveyJS input types to HTML input types
        switch (question.inputType) {
            case "email":
                return "email";
            case "number":
                return "number";
            case "password":
                return "password";
            case "tel":
                return "tel";
            case "url":
                return "url";
            case "date":
                return "date";
            case "datetime-local":
                return "datetime-local";
            case "time":
                return "time";
            default:
                return "text";
        }
    }

    private applyInputMask(value: string, pattern: string): string {
        // Remove any existing formatting
        const cleanValue = value.replace(/\D/g, '');
        
        let maskedValue = '';
        let valueIndex = 0;
        
        for (let i = 0; i < pattern.length && valueIndex < cleanValue.length; i++) {
            const patternChar = pattern[i];
            
            if (patternChar === '9') {
                // Insert digit
                maskedValue += cleanValue[valueIndex];
                valueIndex++;
            } else {
                // Insert literal character (like -, (, ), etc.)
                maskedValue += patternChar;
            }
        }
        
        return maskedValue;
    }

    private getMaskPlaceholder(pattern: string): string {
        // Convert pattern to placeholder by replacing 9s with underscores
        return pattern.replace(/9/g, '_');
    }

    private removeMaskFormatting(maskedValue: string): string {
        // Remove all non-digit characters for storage
        return maskedValue.replace(/\D/g, '');
    }
}

// Override the default text question renderer with our Ford UI version
ReactQuestionFactory.Instance.registerQuestion(
    "text",
    (props) => {
        return React.createElement(FDSTextRenderer, props);
    }
);

// NOTE: Do NOT register "emailtextinput" here - it has its own brand-aware factory
// in EmailTextInput/index.tsx that chooses between Ford UI and default SurveyJS rendering