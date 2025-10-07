// @ts-nocheck
import React from "react";
import { ElementFactory, LocalizableString, QuestionTextModel, Serializer, surveyLocalization, defaultCss } from "survey-core";
import { ReactQuestionFactory, SurveyQuestionElementBase, SurveyQuestionText } from "survey-react-ui";
import { StyledTextField } from "@ui/ford-ui-components";
import { vsprintf } from 'sprintf-js';
import { normalizeBrand } from '../../utils/brandUtils';
import { renderDescription } from '../FDSRenderers/FDSShared/utils';

const CUSTOM_QUESTION_TYPE = "emailtextinput";

// Ensure custom question type inherits SurveyJS text styling (SurveyJS 2.x version of defaultV2Css pattern)
if (defaultCss && (defaultCss as any)[CUSTOM_QUESTION_TYPE] === undefined) {
    (defaultCss as any)[CUSTOM_QUESTION_TYPE] = (defaultCss as any)["text"];
}

// A model that extends the Question class and inherits all its properties and methods
export class QuestionEmailTextModel extends QuestionTextModel {
    constructor(name: any) {
        super(name);

        // Create a `LocalizableString` object for the `didYouMeanQuestion` property
        this.createLocalizableString("didYouMeanQuestion", this, false, "didYouMeanQuestion");
    }
    getType() {
        return CUSTOM_QUESTION_TYPE;
    }
    // Returns didYouMeanQuestion text that corresponds to the current locale
    get didYouMeanQuestion(): string {
        return this.getLocalizableStringText("didYouMeanQuestion");
    }
    // Sets didYouMeanQuestion text for the current locale
    set didYouMeanQuestion(val: string) {
        this.setLocalizableStringText("didYouMeanQuestion", val);
    }
    // Returns a `LocalizationString` object for the `didYouMeanQuestion` property
    get locDidYouMeanQuestion(): LocalizableString {
        return this.getLocalizableString("didYouMeanQuestion");
    }
    // Returns didYouMean text that corresponds to the current locale
    get didYouMean(): string {
        return this.getPropertyValue("didYouMean");
    }
    // Sets didYouMean text for the current locale
    set didYouMean(val: string) {
        this.setPropertyValue("didYouMean", val);
    }
}

// Register `QuestionEmailTextModel` as a constructor for the "emailtextinput" question type
ElementFactory.Instance.registerElement(CUSTOM_QUESTION_TYPE, (name: any) => {
    return new QuestionEmailTextModel(name);
});

// Configure JSON serialization and deserialization rules for the custom properties
Serializer.addClass(
    CUSTOM_QUESTION_TYPE,
    [
        {
            name: "didYouMeanQuestion:text",
            category: "general",
            serializationProperty: "locDidYouMeanQuestion",
            visible: false,
        },
        {
            name: "didYouMean:text",
            category: "validation",
            visible: false,
        },
        // Explicitly ensure description property is inherited and serialized
        {
            name: "description:text",
            category: "general",
            visible: true,
        },
    ],
    function () {
        return new QuestionEmailTextModel("");
    },
    "question"
);

// Brand-aware email input that extends different base classes based on brand
class EmailTextInputFordUI extends SurveyQuestionElementBase {
    constructor(props: any) {
        super(props);
        this.question.locDidYouMeanQuestion.setLocaleText('en', 'Did you mean %s?');
        this.question.locDidYouMeanQuestion.setLocaleText('es', '¿Quisiste decir %s?');
        this.question.locDidYouMeanQuestion.setLocaleText('fr', 'Vouliez-vous dire %s?');
    }

    protected get question(): QuestionEmailTextModel {
        return this.questionBase as QuestionEmailTextModel;
    }

    protected canRender(): boolean {
        return super.canRender();
    }

    protected renderElement(): JSX.Element {
        const question = this.question;
        const title = question.fullTitle;
        const isRequired = question.isRequired;
        const errorMessage = question.errors.length > 0 
            ? (question.errors[0].getText ? question.errors[0].getText() : question.errors[0].text)
            : undefined;
        const isInvalid = question.errors.length > 0;
        const currentLocale = (question.survey as any).locale || 'en';
        const optionalText = surveyLocalization.locales[currentLocale]?.["optionalText"] || " (Optional)";
        
        
        return (
            <>
                <StyledTextField
                    label={title}
                    description={renderDescription(question.description)}
                    isRequired={isRequired}
                    requiredMessage={!isRequired ? optionalText : undefined}
                    placeholder={question.placeholder || ""}
                    value={question.value || ""}
                    isInvalid={isInvalid}
                    errorMessage={errorMessage}
                    type="email"
                    isDisabled={question.isReadOnly}
                    onChange={(value: string) => {
                        question.value = value;
                    }}
                    onBlur={() => {
                        question.validate();
                    }}
                    data-testid={`email-text-${question.name}`}
                />
                {question.didYouMean && this.renderDidYouMean()}
            </>
        );
    }

    renderDidYouMean = () => {
        const questionString = vsprintf((this.question.locDidYouMeanQuestion as LocalizableString).getLocaleText(this.question.getLocale() || 'en'), [this.question.didYouMean]);
        return (
            <div className="sd-action-bar" style={{ paddingTop: '0.5em', order: 3 }}>
                <div className="sv-action" onClick={() => {
                    this.question.value = this.question.didYouMean;
                    this.question.validate();
                }}>
                    <div className="sv-action__content">
                        <label className="sd-action" style={{ backgroundColor: 'var(--sjs-special-yellow-light)' }} aria-label={this.question.didYouMean}>
                            <span>{questionString}</span>
                        </label>
                    </div>
                </div>
            </div>
        );
    }
}

class EmailTextInputDefault extends SurveyQuestionText {
    constructor(props: any) {
        super(props);
        this.question.locDidYouMeanQuestion.setLocaleText('en', 'Did you mean %s?');
        this.question.locDidYouMeanQuestion.setLocaleText('es', '¿Quisiste decir %s?');
        this.question.locDidYouMeanQuestion.setLocaleText('fr', 'Vouliez-vous dire %s?');

        // Override renderInput to add didYouMean functionality to default SurveyJS text input
        (this as any).renderInput = () => {
            return (
                <>
                    {super.renderInput()}
                    {this.question.didYouMean && this.renderDidYouMean()}
                </>
            );
        };
    }

    protected get question(): QuestionEmailTextModel {
        return this.questionBase as QuestionEmailTextModel;
    }

    renderDidYouMean = () => {
        const questionString = vsprintf((this.question.locDidYouMeanQuestion as LocalizableString).getLocaleText(this.question.getLocale() || 'en'), [this.question.didYouMean]);
        return (
            <div className="sd-action-bar" style={{ paddingTop: '0.5em', order: 3 }}>
                <div className="sv-action" onClick={() => {
                    this.question.value = this.question.didYouMean;
                    this.question.validate();
                }}>
                    <div className="sv-action__content">
                        <label className="sd-action" style={{ backgroundColor: 'var(--sjs-special-yellow-light)' }} aria-label={this.question.didYouMean}>
                            <span>{questionString}</span>
                        </label>
                    </div>
                </div>
            </div>
        );
    }
}

// Factory function that chooses the right renderer based on brand
export const EmailTextInput = (props: any) => {
    // Use React state and effects for more reliable brand detection
    const [shouldUseFordUI, setShouldUseFordUI] = React.useState(false);
    
    React.useEffect(() => {
        const detectBrand = () => {
            const wrapperElement = document.getElementById('fd-nxt');
            let useFordUI = false;
            
            if (wrapperElement) {
                // Check for Ford/Lincoln theme classes
                if (wrapperElement.classList.contains('ford_light') || 
                    wrapperElement.classList.contains('ford_dark') ||
                    wrapperElement.classList.contains('lincoln_light') || 
                    wrapperElement.classList.contains('lincoln_dark')) {
                    useFordUI = true;
                }
            }
            
            console.log(`[EmailTextInput Factory] Using Ford UI: ${useFordUI}`);
            setShouldUseFordUI(useFordUI);
        };
        
        // Initial detection
        detectBrand();
        
        // Also detect after a short delay to handle timing issues
        const timer = setTimeout(detectBrand, 100);
        
        // Set up a MutationObserver to watch for class changes on the wrapper
        const wrapperElement = document.getElementById('fd-nxt');
        let observer: MutationObserver | null = null;
        
        if (wrapperElement) {
            observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        detectBrand();
                    }
                });
            });
            
            observer.observe(wrapperElement, {
                attributes: true,
                attributeFilter: ['class']
            });
        }
        
        return () => {
            clearTimeout(timer);
            if (observer) {
                observer.disconnect();
            }
        };
    }, []);
    
    if (shouldUseFordUI) {
        return React.createElement(EmailTextInputFordUI, props);
    } else {
        return React.createElement(EmailTextInputDefault, props);
    }
};

ReactQuestionFactory.Instance.registerQuestion(
    CUSTOM_QUESTION_TYPE,
    (props) => {
        return React.createElement(EmailTextInput, props);
    }
);
// @ts-nocheck
