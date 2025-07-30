import React from "react";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { QuestionCheckboxModel, surveyLocalization } from "survey-core";
import { Checkbox } from "@ui/ford-ui-components/src/v2/checkbox/Checkbox";
import Showdown from 'showdown';

// Create Showdown converter with same config as web-app
const markdownConverter = new Showdown.Converter({
    openLinksInNewWindow: true,
});

// Helper function to process markdown text
const processMarkdown = (text: string): string => {
    if (!text) return text;
    
    // Check if text contains markdown syntax
    const hasMarkdown = /\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\)/.test(text);
    
    if (!hasMarkdown) {
        return text; // Return as-is if no markdown
    }
    
    // Process markdown to HTML
    const html = markdownConverter.makeHtml(text);
    // Remove root paragraphs to match SurveyJS behavior
    return html.replace(/^<p>(.*)<\/p>$/g, '$1');
};

// Helper function to render label with HTML support
const renderLabel = (text: string): React.ReactNode => {
    if (!text) return null;
    
    const processedText = processMarkdown(text);
    
    if (processedText.includes('<')) {
        return <span dangerouslySetInnerHTML={{ __html: processedText }} />;
    }
    
    return processedText;
};

// Helper function to render description with HTML support
const renderDescription = (description: string): React.ReactNode => {
    if (!description) return null;
    
    const processedDescription = processMarkdown(description);
    
    if (processedDescription.includes('<')) {
        return <span dangerouslySetInnerHTML={{ __html: processedDescription }} />;
    }
    
    return processedDescription;
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
        const question = this.question;
        
        // Get current values (SurveyJS checkboxes store arrays)
        const currentValues = question.value || [];
        
        // Handle labels that might contain JSX elements
        const labelContent = renderLabel(question.fullTitle);
        const descriptionContent = renderDescription(question.description);
        
        // Get error message if validation failed
        const errorMessage = question.errors.length > 0 
            ? (question.errors[0].getText ? question.errors[0].getText() : question.errors[0].text)
            : undefined;
        const isInvalid = question.errors.length > 0;
        
        // Get localized optional text for Ford UI component based on current survey locale
        const currentLocale = question.survey.locale || 'en';
        const optionalText = surveyLocalization.locales[currentLocale]?.["optionalText"] || " (Optional)";

        return (
            <div 
                className="fds-checkbox-group"
                data-testid={`fds-checkbox-${question.name}`}
            >
                {/* Group Label */}
                {labelContent && (
                    <div className="fds-checkbox-group-label" style={{
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        color: 'var(--semantic-color-text-onlight-moderate-default)'
                    }}>
                        {labelContent}
                        {!question.isRequired && (
                            <span style={{color: 'var(--semantic-color-text-onlight-subtle-default)'}}>{optionalText}</span>
                        )}
                    </div>
                )}
                
                {/* Group Description */}
                {descriptionContent && (
                    <div className="fds-checkbox-group-description" style={{
                        color: 'var(--semantic-color-text-onlight-subtle-default)',
                        marginBottom: '0.75rem'
                    }}>
                        {descriptionContent}
                    </div>
                )}
                
                {/* Individual Checkboxes */}
                <div>
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
                
                {/* Error Message */}
                {isInvalid && errorMessage && (
                    <div className="fds-checkbox-error" style={{
                        color: 'var(--semantic-color-text-onlight-danger-default)',
                        fontSize: '0.875rem',
                        marginTop: '0.5rem'
                    }}>
                        {errorMessage}
                    </div>
                )}
            </div>
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