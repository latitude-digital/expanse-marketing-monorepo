import React, { useState, useEffect } from "react";
import { RendererFactory, Serializer } from "survey-core";
import { ReactQuestionFactory, SurveyQuestionCheckbox } from "survey-react-ui";
import SegmentedControl from '@ui/ford-ui-components/src/v2/segmented-control/SegmentedControl';
import StyledSelectionCardSmall from '@ui/ford-ui-components/src/v2/selection-card/small/styled/StyledSelectionCardSmall';
import { FDSQuestionWrapper } from '../FDSRenderers/FDSShared/FDSQuestionWrapper';
import { useQuestionValidation } from '../FDSRenderers/FDSShared';

import { trim } from "lodash";

const VEHICLE_TYPES = ["Ford SUVs", "Ford Cars", "Ford Trucks"];

export class CheckboxVOIQuestion extends SurveyQuestionCheckbox {
    constructor(props: any) {
        super(props);
        this.state = {
            selectedTabKey: 'ford-suvs'
        };

        // No custom CSS classes needed - using Ford UI SelectionCard

        // Helper method to rebuild originalDataMap from current choices
        // Since SurveyJS strips originalData, we need to fetch it fresh when choices are updated
        (this as any).rebuildOriginalDataMap = async () => {
            const originalDataMap = new Map();
            
            // Check if choices already have originalData (shouldn't happen due to SurveyJS processing)
            const hasOriginalData = this.question.choices.some((choice: any) => choice.originalData);
            
            if (!hasOriginalData && this.question.choicesByUrl?.url) {
                try {
                    const response = await fetch(this.question.choicesByUrl.url);
                    const data = await response.json();
                    
                    // Map the fetched data to choices by matching values
                    this.question.choices.forEach((choice: any, index: number) => {
                        const originalItem = data.find((item: any) => item.id == choice.value);
                        if (originalItem) {
                            originalDataMap.set(choice.value, originalItem);
                            originalDataMap.set(String(choice.value), originalItem);
                        }
                    });
                } catch (error) {
                    console.error(`Failed to fetch vehicle data for VOI component:`, error);
                }
            } else {
                // Fallback to existing originalData if present
                this.question.choices.forEach((choice: any, index: number) => {
                    if (choice.originalData) {
                        originalDataMap.set(choice.value, choice.originalData);
                        originalDataMap.set(String(choice.value), choice.originalData);
                    }
                });
            }
            
            (this as any).originalDataMap = originalDataMap;
        };
        
        (this as any).getBody = (cssClasses: any) => {
            // Detect brand from choicesByUrl or question type name
            const isFordBrand = this.isFordBrand();
            let filteredItems = this.question.bodyItems;
            const tabs = [
                { key: 'ford-suvs', label: 'Ford SUVs' },
                { key: 'ford-cars', label: 'Ford Cars' },
                { key: 'ford-trucks', label: 'Ford Trucks' }
            ];

            // Use existing originalDataMap if it has data, otherwise create new one
            let originalDataMap = (this as any).originalDataMap;
            if (!originalDataMap || originalDataMap.size === 0) {
                originalDataMap = new Map();
            }
            
            // Set up listener for choices changes if not already set up
            if (!this.choicesUpdateHandlerSet) {
                this.choicesUpdateHandlerSet = true;
                
                // Add a listener to react when choices are updated
                this.question.onPropertyChanged.add(async (sender: any, options: any) => {
                    if (options.name === 'choices' && options.newValue && options.newValue.length > 0) {
                        // Rebuild originalDataMap from the new choices (now async)
                        await this.rebuildOriginalDataMap();
                        // Force re-render
                        this.forceUpdate();
                    }
                });
                
                // Also set up a backup timer to check for data periodically
                const checkForData = async () => {
                    const hasData = this.question.choices.some((choice: any) => choice.originalData);
                    const hasChoices = this.question.choices.length > 0;
                    
                    if (hasChoices && !hasData && this.question.choicesByUrl?.url) {
                        await this.rebuildOriginalDataMap();
                        this.forceUpdate();
                    } else if (!hasChoices) {
                        // Check again in 500ms if no choices yet
                        setTimeout(checkForData, 500);
                    }
                };
                setTimeout(checkForData, 1000); // Start checking after 1 second
            }
            
            // Only build originalDataMap from choices if we don't have existing data
            if (originalDataMap.size === 0) {
                // Use the choices that were already loaded by choicesByUrlHelper (called in onLoaded)
                // This avoids duplicate fetching and race conditions
                this.question.choices.forEach((choice: any, index: number) => {
                    if (choice.originalData) {
                        // The choicesByUrlHelper stores complete original data
                        originalDataMap.set(choice.value, choice.originalData);
                        originalDataMap.set(String(choice.value), choice.originalData);
                    }
                });
                
                // Store the mapping for use in renderItem
                (this as any).originalDataMap = originalDataMap;
            }

            if (this.question.onlyInclude?.length) {
                const onlyInclude = this.question.onlyInclude?.split(',').map((o: string) => trim(o) ? Number(trim(o)) : null) || [];
                if (onlyInclude.length > 0) {
                    filteredItems = this.question.bodyItems.filter((item: any) => onlyInclude.includes(item.id));
                }
            }

            // Apply vehicle type filtering only for Ford brand
            if (isFordBrand) {
                // Type filtering based on selected tab
                const selectedTab = tabs.find(tab => tab.key === this.state.selectedTabKey);
                const vehicleType = selectedTab?.label || 'Ford SUVs';
                
                // Apply vehicle type filtering based on selected tab
                // Get original JSON data from the choices mapping
                filteredItems = filteredItems.filter((item: any) => {
                    // Look up original data using item value (ID)
                    const originalData = originalDataMap.get(item.value);
                    const itemType = originalData?.type;
                    
                    if (!itemType) {
                        return false; // Hide items without type info
                    }
                    
                    return itemType === vehicleType;
                });
            }

            // Get validation state for FDS wrapper
            const errorMessage = this.question.errors?.length > 0 ? this.question.errors[0].text : undefined;
            const isInvalid = this.question.errors?.length > 0;

            return (
                <FDSQuestionWrapper
                    label={this.question.fullTitle || this.question.title || "I am interested in receiving more information on the following vehicles."}
                    description={this.question.description}
                    isRequired={this.question.isRequired}
                    isInvalid={isInvalid}
                    errorMessage={errorMessage}
                    question={this.question}
                >
                    {isFordBrand && (
                        <div className="flex justify-center mb-6">
                            <SegmentedControl 
                                tabs={tabs}
                                className="w-full max-w-[360px]"
                                selectedKey={this.state.selectedTabKey}
                                onValueChange={this.setSelectedTabKey}
                                variant="forms"
                            />
                        </div>
                    )}
                    <div className={`flex flex-wrap justify-center gap-4`}>
                        {this.getItems(cssClasses, filteredItems)}
                    </div>
                </FDSQuestionWrapper>
            )
        }

        (this as any).renderItem = (item: any, isFirst: boolean, cssClasses: any, index?: string) => {
            // Get original JSON data using the mapping created by rebuildOriginalDataMap
            const originalDataMap = (this as any).originalDataMap || new Map();
            const originalData = originalDataMap.get(item.value) || originalDataMap.get(String(item.value));
            const imageFilename = originalData?.image;
            const imageURL = imageFilename ? `https://cdn.latitudewebservices.com/vehicles/images/${imageFilename}` : null;
            
            // Create memoized image component that re-renders when imageURL changes
            const ImageDisplay = React.memo(({ imageURL, title }: { imageURL: string | null, title: string }) => {
                return imageURL ? (
                    <img 
                        alt={title} 
                        src={imageURL} 
                        className="object-contain w-full max-h-30"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                ) : null;
            });
            
            const inputId = `input_${this.question.name}_${item.id}`;
            const isChecked = this.question.isItemSelected(item);
            const isDisabled = !this.question.getItemEnabled(item);

            const handleOnChange = () => {
                // Get current selected values as an array
                const currentValue = this.question.value || [];
                const itemValue = item.value;
                const isCurrentlySelected = currentValue.includes(itemValue);
                const maxAllowed = this.question.maxSelectedChoices || 999;
                
                let newValue;
                
                if (isCurrentlySelected) {
                    // Remove the item from the selection
                    newValue = currentValue.filter((val: any) => val !== itemValue);
                } else {
                    // Check if we're at the max selection limit
                    if (currentValue.length >= maxAllowed) {
                        return;
                    }
                    // Add the item to the selection
                    newValue = [...currentValue, itemValue];
                }
                
                // Update the question value directly
                this.question.value = newValue;
                this.setState({});
            }

            const title = item.title.replace("-", "‑");
            const maxLineLength = 10; // Adjust this value as needed
            const words = title.split(" ");
            let lines: string[] = [];

            if (words.length < 2) {
                lines.push(title); // Single word titles
            } else {
                // Split title into lines based on maxLineLength
                let currentLine = "";

                words.forEach((word: string) => {
                    if (currentLine.length + word.length + 1 > maxLineLength) {
                        lines.push(currentLine);
                        currentLine = word;
                    } else {
                        currentLine = currentLine ? `${currentLine} ${word}` : word;
                    }
                });
                lines.push(currentLine);
            }

            const headline = { __html: lines.join("<br />") };

            // Use Ford UI StyledSelectionCardSmall with image as icon and name as caption
            return (
                <div key={item.id} className="w-36">
                    <StyledSelectionCardSmall
                        id={inputId}
                        name={this.question.name}
                        value={item.value}
                        checked={isChecked}
                        disabled={isDisabled}
                        onChange={handleOnChange}
                        variant="none"
                        contentAligned="center"
                        headline={<div dangerouslySetInnerHTML={headline} />}
                        icon={<ImageDisplay imageURL={imageURL} title={item.title} />}
                    />
                </div>
            )
        }
    }

    setSelectedTabKey = (key: string) => {
        this.setState({ selectedTabKey: key });
    }

    isFordBrand = () => {
        // Check choicesByUrl first (most reliable)
        const url = this.question.choicesByUrl?.url;
        if (url && url.includes('ford.json')) {
            return true;
        }
        if (url && url.includes('lincoln.json')) {
            return false;
        }
        
        // Fallback: Check question type name
        const questionType = this.question.getType();
        if (questionType === 'fordvoi') {
            return true;
        }
        if (questionType === 'lincolnvoi') {
            return false;
        }
        
        // Default to Ford if we can't detect
        return true;
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
