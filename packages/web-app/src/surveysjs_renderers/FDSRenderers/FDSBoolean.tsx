// @ts-nocheck
import React, { useState, useEffect } from "react";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { QuestionBooleanModel, Serializer, RendererFactory } from "survey-core";
import { Checkbox as FDSCheckbox, Toggle, Typography } from "@ui/ford-ui-components";
import { FDSQuestionWrapper } from "./FDSShared/FDSQuestionWrapper";
import { useQuestionValidation, renderLabel, getOptionalText, processMarkdown, isQuestionEffectivelyRequired } from "./FDSShared/utils";

// Functional component to handle both checkbox and toggle rendering
export const FDSBooleanComponent: React.FC<{ question: QuestionBooleanModel }> = ({ question }) => {
    const { isInvalid, errorMessage } = useQuestionValidation(question);

    const computeChecked = () => question.booleanValue === true;

    // Track the boolean value
    const [isChecked, setIsChecked] = useState(computeChecked());

    // Update when question value changes
    useEffect(() => {
        setIsChecked(computeChecked());
    }, [question.value]);

    // Determine render mode from renderAs property, default to 'toggle'
    const renderMode = question.renderAs || 'toggle';

    const handleChange = (value: boolean) => {
        if (question.isReadOnly) return;

        setIsChecked(value);
        question.booleanValue = value;
    };

    // Resolve localized strings provided by SurveyJS (supports markdown/HTML)
    const resolveText = (localizable: any, fallback: string = ''): string => {
        const value = localizable?.textOrHtml ?? localizable;
        return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
    };

    const parentTitle = resolveText(question.parentQuestion?.locTitle, question.parentQuestion?.fullTitle);
    const labelTrueText = resolveText(question.locLabelTrue, '');
    const labelFalseText = resolveText(question.locLabelFalse, '');
    const legacyLabelText = resolveText(question.locLabel, question.label);
    const titleText = resolveText(question.locTitle, question.fullTitle || parentTitle || '');
    const requiredStatus = isQuestionEffectivelyRequired(question);
    const optionalSuffix = !requiredStatus ? getOptionalText(question) : '';

    if (process.env.NODE_ENV !== 'production') {
        console.log('[FDSBoolean] render', {
            name: question.name,
            renderMode,
            parentType: question.parentQuestion?.getType?.(),
            parentName: question.parentQuestion?.name,
            labelTrueText,
            labelFalseText,
            legacyLabelText,
            titleText,
            parentTitle,
            booleanValue: question.booleanValue,
        });
    }

    // For checkbox mode, we need to render a single checkbox with label
    if (renderMode === 'checkbox') {
        const checkboxLabelRaw = legacyLabelText || labelTrueText || titleText || parentTitle || '';
        const ariaLabel =
            checkboxLabelRaw.replace(/<[^>]+>/g, '').trim() ||
            titleText.replace(/<[^>]+>/g, '').trim() ||
            question.fullTitle ||
            question.name;

        const labelHtml = processMarkdown(checkboxLabelRaw || '');
        const optionalMarkup = optionalSuffix
            ? `<span class="ml-1 text-ford-text-subtle">${optionalSuffix}</span>`
            : '';
        const combinedLabel = `${labelHtml ?? ''}${optionalMarkup}`;

        return (
            <FDSQuestionWrapper
                label={question.fullTitle}
                description={question.description || question.parentQuestion?.description}
                isRequired={requiredStatus}
                isInvalid={isInvalid}
                errorMessage={errorMessage}
                question={question}
            >
                <div data-testid={`fds-boolean-checkbox-${question.name}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FDSCheckbox
                            isSelected={isChecked}
                            onChange={(value: boolean) => handleChange(value)}
                            isDisabled={question.isReadOnly}
                            isInvalid={isInvalid}
                            name={question.name}
                            value={question.name}
                            data-testid={`fds-boolean-checkbox-input-${question.name}`}
                            aria-label={ariaLabel}
                            label={combinedLabel}
                            labelProps={{
                                className: "text-left text-ford-body1-regular",
                                displayStyle: "body-1-regular",
                                displayColor: "text-onlight-strong",
                            }}
                            onBlur={() => {
                                question.validate();
                            }}
                        />
                    </div>
                </div>
            </FDSQuestionWrapper>
        );
    }

    // Toggle mode (default)
    return (
        <FDSQuestionWrapper
            label={question.fullTitle}
            description={question.description}
            isRequired={requiredStatus}
            isInvalid={isInvalid}
            errorMessage={errorMessage}
            question={question}
        >
            <div data-testid={`fds-boolean-toggle-${question.name}`}>
                <Toggle
                    isSelected={isChecked}
                    isDisabled={question.isReadOnly}
                    onChange={(value: boolean) => handleChange(value)}
                    onBlur={() => {
                        question.validate();
                    }}
                    data-testid={`fds-boolean-toggle-input-${question.name}`}
                    aria-label={(legacyLabelText || labelTrueText || labelFalseText || titleText || question.fullTitle)?.replace?.(/<[^>]+>/g, '').trim() || question.name}
                >
                    {/* Optional toggle label text */}
                    {labelTrueText || labelFalseText || legacyLabelText ? (
                        <Typography
                            displayStyle="body-2-regular"
                            displayColor="text-onlight-strong"
                            spanProps={{ className: "text-ford-body2-regular" }}
                        >
                            {renderLabel(
                                isChecked
                                    ? (labelTrueText || legacyLabelText || "Yes")
                                    : (labelFalseText || legacyLabelText || "No")
                            )}
                        </Typography>
                    ) : null}
                </Toggle>
            </div>
        </FDSQuestionWrapper>
    );
};

export class FDSBooleanRenderer extends SurveyQuestionElementBase {
    constructor(props: any) {
        super(props);
    }

    protected get question(): QuestionBooleanModel {
        return this.questionBase as QuestionBooleanModel;
    }

    protected canRender(): boolean {
        return super.canRender();
    }

    protected renderElement(): JSX.Element {
        // Check if we're in designer mode - use default SurveyJS rendering for editing capabilities
        if (this.question.isDesignMode) {
            console.log('[FDSBooleanRenderer] Falling back to default rendering (design mode)', {
                name: this.question.name,
                surveyMode: this.question.survey?.mode,
                parentType: this.question.parentQuestion?.getType?.(),
            });
            return super.renderElement();
        }

        console.log('[FDSBooleanRenderer] Rendering FDS boolean', {
            name: this.question.name,
            parentType: this.question.parentQuestion?.getType?.(),
            isDesignMode: this.question.isDesignMode,
        });
        return <FDSBooleanComponent question={this.question} />;
    }
}

// Register the boolean renderer with useAsDefault: true to replace default SurveyJS boolean
export function registerFDSBooleanRenderer(factory = ReactQuestionFactory.Instance) {
    const rendererFactory = factory || ReactQuestionFactory.Instance;

    rendererFactory.registerQuestion(
        "boolean",
        (props) => {
            return React.createElement(FDSBooleanRenderer, props);
        },
        "customtype", // Using "customtype" for the third parameter to enable useAsDefault
        true // useAsDefault: true - replaces default SurveyJS boolean renderer
    );

    rendererFactory.registerQuestion(
        "fds-boolean-checkbox",
        (props) => {
            return React.createElement(FDSBooleanRenderer, props);
        }
    );

    RendererFactory.Instance.registerRenderer(
        "boolean",
        "checkbox",
        "fds-boolean-checkbox"
    );
}
