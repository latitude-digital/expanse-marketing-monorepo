// @ts-nocheck
import React from "react";
import { RendererFactory, Serializer } from "survey-core";
import { ReactQuestionFactory, SurveyQuestionCheckbox } from "survey-react-ui";
import StyledSelectionCardSmall from '@ui/ford-ui-components/v2/selection-card/small/styled/StyledSelectionCardSmall';
import { Chip } from '@ui/ford-ui-components/v2/chip/chip';
import { FDSQuestionWrapper } from '../FDSShared/FDSQuestionWrapper';
import { collectQuestionErrors, isQuestionEffectivelyRequired } from '../FDSShared/utils';

export class CheckboxVehiclesDrivenQuestion extends SurveyQuestionCheckbox {
    constructor(props: any) {
        super(props);

        (this as any).getBody = (cssClasses: any) => {
            let filteredItems = this.question.bodyItems;
            
            // Create mapping from item ID to original JSON data
            const originalDataMap = new Map();
            
            // Fetch vehicle JSON data directly since SurveyJS loses originalData
            const vehicleJsonUrl = this.question.choicesByUrl?.url || 'https://cdn.latitudewebservices.com/vehicles/lincoln.json';
            
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
                            console.error('VehiclesDriven getBody: Failed to fetch vehicles:', error);
                            return [];
                        });
                }
                // Return early if data is still loading - don't apply filtering yet
                
                const wrapperRequired = isQuestionEffectivelyRequired(this.question) || isQuestionEffectivelyRequired(this.question.contentQuestion);
                return (
                    <FDSQuestionWrapper
                        label={this.question.fullTitle || this.question.title || "Please select the Lincoln vehicles that you experienced today."}
                        description={this.question.description}
                        isRequired={wrapperRequired}
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
                console.log(`VehiclesDriven Filter: ${item.text} (${item.value}) - notForTD: ${originalData?.notForTD}, showing: ${isTestDriveable}`);
                return isTestDriveable;
            });

            // Apply onlyInclude filtering if specified
            if (this.question.onlyInclude?.length) {
                const onlyInclude = this.question.onlyInclude?.split(',').map((o: string) => o.trim() ? Number(o.trim()) : null) || [];
                if (onlyInclude.length > 0) {
                    filteredItems = filteredItems.filter((item: any) => onlyInclude.includes(item.id));
                }
            }
            
            // Store the mapping for use in renderItem
            (this as any).originalDataMap = originalDataMap;

            // Get validation state for FDS wrapper
            const errors = collectQuestionErrors(this.question);
            const firstError = errors[0];
            const isInvalid = errors.length > 0;
            const errorMessage = firstError
                ? (typeof firstError.getText === 'function' ? firstError.getText() : firstError.text || firstError.message)
                : undefined;


            // Get selected vehicles for chips display
            const selectedValues = this.question.value || [];
            const selectedVehicles = selectedValues.map((value: any) => {
                const item = filteredItems.find((item: any) => item.value === value);
                const originalData = originalDataMap.get(value);
                return {
                    value,
                    name: item?.text || originalData?.name || `Vehicle ${value}`,
                    originalData
                };
            });

            const wrapperRequiredFinal = isQuestionEffectivelyRequired(this.question) || isQuestionEffectivelyRequired(this.question.contentQuestion);
            return (
                <FDSQuestionWrapper
                    label={this.question.fullTitle || this.question.title || "Please select the Lincoln vehicles that you experienced today."}
                    description={this.question.description}
                    isRequired={wrapperRequiredFinal}
                    isInvalid={isInvalid}
                    errorMessage={errorMessage}
                    question={this.question}
                >
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

    removeVehicle = (vehicleValue: any) => {
        const currentValue = this.question.value || [];
        const newValue = currentValue.filter((val: any) => val !== vehicleValue);
        this.question.value = newValue;
        this.setState({});
    }
}

// Register the custom renderer
console.log('CheckboxVehiclesDriven: Registering sv-checkbox-vehiclesdriven renderer...');
ReactQuestionFactory.Instance.registerQuestion(
    "sv-checkbox-vehiclesdriven",
    (props) => {
        console.log('CheckboxVehiclesDriven: Creating CheckboxVehiclesDrivenQuestion component', props);
        return React.createElement(CheckboxVehiclesDrivenQuestion, props);
    }
);

console.log('CheckboxVehiclesDriven: Registering renderer for renderAs="vehiclesdriven"...');
RendererFactory.Instance.registerRenderer(
    "checkbox",
    "vehiclesdriven",
    "sv-checkbox-vehiclesdriven"
);
// @ts-nocheck
