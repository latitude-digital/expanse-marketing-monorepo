import React from 'react';
import { surveyLocalization } from 'survey-core';
import { Typography } from "@ui/ford-ui-components";
import Showdown from 'showdown';

// Create Showdown converter with same config as web-app
const markdownConverter = new Showdown.Converter({
    openLinksInNewWindow: true,
});

const REQUIRED_CHECK_MAX_DEPTH = 4;

const isTruthy = (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return false;
};

export const isQuestionEffectivelyRequired = (question: any, fallback = false, depth = 0): boolean => {
    if (!question || depth > REQUIRED_CHECK_MAX_DEPTH) {
        return fallback;
    }

    // Direct flags on the question instance
    if (isTruthy(question.isRequired) || isTruthy(question.required)) {
        return true;
    }

    // SurveyJS exposes internal helpers depending on question type
    if (typeof question.isValueRequired === 'function') {
        try {
            if (question.isValueRequired()) {
                return true;
            }
        } catch (err) {
            // ignore evaluation issues
        }
    } else if (isTruthy(question.isValueRequired)) {
        return true;
    }

    // Some custom questions (like fordoptin) store requirement on their parent
    const parentCandidates = [question.parentQuestion, question.parent];
    for (const parent of parentCandidates) {
        if (parent && isQuestionEffectivelyRequired(parent, fallback, depth + 1)) {
            return true;
        }
    }

    return fallback;
};

const collectQuestionRelations = (question: any): any[] => {
    const related: any[] = [];
    if (!question) return related;
    if (question.contentQuestion) related.push(question.contentQuestion);
    if (question.parentQuestion) related.push(question.parentQuestion);
    if (question.parent && question.parent.getType) {
        related.push(question.parent);
    }
    return related;
};

export const collectQuestionErrors = (question: any, depth = 0, visited = new Set<any>()): any[] => {
    if (!question || depth > REQUIRED_CHECK_MAX_DEPTH || visited.has(question)) {
        return [];
    }

    visited.add(question);

    const errors: any[] = Array.isArray(question.errors) ? [...question.errors] : [];

    collectQuestionRelations(question).forEach((related) => {
        errors.push(...collectQuestionErrors(related, depth + 1, visited));
    });

    return errors.filter(Boolean);
};

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
    const currentLocale = question?.survey?.locale || 'en';
    return surveyLocalization.locales[currentLocale]?.["optionalText"] || " (Optional)";
};

// Get validation state and error message
export const useQuestionValidation = (question: any) => {
    const errors = collectQuestionErrors(question);
    const firstError = errors[0];
    const isInvalid = errors.length > 0;
    const errorMessage = firstError
        ? (typeof firstError.getText === 'function' ? firstError.getText() : firstError.text || firstError.message)
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

export const renderQuestionDescription = (description?: string, question?: any): React.ReactNode => {
    if (!description) return null;

    const processedDescription = processMarkdown(description);
    const hasHtml = processedDescription.includes('<');

    return (
        <Typography
            displayStyle="caption-semibold"
            displayColor="text-onlight-subtle"
            displayBox="block"
            className="mt-1"
            spanProps={{ className: "text-ford-caption-semibold" }}
        >
            {hasHtml ? <span className="fds-question-description__html" dangerouslySetInnerHTML={{ __html: processedDescription }} /> : processedDescription}
        </Typography>
    );
};
