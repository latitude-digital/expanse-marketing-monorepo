import React from 'react';
import './Checkbox.scss';
import {
    FieldWrapper,
} from "@progress/kendo-react-form";
import { Hint, Error } from "@progress/kendo-react-labels";
import { FieldProps } from 'formik';
import { Checkbox as KendoCheckbox } from "@progress/kendo-react-inputs";
import SurveyQuestion from '../classes/SurveyQuestion';
import styled from 'styled-components';

interface CheckboxProps extends FieldProps {
  question: SurveyQuestion;
}

const StyledCheckbox = styled(KendoCheckbox)`
  .k-checkbox-lg {
    height: 40px;
    width: 40px;
    margin: 5px;
  }
  .k-checkbox-label {
    color: ${props => {
      // error
      if (props.valid === false) {
        return props.theme.colors.error;
      }
      return props.theme.colors.text;
    }};
  }
  .k-checkbox {
    border-color: ${props => {
      // error
      if (props.valid === false) {
        return props.theme.colors.error;
      }
      return props.theme.colors.primary;
    }};
    border-radius: ${props => props.theme.borderRadius};
  }
  .k-checkbox:checked {
    border-color: ${props => {
      // error
      if (props.valid === false) {
        return props.theme.colors.error;
      }
      return props.theme.colors.primary;
    }};
    background-color: ${props => {
      // error
      if (props.valid === false) {
        return props.theme.colors.error;
      }
      return props.theme.colors.primary;
    }};
  }
  .k-checkbox:focus {
    box-shadow: ${props => `0 0 2px ${props.theme.colors.secondary}`};
  }
`;

const Checkbox = (fieldRenderProps:CheckboxProps) => {
    const {
        field: {
          name,
          value,
        },
        form: { // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
          touched,
          errors,
          setFieldTouched,
          setFieldValue,
        },
        question: {
          id,
          question,
          hint,
          answers,
          required = false,
          oneAnswerPerLine = false,
        }
    } = fieldRenderProps;
  
    const error = errors[name];
    const isTouched = touched[name];
    const showValidationMessage = isTouched && error;
    const showHint = !showValidationMessage && hint;
    const hindId = showHint ? `${name}_hint` : "";
    const errorId = showValidationMessage ? `${name}_error` : "";
    const [ answer ] = answers!;
    const selected = answer.valueOf() === value;
  
    return (
      <FieldWrapper>
        <div className={"k-form-field-wrap"}>
          <StyledCheckbox
            label={question.toString()}
            value={selected}
            onChange={(e) => {
              if (answer.valueOf() === value) {
                setFieldValue(id, null, true);
              } else {
                setFieldValue(id, answer.valueOf(), true);
              }
              setTimeout(() => setFieldTouched(id, true, true), 500);
            }}
            size="large"
          />
          {showHint && <Hint id={hindId}>{hint.toString()}</Hint>}
          {showValidationMessage && (
            <Error id={errorId}>{error.toString()}</Error>
          )}
        </div>
      </FieldWrapper>
    );
  };

export default Checkbox;
