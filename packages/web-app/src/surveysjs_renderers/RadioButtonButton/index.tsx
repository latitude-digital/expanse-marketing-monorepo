import React, {  } from "react";
import { ItemValue, RendererFactory, Serializer, SurveyModel, surveyLocalization } from "survey-core";
import { ReactQuestionFactory, SurveyQuestionRadiogroup } from "survey-react-ui";
import UnstyledSelectionCard from "@ui/ford-ui-components/src/v2/selection-card/default/UnstyledSelectionCard";
import { FieldError } from "@ui/ford-ui-components/src/components/ui/field-error";
import Icon from "@ui/ford-ui-components/src/v2/icon/Icon";
import Showdown from 'showdown';

import style from './_index.module.scss'

// Create Showdown converter with same config as FDSText
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

// Helper component for HTML content
const HtmlContent = ({ html }: { html: string }) => (
    <span dangerouslySetInnerHTML={{ __html: html }} />
);

export class RadioGroupRowQuestion extends SurveyQuestionRadiogroup {

    constructor(props: any) {
        super(props);

        const customCSS = props.creator.survey.cssValue.radiobuttongroup;

        (this as any).renderItem = (
            item: ItemValue,
            value: any,
            cssClasses: any,
            index?: string
        ) => {
            const inputId = `input_${this.question.name}_${item.id}`;
            const optionType = this.question.getType() === "radiogroup" ? "radio" : "checkbox";
            const isChecked = this.question.isItemSelected(item);
            const isDisabled = !this.question.getItemEnabled(item);

            const handleOnChange = (event: any) => {
                this.question.clickItemHandler(item);
            }

            return (
                <UnstyledSelectionCard
                    key={item.id}
                    id={inputId}
                    name={this.question.name}
                    value={item.value}
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={handleOnChange}
                    headline=""
                    description={item.title}
                    tags={[]}
                    variant="none"
                    customClassnames={{
                        root: 'rounded-ford-radius-xl overflow-hidden border-2 border-transparent [&:has(.peer:checked)]:border-ford-fill-interactive hover:[&:has(.peer:not(:checked))]:border-ford-stroke-interactive-hover focus-within:outline-none focus-within:ring-2 focus-within:ring-ford-stroke-strongest(focus) bg-ford-fill-highcontrast(default)',
                        label: 'group flex w-full justify-between items-center py-ford-space-xl px-ford-space-lg cursor-pointer rounded-ford-radius-xl overflow-hidden border border-ford-stroke-subtle(dividers) [&:has(.peer:checked)]:border-transparent hover:bg-ford-opacity-hover-default',
                        input: 'peer opacity-0 absolute top-0 left-0 h-ford-space-xl w-ford-space-xl',
                        header: {
                            container: 'flex flex-col items-center w-full',
                            description: 'text-center'
                        }
                    }}
                />
            )
        }
    }

    renderElement(): JSX.Element {
        const question = this.question;
        
        // Get the question title and handle required/optional indication
        const title = question.fullTitle;
        const isRequired = question.isRequired;
        
        // Get error message if validation failed
        const errorMessage = question.errors.length > 0 
            ? (question.errors[0].getText ? question.errors[0].getText() : question.errors[0].text)
            : undefined;
        
        // Get localized optional text for Ford UI component based on current survey locale
        const currentLocale = question.survey.locale || 'en';
        const optionalText = surveyLocalization.locales[currentLocale]?.["optionalText"] || " (Optional)";
        
        // Process markdown for title and description
        const processedTitle = processMarkdown(title);
        const processedDescription = processMarkdown(question.description);
        
        
        return (
            <div className="fds-radio-group-container">
                {/* Question title - styled to match FDSText/StyledTextField */}
                {title && (
                    <div className="fds-radio-group-title" style={{ 
                        marginBottom: '0.5rem',
                        color: 'var(--semantic-color-text-onlight-moderate-default)',
                        fontSize: '16px',
                        fontWeight: '400',
                        lineHeight: '1.5',
                        fontFamily: 'var(--font-family-primary, "Averta", "Arial", sans-serif)'
                    }}>
                        {processedTitle.includes('<') ? <HtmlContent html={processedTitle} /> : processedTitle}
                        {!isRequired && (
                            <span style={{ 
                                color: 'var(--semantic-color-text-onlight-subtle-default)',
                                fontSize: '14px',
                                fontWeight: '400'
                            }}>
                                {optionalText}
                            </span>
                        )}
                    </div>
                )}
                
                {/* Description - positioned under title, above error and radio buttons */}
                {processedDescription && (
                    <div className="text-ford-caption-semibold text-text-onlight-subtle mb-2" style={{ 
                        fontFamily: 'var(--font-family-primary, "Averta", "Arial", sans-serif)'
                    }}>
                        {processedDescription.includes('<') ? <HtmlContent html={processedDescription} /> : processedDescription}
                    </div>
                )}
                
                {/* Error message - using Ford UI styling pattern */}
                {errorMessage && (
                    <div className="flex shrink-0 pt-1 text-sm font-medium text-text-onlight-danger items-center gap-1" style={{ marginBottom: '0.5rem' }}>
                        <Icon height={16} name="errorCircle" width={16} />
                        {errorMessage}
                    </div>
                )}
                
                {/* Radio button group - wrapped with relative positioning */}
                <div className="relative">
                    <div className={style.radio_group_row}>
                        {this.getItems({}, this.question.bodyItems)}
                    </div>
                </div>
            </div>
        );
    }

    getBody(cssClasses: any) {
        // This method is overridden by renderElement
        return this.renderElement();
    }

}

const clearButtonItem = Serializer.getProperty("radiogroup", "showClearButton");
const otherItem = Serializer.getProperty("radiogroup", "showOtherItem");
const noneItem = Serializer.getProperty("radiogroup", "showNoneItem");
const separateItems = Serializer.getProperty("radiogroup", "separateSpecialChoices");

const hideIfGroup = (obj: any) => {
    return obj.renderAs !== "radiobuttongroup";
}

const showIfGroup = (obj: any) => {
    return obj.renderAs !== "radiobuttongroup";
}

clearButtonItem.visibleIf = hideIfGroup;
otherItem.visibleIf = hideIfGroup;
noneItem.visibleIf = hideIfGroup;
separateItems.visibleIf = hideIfGroup;

Serializer.addProperty("radiogroup", {
    name: "buttonSize",
    displayName: "Button Size",
    category: "layout",
    visibleIndex: -1,
    visibleIf: showIfGroup,
    choices: [
        { value: "small", title: "Small" },
        { value: "medium", title: "Medium" },
        { value: "large", title: "Large" },
    ],
    default: "medium",
});

ReactQuestionFactory.Instance.registerQuestion(
    "sv-radio-button-group",
    (props) => {
        return React.createElement(RadioGroupRowQuestion, props);
    }
);

RendererFactory.Instance.registerRenderer(
    "radiogroup",
    "radiobuttongroup",
    "sv-radio-button-group"
);
