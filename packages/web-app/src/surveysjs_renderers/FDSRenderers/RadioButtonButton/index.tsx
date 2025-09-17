// @ts-nocheck
import React from "react";
import { ItemValue, RendererFactory, Serializer } from "survey-core";
import { ReactQuestionFactory, SurveyQuestionRadiogroup } from "survey-react-ui";
import UnstyledSelectionCard from "@ui/ford-ui-components/v2/selection-card/default/UnstyledSelectionCard";
import { FDSQuestionWrapper } from '../FDSShared/FDSQuestionWrapper';

import style from './_index.module.scss'

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
        
        // Get validation state for FDS wrapper
        const errorMessage = question.errors.length > 0 
            ? (question.errors[0].getText ? question.errors[0].getText() : question.errors[0].text)
            : undefined;
        const isInvalid = question.errors.length > 0;
        
        
        return (
            <FDSQuestionWrapper
                label={question.fullTitle || question.title}
                description={question.description}
                isRequired={question.isRequired}
                isInvalid={isInvalid}
                errorMessage={errorMessage}
                question={question}
            >
                {/* Radio button group - wrapped with relative positioning */}
                <div className="relative">
                    <div className={style.radio_group_row}>
                        {this.getItems({}, this.question.bodyItems)}
                    </div>
                </div>
            </FDSQuestionWrapper>
        );
    }

    getBody(cssClasses: any) {
        // This method is overridden by renderElement
        return this.renderElement();
    }

    // Override to prevent double title rendering
    renderTitle() {
        return null;
    }

    // Override to prevent double description rendering
    renderDescription() {
        return null;
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
