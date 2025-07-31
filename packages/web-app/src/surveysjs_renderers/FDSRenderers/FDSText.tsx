import React, { useEffect, useRef } from "react";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { QuestionTextModel } from "survey-core";
import { StyledTextField } from "@ui/ford-ui-components/src/v2/inputField/Input";
import { renderLabel, renderDescription, getOptionalText, useQuestionValidation } from "./FDSShared/utils";

interface ParsedAddress {
  formatted_address?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export class FDSTextRenderer extends SurveyQuestionElementBase {
    constructor(props: any) {
        super(props);
    }

    protected get question(): QuestionTextModel {
        return this.questionBase as QuestionTextModel;
    }

    protected canRender(): boolean {
        return super.canRender();
    }

    protected renderElement(): JSX.Element {
        const question = this.question;
        const { isInvalid, errorMessage } = useQuestionValidation(question);
        const inputType = this.getInputType();
        const optionalText = getOptionalText(question);
        
        // Address autocomplete functionality
        const inputRef = useRef<any>();
        const autoCompleteRef = useRef<google.maps.places.Autocomplete>();

        useEffect(() => {
            const questionData = question as any;
            const hasAutocomplete = questionData.addressAutocompleteConfig;
            
            if (hasAutocomplete && inputRef.current) {
                const defaultConfig = {
                    types: ['address'],
                    fields: ['address_components', 'formatted_address'],
                    componentRestrictions: {
                        country: ['us'],
                    },
                };

                const mergedConfig = {
                    ...defaultConfig,
                    ...questionData.addressAutocompleteConfig,
                    // Ensure componentRestrictions is properly merged
                    componentRestrictions: {
                        ...defaultConfig.componentRestrictions,
                        ...questionData.addressAutocompleteConfig?.componentRestrictions,
                    },
                };

                autoCompleteRef.current = new window.google.maps.places.Autocomplete(
                    inputRef.current.inputElement,
                    mergedConfig,
                );
                
                autoCompleteRef.current.addListener("place_changed", async function () {
                    const place = await autoCompleteRef.current!.getPlace();

                    const ParsedData: ParsedAddress = {
                        formatted_address: place.formatted_address,
                    };

                    const postalData = place.address_components?.find(item => item.types.includes("postal_code"));
                    const countryData = place.address_components?.find(item => item.types.includes("country"));
                    const addressData = place.address_components?.find(item => item.types.includes("administrative_area_level_1"));
                    const cityData = place.address_components?.find(item => item.types.includes("locality"));
                    const routeData = place.address_components?.find(item => item.types.includes("route"));
                    const streetNumberData = place.address_components?.find(item => item.types.includes("street_number"));
                    
                    ParsedData.address1 = ([streetNumberData?.long_name, routeData?.long_name].join(' ')).trim();
                    ParsedData.city = (cityData == null) ? "" : cityData.long_name;
                    ParsedData.state = (addressData == null) ? "" : addressData.short_name;
                    ParsedData.zip = (postalData == null) ? "" : postalData.long_name;
                    ParsedData.country = (countryData == null) ? "" : countryData.short_name;

                    if (questionData.addressAutocompleteConfig?.addressPartMap) {
                        const thisMap = questionData.addressAutocompleteConfig?.addressPartMap;
                        
                        // Get the survey instance to update other fields
                        const survey = question.survey;
                        
                        let key: keyof typeof thisMap;
                        for (key in thisMap) {
                            const fieldName = thisMap[key]!;
                            const fieldValue = ParsedData[key];
                            
                            // Find the question in the survey and update its value
                            const targetQuestion = survey.getQuestionByName(fieldName);
                            if (targetQuestion && fieldValue) {
                                targetQuestion.value = fieldValue;
                            }
                        }
                    }
                });

                // Cleanup function
                return () => {
                    if (autoCompleteRef.current) {
                        google.maps.event.clearInstanceListeners(autoCompleteRef.current);
                    }
                };
            }
        }, [question]);
        
        return (
            <StyledTextField
                ref={inputRef}
                label={renderLabel(question.fullTitle)}
                description={renderDescription(question.description)}
                isRequired={question.isRequired}
                requiredMessage={optionalText}
                placeholder={question.placeholder || ""}
                value={question.value || ""}
                isInvalid={isInvalid}
                errorMessage={errorMessage}
                type={inputType}
                isDisabled={question.isReadOnly}
                onChange={(value: string) => {
                    question.value = value;
                }}
                onBlur={() => {
                    // Trigger validation on blur
                    question.validate();
                }}
                data-testid={`fds-text-${question.name}`}
            />
        );
    }

    private getInputType(): string {
        const question = this.question;
        
        // Map SurveyJS input types to HTML input types
        switch (question.inputType) {
            case "email":
                return "email";
            case "number":
                return "number";
            case "password":
                return "password";
            case "tel":
                return "tel";
            case "url":
                return "url";
            case "date":
                return "date";
            case "datetime-local":
                return "datetime-local";
            case "time":
                return "time";
            default:
                return "text";
        }
    }
}

// Override the default text question renderer with our Ford UI version
ReactQuestionFactory.Instance.registerQuestion(
    "text",
    (props) => {
        return React.createElement(FDSTextRenderer, props);
    }
);

// Also register for email text input type
ReactQuestionFactory.Instance.registerQuestion(
    "emailtextinput",
    (props) => {
        return React.createElement(FDSTextRenderer, props);
    }
);