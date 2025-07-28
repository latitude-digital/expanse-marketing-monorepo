import React, {  } from "react";
import { ItemValue, RendererFactory, Serializer, SurveyModel } from "survey-core";
import { ReactQuestionFactory, SurveyQuestionRadiogroup } from "survey-react-ui";

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

            // Use SurveyJS CSS classes with fallback to our custom classes
            const defaultClasses = customCSS || {
                container: style.radio_group_row,
                root: style.radio_box,
                rootSmall: style.radio_box_small,
                rootLarge: style.radio_box_large,
                rootActive: style.radio_box_active,
                rootDisabled: style.radio_box_disabled
            };

            let itemClasses = [defaultClasses.root];

            if (this.question.buttonSize === "small") {
                itemClasses = [defaultClasses.rootSmall];
            } else if (this.question.buttonSize === "large") {
                itemClasses = [defaultClasses.rootLarge];
            }

            if (isChecked) {
                itemClasses.push(defaultClasses.rootActive);
            }

            if (isDisabled) {
                itemClasses.push(defaultClasses.rootDisabled);
            }

            return (
                <div
                    role="presentation"
                    className={itemClasses.join(" ")}
                    onClick={(e) => {
                        if (isDisabled) return;
                        const radio = document.getElementById(this.question.getItemId(item));
                        if (radio && e.target !== radio) {
                            radio.click();
                        }
                    }}
                    key={item.id}
                    id={inputId}
                >
                    <label htmlFor={inputId}>
                        {item.title}
                        <input
                            role="option"
                            id={this.question.getItemId(item)}
                            disabled={isDisabled}
                            name={this.question.name + item.id}
                            type={optionType}
                            value={item.value}
                            checked={isChecked}
                            onChange={handleOnChange}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </label>
                </div>
            )
        }
    }

    getBody(cssClasses: any) {
        const defaultClasses = {
            container: cssClasses?.radiobuttongroupcontainer || style.radio_group_row
        };

        return (
            <div className={defaultClasses.container}>
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
