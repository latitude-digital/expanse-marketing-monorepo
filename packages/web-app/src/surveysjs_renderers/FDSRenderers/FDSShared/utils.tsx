import React from 'react';
import { surveyLocalization } from 'survey-core';
import Showdown from 'showdown';

// Create Showdown converter with same config as web-app
const markdownConverter = new Showdown.Converter({
    openLinksInNewWindow: true,
});

// Helper function to process markdown text
export const processMarkdown = (text: string): string => {
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

// Create a wrapper for HTML content
export const HtmlContent = ({ html }: { html: string }) => (
    <span dangerouslySetInnerHTML={{ __html: html }} />
);

// Get localized optional text for Ford UI component
export const getOptionalText = (question: any): string => {
    const currentLocale = question.survey.locale || 'en';
    return surveyLocalization.locales[currentLocale]?.["optionalText"] || " (Optional)";
};

// Get validation state and error message
export const useQuestionValidation = (question: any) => {
    const isInvalid = question.errors.length > 0;
    const errorMessage = question.errors.length > 0 
        ? (question.errors[0].getText ? question.errors[0].getText() : question.errors[0].text)
        : undefined;
    
    return { isInvalid, errorMessage };
};

// Render label with markdown support
export const renderLabel = (title: string): React.ReactNode => {
    const processedTitle = processMarkdown(title);
    return processedTitle.includes('<') ? <HtmlContent html={processedTitle} /> : processedTitle;
};

// Render description with markdown support
export const renderDescription = (description: string): React.ReactNode => {
    if (!description) return undefined;
    const processedDescription = processMarkdown(description);
    return processedDescription.includes('<') ? <HtmlContent html={processedDescription} /> : processedDescription;
};