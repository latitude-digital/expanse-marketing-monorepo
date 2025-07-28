import React, { HTMLInputTypeAttribute, useEffect, useRef } from 'react';
import {
  FieldWrapper,
} from "@progress/kendo-react-form";
import { Label, Hint, Error } from "@progress/kendo-react-labels";
import { MaskedTextBox } from "@progress/kendo-react-inputs";
import { FieldProps } from 'formik';
import styled from 'styled-components';

import './MaskedInput.scss';
import SurveyQuestion from '../classes/SurveyQuestion';

interface MaskedInputProps extends FieldProps {
    question: SurveyQuestion;
    type?: HTMLInputTypeAttribute;
    mask: string;
    includeLiterals: boolean;
}

const StyledMaskedTextBox = styled(MaskedTextBox)`
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
  border-color: ${props => {
    // error
    if (props.valid === false) {
      return props.theme.colors.error;
    }
    return props.theme.colors.primary;
  }};
  border-radius: ${props => props.theme.borderRadius};

  &.k-input-solid:focus-within {
    border-color: rgba(0, 0, 0, 0.16);
    box-shadow: ${props => {
      // error
      if (props.valid === false) {
        return `0 0 0 1px ${props.theme.colors.error}`;
      }
      return `0 0 0 1px ${props.theme.colors.secondary}`;
    }};
  }
`;

const MaskedInput = (fieldRenderProps:MaskedInputProps) => {
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
        mask,
        includeLiterals = false,
        ...others
    } = fieldRenderProps;
  
    const error = errors[name];
    const isTouched = touched[name];
    const showValidationMessage = isTouched && error;
    const showHint = !showValidationMessage && question.hint;
    const hindId = showHint ? `${name}_hint` : "";
    const errorId = showValidationMessage ? `${name}_error` : "";

    return (
      <FieldWrapper>
        <Label
          editorId={name}
          editorValid={!showValidationMessage || !error}
        //   optional={!required}
        >
          {question.question.toString()}
        </Label>
        <StyledMaskedTextBox
          valid={!showValidationMessage || !error}
          id={name}
          placeholder={question.placeholder?.toString() || ''}
          mask={mask}
          includeLiterals={includeLiterals}
          ariaDescribedBy={`${hindId} ${errorId}`}
          onChange={(e) => {
            setFieldValue(name, e.value);
            setFieldTouched(name, true, false);
          }}
          value={value}
          onBlur={e => {
            onBlur(e.nativeEvent)
          }}
          {...others}
        />
        {showHint && <Hint id={hindId}>{question.hint!.toString()}</Hint>}
        {showValidationMessage && (
          <Error id={errorId}>{error.toString()}</Error>
        )}
      </FieldWrapper>
    );
  };

export default MaskedInput;
