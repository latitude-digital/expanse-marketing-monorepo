import React from "react";
import { defaultV2Css, ElementFactory, LocalizableString, QuestionTextModel, Serializer } from "survey-core";
import { ReactQuestionFactory, SurveyQuestionText } from "survey-react-ui";
import { vsprintf } from 'sprintf-js';

const CUSTOM_QUESTION_TYPE = "emailtextinput";

(defaultV2Css as any)[CUSTOM_QUESTION_TYPE] = defaultV2Css["text"];

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

export class EmailTextInput extends SurveyQuestionText {
    constructor(props: any) {
        super(props);

        this.question.locDidYouMeanQuestion.setLocaleText('en', 'Did you mean %s?');
        this.question.locDidYouMeanQuestion.setLocaleText('es', '¿Quisiste decir %s?');
        this.question.locDidYouMeanQuestion.setLocaleText('fr', 'Vouliez-vous dire %s?');

        (this as any).renderInput = () => {
            return (
                <>
                    {super.renderInput()}
                    {this.question.didYouMean && this.renderDidYouMean()}
                </>
            )
        }
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