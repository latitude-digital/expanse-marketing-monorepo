import React, {  } from "react";
import { ItemValue, RendererFactory, Serializer, SurveyModel } from "survey-core";
import { ReactQuestionFactory, SurveyQuestionRadiogroup } from "survey-react-ui";
import StyledSelectionCard from "@ui/ford-ui-components/src/v2/selection-card/default/StyledSelectionCard";

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
                <StyledSelectionCard
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
                    className="ford-component-selection-card"
                />
            )
        }
    }

    getBody(cssClasses: any) {
        // Use a simple flex layout for Ford UI Selection Cards
        return (
            <div className={style.radio_group_row}>
                {this.getItems(cssClasses, this.question.bodyItems)}
            </div>
        )
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
