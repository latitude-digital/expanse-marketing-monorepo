import React from "react";
import { RendererFactory, Serializer } from "survey-core";
import { ReactQuestionFactory, SurveyQuestionCheckbox } from "survey-react-ui";
import SegmentedControl from '@ui/ford-ui-components/src/v2/segmented-control/SegmentedControl';

import style from './_index.module.scss'
import { trim } from "lodash";

const VEHICLE_TYPES = ["Ford SUVs", "Ford Cars", "Ford Trucks"];

export class CheckboxVOIQuestion extends SurveyQuestionCheckbox {
    constructor(props: any) {
        super(props);
        this.state = {
            selectedTabKey: 'ford-suvs'
        };

        const customCSS = props.creator.survey.cssValue.checkboxvoi;

        // Use SurveyJS CSS classes with fallback to our custom classes
        const defaultClasses = customCSS || {
            container: style.radio_group_voi,
            root: style.voi_option,
            rootActive: style.voi_option_active,
            rootDisabled: style.voi_option_disabled,
            image: style.vehicle_img
        };

        (this as any).getBody = (cssClasses: any) => {
            let filteredItems = this.question.bodyItems;
            const tabs = [
                { key: 'ford-suvs', label: 'Ford SUVs' },
                { key: 'ford-cars', label: 'Ford Cars' },
                { key: 'ford-trucks', label: 'Ford Trucks' }
            ];

            if (this.question.onlyInclude?.length) {
                const onlyInclude = this.question.onlyInclude?.split(',').map((o: string) => trim(o) ? Number(trim(o)) : null) || [];
                if (onlyInclude.length > 0) {
                    filteredItems = this.question.bodyItems.filter((item: any) => onlyInclude.includes(item.id));
                }
            }

            // Type filtering based on selected tab
            const selectedTab = tabs.find(tab => tab.key === this.state.selectedTabKey);
            const vehicleType = selectedTab?.label || 'Ford SUVs';
            
            filteredItems = filteredItems.filter((item: any) => {
                return item.jsonObj.type?.toLowerCase() === vehicleType.toLowerCase() ||
                    item.jsonObj.type?.toLowerCase() === vehicleType.replace('Ford ', '').toLowerCase();
            });

            return (
                <div>
                    <div className="flex justify-center">
                        <SegmentedControl 
                            tabs={tabs}
                            className="w-[400px]"
                            selectedKey={this.state.selectedTabKey}
                            onValueChange={this.setSelectedTabKey}
                            variant="forms"
                        />
                    </div>
                    <div className={defaultClasses.container}>
                        {this.getItems(cssClasses, filteredItems)}
                    </div>
                </div>
            )
        }

        (this as any).renderItem = (item: any, isFirst: boolean, cssClasses: any, index?: string) => {
            const imageURL = `https://cdn.latitudewebservices.com/vehicles/images/${item.image}`;
            const inputId = `input_${this.question.name}_${item.id}`;
            const isChecked = this.question.isItemSelected(item);
            const isDisabled = !this.question.getItemEnabled(item);

            const handleOnChange = (event: any) => {
                this.question.clickItemHandler(item, event.target.checked);
                this.setState({});
            }

            let itemClasses = [defaultClasses.root];

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
                        const checkbox = document.getElementById(`checkbox_${inputId}`);
                        if (checkbox && e.target !== checkbox) {
                            checkbox.click();
                        }
                    }}
                    key={`${item.id}-${isChecked}`}
                    id={inputId}
                >
                    <img alt={item.title} src={imageURL} className={defaultClasses.image} />
                    <label htmlFor={inputId}>
                        {item.title.replace("-", "‑")}
                        <input
                            role="option"
                            id={`checkbox_${inputId}`}
                            disabled={isDisabled}
                            name={this.question.name + item.id}
                            type="checkbox"
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

    setSelectedTabKey = (key: string) => {
        this.setState({ selectedTabKey: key });
    }
}

// Restore the image property
Serializer.addProperty("itemvalue", {
    name: "image",
    displayName: "Image",
    type: "file",
    visibleIf: (obj) => {
        return obj.locOwner.renderAs === "voi";
    }
});

// Add the category property
Serializer.addProperty("itemvalue", {
    name: "category",
    category: "general",
    visibleIf: (obj) => {
        return obj.locOwner.renderAs === "voi";
    }
});

Serializer.addProperty("itemvalue", {
    name: "type",
    displayName: "type",
    type: "string",
    visibleIf: (obj) => {
        return obj.locOwner.renderAs === "voi";
    }
});

ReactQuestionFactory.Instance.registerQuestion(
    "sv-checkbox-voi",
    (props) => {
        return React.createElement(CheckboxVOIQuestion, props);
    }
);

RendererFactory.Instance.registerRenderer(
    "checkbox",
    "voi",
    "sv-checkbox-voi"
);
