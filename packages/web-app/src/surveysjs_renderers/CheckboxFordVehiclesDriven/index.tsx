import React from "react";
import { RendererFactory, Serializer } from "survey-core";
import { ReactQuestionFactory, SurveyQuestionCheckbox } from "survey-react-ui";
import SegmentedControl from '@ui/ford-ui-components/src/v2/segmented-control/SegmentedControl';
import StyledSelectionCardSmall from '@ui/ford-ui-components/src/v2/selection-card/small/styled/StyledSelectionCardSmall';
import { Chip } from '@ui/ford-ui-components/src/v2/chip';
import { FDSQuestionWrapper } from '../FDSRenderers/FDSShared/FDSQuestionWrapper';

const VEHICLE_TYPES = ["Ford SUVs", "Ford Cars", "Ford Trucks"];

export class CheckboxFordVehiclesDrivenQuestion extends SurveyQuestionCheckbox {
    constructor(props: any) {
        super(props);
        this.state = {
            selectedTabKey: 'ford-suvs'
        };

        (this as any).getBody = (cssClasses: any) => {
            let filteredItems = this.question.bodyItems;
            const tabs = [
                { key: 'ford-suvs', label: 'Ford SUVs' },
                { key: 'ford-cars', label: 'Ford Cars' },
                { key: 'ford-trucks', label: 'Ford Trucks' }
            ];

            // Create mapping from item ID to original JSON data
            const originalDataMap = new Map();
            
            // Fetch vehicle JSON data directly since SurveyJS loses originalData
            const vehicleJsonUrl = this.question.choicesByUrl?.url || 'https://cdn.latitudewebservices.com/vehicles/ford.json';
            
            // Check if we've already cached the vehicle data to avoid repeated fetches
            if (!(this as any).vehiclesCache) {
                // Store a promise so multiple renders don't trigger multiple fetches
                if (!(this as any).vehicleDataPromise) {
                    (this as any).vehicleDataPromise = fetch(vehicleJsonUrl)
                        .then(response => response.json())
                        .then(data => {
                            (this as any).vehiclesCache = data;
                            
                            // Create the mapping
                            data.forEach((vehicle: any) => {
                                originalDataMap.set(vehicle.id, vehicle);
                                originalDataMap.set(String(vehicle.id), vehicle); // Also store as string
                            });
                            
                            // Store the mapping for use in renderItem
                            (this as any).originalDataMap = originalDataMap;
                            
                            // Force a re-render to show the vehicles with filtering applied
                            this.setState({});
                            
                            return data;
                        })
                        .catch(error => {
                            console.error('FordVehiclesDriven getBody: Failed to fetch vehicles:', error);
                            return [];
                        });
                }
                // Return early if data is still loading - don't apply filtering yet
                return (
                    <FDSQuestionWrapper
                        label={this.question.fullTitle || this.question.title || "Please select the Ford vehicles that you experienced today."}
                        description={this.question.description}
                        isRequired={this.question.isRequired}
                        isInvalid={false}
                        errorMessage={undefined}
                        question={this.question}
                    >
                        <div className="flex justify-center">Loading vehicles...</div>
                    </FDSQuestionWrapper>
                );
            } else {
                // Use cached data to create the mapping
                (this as any).vehiclesCache.forEach((vehicle: any) => {
                    originalDataMap.set(vehicle.id, vehicle);
                    originalDataMap.set(String(vehicle.id), vehicle);
                });
                
                // Store the mapping for use in renderItem
                (this as any).originalDataMap = originalDataMap;
            }

            // Filter out vehicles where notForTD is true (only show test-driveable vehicles)
            filteredItems = filteredItems.filter((item: any) => {
                const originalData = originalDataMap.get(item.value);
                // Include vehicle if notForTD is false or undefined (available for test drive)
                const isTestDriveable = !originalData?.notForTD;
                console.log(`FordVehiclesDriven Filter: ${item.text} (${item.value}) - notForTD: ${originalData?.notForTD}, showing: ${isTestDriveable}`);
                return isTestDriveable;
            });

            // Apply onlyInclude filtering if specified
            if (this.question.onlyInclude?.length) {
                const onlyInclude = this.question.onlyInclude?.split(',').map((o: string) => o.trim() ? Number(o.trim()) : null) || [];
                if (onlyInclude.length > 0) {
                    filteredItems = filteredItems.filter((item: any) => onlyInclude.includes(item.id));
                }
            }

            // Count test-driveable vehicles to determine if we should show category tabs
            const testDriveableCount = filteredItems.length;
            const shouldShowTabs = testDriveableCount >= 7;

            // Apply vehicle type filtering only if we're showing tabs
            if (shouldShowTabs) {
                // Type filtering based on selected tab
                const selectedTab = tabs.find(tab => tab.key === this.state.selectedTabKey);
                const vehicleType = selectedTab?.label || 'Ford SUVs';
                
                // Apply vehicle type filtering based on selected tab
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
            
            // Store the mapping for use in renderItem
            (this as any).originalDataMap = originalDataMap;

            // Get validation state for FDS wrapper
            const errorMessage = this.question.errors?.length > 0 ? this.question.errors[0].text : undefined;
            const isInvalid = this.question.errors?.length > 0;

            // Get selected vehicles for chips display
            const selectedValues = this.question.value || [];
            const selectedVehicles = selectedValues.map((value: any) => {
                const item = this.question.bodyItems.find((item: any) => item.value === value);
                const originalData = originalDataMap.get(value);
                return {
                    value,
                    name: item?.text || originalData?.name || `Vehicle ${value}`,
                    originalData
                };
            });

            return (
                <FDSQuestionWrapper
                    label={this.question.fullTitle || this.question.title || "Please select the Ford vehicles that you experienced today."}
                    description={this.question.description}
                    isRequired={this.question.isRequired}
                    isInvalid={isInvalid}
                    errorMessage={errorMessage}
                    question={this.question}
                >
                    {shouldShowTabs && (
                        <div className="flex justify-center mb-6">
                            <SegmentedControl 
                                tabs={tabs}
                                className="w-[360px]"
                                selectedKey={this.state.selectedTabKey}
                                onValueChange={this.setSelectedTabKey}
                                variant="forms"
                            />
                        </div>
                    )}
                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                        {this.getItems(cssClasses, filteredItems)}
                    </div>
                    
                    {selectedVehicles.length > 0 && (
                        <div className="mt-6">
                            <div className="text-ford-body2-regular text-[var(--semantic-color-text-onlight-moderate-default)] mb-3">
                                Selected Vehicles (in order):
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedVehicles.map((vehicle, index) => (
                                    <Chip
                                        key={`${vehicle.value}-${index}`}
                                        label={vehicle.name}
                                        size="large"
                                        variant="default"
                                        type="removable"
                                        className="!block" // Override hidden class
                                        onDelete={() => this.removeVehicle(vehicle.value)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </FDSQuestionWrapper>
            );
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
                
                let newValue;
                
                if (isCurrentlySelected) {
                    // Remove the item from the selection (preserving order)
                    newValue = currentValue.filter((val: any) => val !== itemValue);
                } else {
                    // Add the item to the end of the selection (selection order)
                    newValue = [...currentValue, itemValue];
                }
                
                // Update the question value directly
                this.question.value = newValue;
                this.setState({});
            }

            const title = item.title.replace("-", "‑");
            const maxLineLength = 10;
            const words = title.split(" ");
            let lines: string[] = [];

            if (words.length < 2) {
                lines.push(title);
            } else {
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
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : (
                            <div className="text-gray-400 text-xs">No image</div>
                        )}
                    />
                </div>
            );
        }
    }

    setSelectedTabKey = (key: string) => {
        this.setState({ selectedTabKey: key });
    }

    removeVehicle = (vehicleValue: any) => {
        const currentValue = this.question.value || [];
        const newValue = currentValue.filter((val: any) => val !== vehicleValue);
        this.question.value = newValue;
        this.setState({});
    }
}

// Register the custom renderer
console.log('CheckboxFordVehiclesDriven: Registering sv-checkbox-fordvehiclesdriven renderer...');
ReactQuestionFactory.Instance.registerQuestion(
    "sv-checkbox-fordvehiclesdriven",
    (props) => {
        console.log('CheckboxFordVehiclesDriven: Creating CheckboxFordVehiclesDrivenQuestion component', props);
        return React.createElement(CheckboxFordVehiclesDrivenQuestion, props);
    }
);

console.log('CheckboxFordVehiclesDriven: Registering renderer for renderAs="fordvehiclesdriven"...');
RendererFactory.Instance.registerRenderer(
    "checkbox",
    "fordvehiclesdriven",
    "sv-checkbox-fordvehiclesdriven"
);