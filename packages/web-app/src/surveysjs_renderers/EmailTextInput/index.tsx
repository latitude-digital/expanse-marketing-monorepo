import React from "react";
import { ElementFactory, LocalizableString, QuestionTextModel, Serializer, surveyLocalization } from "survey-core";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { StyledTextField } from "@ui/ford-ui-components/src/v2/inputField/Input";
import { vsprintf } from 'sprintf-js';

const CUSTOM_QUESTION_TYPE = "emailtextinput";

// CSS classes will be handled by SurveyJS v2.x automatically

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
    ],
    function () {
        return new QuestionEmailTextModel("");
    },
    "question"
);

export class EmailTextInput extends SurveyQuestionElementBase {
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
        
        // Get the question title and handle required/optional indication
        const title = question.fullTitle;
        const isRequired = question.isRequired;
        
        // Get error message if validation failed
        const errorMessage = question.errors.length > 0 
            ? (question.errors[0].getText ? question.errors[0].getText() : question.errors[0].text)
            : undefined;
        const isInvalid = question.errors.length > 0;
        
        // Get localized optional text for Ford UI component based on current survey locale
        const currentLocale = question.survey.locale || 'en';
        const optionalText = surveyLocalization.locales[currentLocale]?.["optionalText"] || " (Optional)";
        
        return (
            <>
                <StyledTextField
                    label={title}
                    description={question.description}
                    isRequired={isRequired}
                    requiredMessage={optionalText}
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
                        // Trigger validation on blur
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
            <>
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


            </>
        )
    }
}

ReactQuestionFactory.Instance.registerQuestion(
    CUSTOM_QUESTION_TYPE,
    (props) => {
        return React.createElement(EmailTextInput, props);
    }
);