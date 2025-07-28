import React, { HTMLInputTypeAttribute, useEffect, useRef } from 'react';
import {
  FieldWrapper,
} from "@progress/kendo-react-form";
import { Label, Hint, Error } from "@progress/kendo-react-labels";
import { Input } from "@progress/kendo-react-inputs";
import { FieldProps } from 'formik';
import styled from 'styled-components';

import './TextInput.scss';
import SurveyQuestion from '../classes/SurveyQuestion';

interface TextInputProps extends FieldProps {
    question: SurveyQuestion;
    type?: HTMLInputTypeAttribute;
}

interface ParsedAddress {
  formatted_address?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

const StyledInput = styled(Input)`
  color: ${props => {
    // error
    if (props.valid === false) {
      return props.theme.colors.error;
    }
    return props.theme.colors.text;
  }};
  background-color: ${props => props.theme.colors.primary};
  border-color: ${props => {
    // error
    if (props.valid === false) {
      return props.theme.colors.error;
    }
    return props.theme.colors.primary;
  }};
  border-radius: ${props => props.theme.borderRadius};

  &:focus {
    border-color: ${props => {
      // error
      if (props.valid === false) {
        return props.theme.colors.error;
      }
      return props.theme.colors.secondary;
    }};
  };
`;

const TextInput = (fieldRenderProps:TextInputProps) => {
    const {
        field: {
            name,
            value,
            onChange,
            onBlur,
        },
        form: { // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
            touched,
            errors,
            setFieldValue,
            setFieldTouched,
        },
        question,
        type,
    } = fieldRenderProps;
  
    const error = errors[name];
    const isTouched = touched[name];
    const showValidationMessage = isTouched && error;
    const showHint = !showValidationMessage && question.hint;
    const hindId = showHint ? `${name}_hint` : "";
    const errorId = showValidationMessage ? `${name}_error` : "";

    // address autocomplete stuff
    const autoCompleteRef = useRef<google.maps.places.Autocomplete>();
    const inputRef = useRef<any>();
    useEffect(() => {
      if (question.addressAutocomplete) {
        autoCompleteRef.current = new window.google.maps.places.Autocomplete(
          inputRef.current.element,
          {
            types: ['address'],
            componentRestrictions: {
              country: ['us'],
            },
            fields: ['address_components', 'formatted_address'],
            ...question.addressAutocompleteConfig
          },
        );
        autoCompleteRef.current.addListener("place_changed", async function () {
          const place = await autoCompleteRef.current!.getPlace();
          console.log('placeResult', place);

          const ParsedData:ParsedAddress = {
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
    
          console.log('ParsedData', ParsedData);

          if (question.addressAutocompleteConfig?.addressPartMap) {
            const thisMap = question.addressAutocompleteConfig?.addressPartMap;
            console.log('thisMap', thisMap);
            let key: keyof typeof thisMap;
            for (key in thisMap) {
              console.log('key', key);
              setFieldValue(thisMap[key]!, ParsedData[key], true);
              setTimeout(() => setFieldTouched(thisMap[key]!, true), 200);
            }
          }
         });
      }
    }, []);
  
    return (
      <FieldWrapper>
        <Label
          editorId={name}
          editorValid={!showValidationMessage || !error}
        //   optional={!required}
        >
          {question.question.toString()}
        </Label>
        <StyledInput
          ref={inputRef}
          valid={!showValidationMessage || !error}
          type={type}
          id={name}
          placeholder={question.placeholder?.toString() || ''}
          maxLength={question.getMaxLength()}
          ariaDescribedBy={`${hindId} ${errorId}`}
          onChange={(e) => onChange(e.nativeEvent)}
          value={value}
          onBlur={onBlur}
          // {...others}
        />
        {/* <Hint direction={"end"} style={{ position: "absolute", right: 0 }}>
          {value.length} / {maxLength}
        </Hint> */}
        {showHint && <Hint id={hindId}>{question.hint!.toString()}</Hint>}
        {showValidationMessage && (
          <Error id={errorId}>{error.toString()}</Error>
        )}
      </FieldWrapper>
    );
  };

export default TextInput;
