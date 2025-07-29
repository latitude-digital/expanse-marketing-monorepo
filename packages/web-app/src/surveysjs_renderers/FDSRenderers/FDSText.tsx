import React from "react";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { QuestionTextModel, surveyLocalization } from "survey-core";
import { StyledTextField } from "@ui/ford-ui-components/src/v2/inputField/Input";
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

export class FDSTextRenderer extends SurveyQuestionElementBase {
    constructor(props: any) {
        super(props);
    }

    protected get question(): QuestionTextModel {
        return this.questionBase as QuestionTextModel;
    }

    protected canRender(): boolean {
        return super.canRender();
    }

    protected renderElement(): JSX.Element {
        const question = this.question;
        
        // Get the question title and handle required/optional indication
        const title = question.fullTitle;
        const isRequired = question.isRequired;
        
        // Get error message if validation failed
        // SurveyJS error objects use getText() method for localized error messages
        const errorMessage = question.errors.length > 0 
            ? (question.errors[0].getText ? question.errors[0].getText() : question.errors[0].text)
            : undefined;
        const isInvalid = question.errors.length > 0;
        
        // Handle different input types
        const inputType = this.getInputType();
        
        // Get localized optional text for Ford UI component based on current survey locale
        const currentLocale = question.survey.locale || 'en';
        const optionalText = surveyLocalization.locales[currentLocale]?.["optionalText"] || " (Optional)";
        
        // Process markdown for title and description
        const processedTitle = processMarkdown(title);
        const processedDescription = processMarkdown(question.description);
        
        // Create a wrapper for HTML content
        const HtmlContent = ({ html }: { html: string }) => (
            <span dangerouslySetInnerHTML={{ __html: html }} />
        );
        
        return (
            <StyledTextField
                label={processedTitle.includes('<') ? <HtmlContent html={processedTitle} /> : processedTitle}
                description={processedDescription.includes('<') ? <HtmlContent html={processedDescription} /> : processedDescription}
                isRequired={isRequired}
                requiredMessage={optionalText}
                placeholder={question.placeholder || ""}
                value={question.value || ""}
                isInvalid={isInvalid}
                errorMessage={errorMessage}
                type={inputType}
                isDisabled={question.isReadOnly}
                onChange={(value: string) => {
                    question.value = value;
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
}

// Override the default text question renderer with our Ford UI version
ReactQuestionFactory.Instance.registerQuestion(
    "text",
    (props) => {
        return React.createElement(FDSTextRenderer, props);
    }
);

// Also register for email text input type
ReactQuestionFactory.Instance.registerQuestion(
    "emailtextinput",
    (props) => {
        return React.createElement(FDSTextRenderer, props);
    }
);