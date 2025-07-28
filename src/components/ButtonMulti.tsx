import React from 'react';
import './ButtonMulti.scss';
import {
    FieldWrapper,
} from "@progress/kendo-react-form";
import { Label, Hint, Error } from "@progress/kendo-react-labels";
import { FieldProps } from 'formik';
import { Button } from '@progress/kendo-react-buttons';
import SurveyQuestion from '../classes/SurveyQuestion';
import styled from 'styled-components';
import { pull, union } from 'lodash';

interface ButtonMultiProps extends FieldProps {
  question: SurveyQuestion;
}

const StyledButton = styled(Button)`
  color: ${props => {
    // error
    if (props.themeColor === 'error') {
      return props.theme.colors.error;
    }
    if (props.selected) {
      return props.theme.colors.textOnPrimary;
    }
    return props.theme.colors.buttonText;
  }};
  background-color: ${props => {
    // error
    if (props.themeColor === 'error') {
      return props.theme.colors.buttonBackground;
    }
    if (props.selected) {
      return props.theme.colors.primary;
    }
    return props.theme.colors.buttonBackground;
  }};
  border-color: ${props => {
    // error
    if (props.themeColor === 'error') {
      return props.theme.colors.error;
    }
    return props.theme.colors.primary;
  }};
  border-radius: ${props => props.theme.borderRadius};
  font-size: 18px;
  font-weight: 400;
  padding: 1em;
  text-transform: none;
  height: 50px;
  flex-grow: 1;
  margin-left: 1vw;
  margin-right: 1vw;
  margin-bottom: 1em;

  &:hover {
    color: ${props => {
      // error
      if (props.themeColor === 'error') {
        return props.theme.colors.muted;
      }
      if (props.selected) {
        return props.theme.colors.textOnPrimary;
      }
      return props.theme.colors.text;
    }};
  };

  &.k-button-solid-base.k-selected {
    background-color: ${props => {
      // error
      if (props.themeColor === 'error') {
        return props.theme.colors.buttonBackground;
      }
      if (props.selected) {
        return props.theme.colors.primary;
      }
      return props.theme.colors.buttonBackground;
    }};
    border-color: ${props => {
      // error
      if (props.themeColor === 'error') {
        return props.theme.colors.error;
      }
      return props.theme.colors.primary;
    }};
  }
`;

const ButtonMulti = (fieldRenderProps:ButtonMultiProps) => {
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
    const arrayValue:string[] = union(value,[]);

    return (
      <FieldWrapper>
        <Label
          editorId={name}
          editorValid={!showValidationMessage || !error}
        //   optional={!required}
        >
          {question.toString()}
        </Label>
        <div className={"k-form-field-wrap"}>
          <div style={{display:'flex', flexDirection:oneAnswerPerLine?'column':'row', flexWrap:'wrap', justifyContent:'space-between'}}>
            {
              answers?.map(answer => (
                <StyledButton
                  key={answer.valueOf()}
                  themeColor={showValidationMessage ? "error" : undefined}
                  togglable={true}
                  selected={arrayValue.includes(answer.valueOf())}
                  onClick={(e) => {
                    e.preventDefault();

                    if (arrayValue.includes(answer.valueOf())) {
                      setFieldValue(id, pull(value,answer.valueOf()), true);
                    } else {
                      if (!fieldRenderProps.question.getMaxArray() || (fieldRenderProps.question.getMaxArray() && union(value,[]).length < fieldRenderProps.question.getMaxArray()!)) {
                        setFieldValue(id, union(value,[answer.valueOf()]), true);
                      }
                    }
                    setTimeout(() => setFieldTouched(id, true, true), 500);
                  }}
                >{answer.toString()}</StyledButton>
              ))
            }
          </div>
          {showHint && <Hint id={hindId}>{hint.toString()}</Hint>}
          {showValidationMessage && (
            <Error id={errorId}>{error.toString()}</Error>
          )}
        </div>
      </FieldWrapper>
    );
  };

export default ButtonMulti;
