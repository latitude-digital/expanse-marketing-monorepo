import React from "react";
import { RendererFactory, Serializer } from "survey-core";
import { ReactQuestionFactory, SurveyQuestionCheckbox } from "survey-react-ui";
import SegmentedControl from '@ui/ford-ui-components/src/v2/segmented-control/SegmentedControl';
import StyledSelectionCardSmall from '@ui/ford-ui-components/src/v2/selection-card/small/styled/StyledSelectionCardSmall';

import { trim } from "lodash";

const VEHICLE_TYPES = ["Ford SUVs", "Ford Cars", "Ford Trucks"];

export class CheckboxVOIQuestion extends SurveyQuestionCheckbox {
    constructor(props: any) {
        super(props);
        this.state = {
            selectedTabKey: 'ford-suvs'
        };

        // No custom CSS classes needed - using Ford UI SelectionCard

        (this as any).getBody = (cssClasses: any) => {
            let filteredItems = this.question.bodyItems;
            const tabs = [
                { key: 'ford-suvs', label: 'Ford SUVs' },
                { key: 'ford-cars', label: 'Ford Cars' },
                { key: 'ford-trucks', label: 'Ford Trucks' }
            ];

            // Create mapping from item ID to original JSON data
            const originalDataMap = new Map();
            
            // SOLUTION: Fetch Ford JSON data directly since SurveyJS loses originalData
            // Use the same URL as configured in the Ford VOI question
            const fordJsonUrl = this.question.choicesByUrl?.url || 'https://cdn.latitudewebservices.com/vehicles/ford.json';
            
            console.log('VOI getBody: Attempting to fetch Ford JSON directly from:', fordJsonUrl);
            
            // Check if we've already cached the Ford data to avoid repeated fetches
            if (!(this as any).fordVehiclesCache) {
                console.log('VOI getBody: No cached Ford data, fetching...');
                
                // Store a promise so multiple renders don't trigger multiple fetches
                if (!(this as any).fordDataPromise) {
                    (this as any).fordDataPromise = fetch(fordJsonUrl)
                        .then(response => response.json())
                        .then(data => {
                            console.log(`VOI getBody: Successfully fetched ${data.length} Ford vehicles`);
                            (this as any).fordVehiclesCache = data;
                            
                            // Create the mapping
                            data.forEach((vehicle: any) => {
                                originalDataMap.set(vehicle.id, vehicle);
                                originalDataMap.set(String(vehicle.id), vehicle); // Also store as string
                            });
                            
                            console.log(`VOI getBody: Created originalDataMap with ${originalDataMap.size} entries`);
                            
                            // Store the mapping for use in renderItem
                            (this as any).originalDataMap = originalDataMap;
                            
                            // Force a re-render to show the vehicles
                            this.setState({});
                            
                            return data;
                        })
                        .catch(error => {
                            console.error('VOI getBody: Failed to fetch Ford vehicles:', error);
                            return [];
                        });
                }
                
                // Return empty filtered items for now, will update after fetch completes
                console.log('VOI getBody: Waiting for Ford data to load...');
            } else {
                console.log(`VOI getBody: Using cached Ford data (${(this as any).fordVehiclesCache.length} vehicles)`);
                
                // Use cached data to create the mapping
                (this as any).fordVehiclesCache.forEach((vehicle: any) => {
                    originalDataMap.set(vehicle.id, vehicle);
                    originalDataMap.set(String(vehicle.id), vehicle);
                });
                
                console.log(`VOI getBody: Created originalDataMap with ${originalDataMap.size} entries from cache`);
                
                // Store the mapping for use in renderItem
                (this as any).originalDataMap = originalDataMap;
            }
            
            // Debug the mapping
            console.log('OriginalDataMap debug:', {
                mapSize: originalDataMap.size,
                sampleKeys: Array.from(originalDataMap.keys()).slice(0, 5),
                sampleEntry: originalDataMap.size > 0 ? {
                    key: Array.from(originalDataMap.keys())[0],
                    value: originalDataMap.get(Array.from(originalDataMap.keys())[0])
                } : null
            });

            // Debug logging
            console.log('VOI getBody called:', {
                bodyItems: this.question.bodyItems?.length || 0,
                choices: this.question.choices?.length || 0,  
                selectedTab: this.state.selectedTabKey,
                originalDataMap: originalDataMap.size
            });

            if (this.question.onlyInclude?.length) {
                const onlyInclude = this.question.onlyInclude?.split(',').map((o: string) => trim(o) ? Number(trim(o)) : null) || [];
                if (onlyInclude.length > 0) {
                    filteredItems = this.question.bodyItems.filter((item: any) => onlyInclude.includes(item.id));
                }
            }

            // Type filtering based on selected tab
            const selectedTab = tabs.find(tab => tab.key === this.state.selectedTabKey);
            const vehicleType = selectedTab?.label || 'Ford SUVs';
            
            // Apply vehicle type filtering based on selected tab
            // Get original JSON data from the choices mapping
            const beforeFilterCount = filteredItems.length;
            filteredItems = filteredItems.filter((item: any, index: number) => {
                // Look up original data using item value (ID)
                const originalData = originalDataMap.get(item.value);
                const itemType = originalData?.type;
                
                // Debug logging for first few items
                if (index < 5) {
                    console.log(`Filtering debug [${index}]:`, {
                        itemValue: item.value,
                        itemId: item.id, 
                        hasOriginalData: !!originalData,
                        itemType,
                        vehicleType,
                        matches: itemType === vehicleType,
                        originalDataKeys: originalData ? Object.keys(originalData) : 'none',
                        mapKeys: Array.from(originalDataMap.keys()).slice(0, 5)
                    });
                }
                
                if (!itemType) {
                    console.log('No type found for item:', { 
                        itemValue: item.value, 
                        itemId: item.id,
                        hasOriginalData: !!originalData,
                        originalData: originalData ? Object.keys(originalData) : 'none'
                    });
                    return false; // Hide items without type info
                }
                
                return itemType === vehicleType;
            });
            
            console.log(`Filtering: ${beforeFilterCount} → ${filteredItems.length} vehicles for "${vehicleType}"`);
            
            // Store the mapping for use in renderItem
            (this as any).originalDataMap = originalDataMap;

            console.log(`Filtered ${filteredItems.length} vehicles for ${vehicleType}`);

            return (
                <div>
                    <div className="flex justify-center">
                        <SegmentedControl 
                            tabs={tabs}
                            className="w-[360px]"
                            selectedKey={this.state.selectedTabKey}
                            onValueChange={this.setSelectedTabKey}
                            variant="forms"
                        />
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-6">
                        {this.getItems(cssClasses, filteredItems)}
                    </div>
                </div>
            )
        }

        (this as any).renderItem = (item: any, isFirst: boolean, cssClasses: any, index?: string) => {
            // Get original JSON data using the mapping created in getBody
            const originalDataMap = (this as any).originalDataMap || new Map();
            const originalData = originalDataMap.get(item.value);
            const imageFilename = originalData?.image;
            
            
            const imageURL = imageFilename ? `https://cdn.latitudewebservices.com/vehicles/images/${imageFilename}` : null;
            
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
                        console.log(`Selection limit reached: ${currentValue.length}/${maxAllowed}`);
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
                <div key={`${item.id}-${isChecked}`} className="w-36">
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
                        icon={imageURL ? (
                            <img 
                                alt={item.title} 
                                src={imageURL} 
                                className="object-contain w-full max-h-30"
                                onError={(e) => {
                                    console.log('Image failed to load:', imageURL);
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : (
                            <div className="text-gray-400 text-xs">No image</div>
                        )}
                    />
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
