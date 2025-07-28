import React from 'react';
import './OpinionScale.scss';
import {
    FieldWrapper,
} from "@progress/kendo-react-form";
import { Label, Hint, Error } from "@progress/kendo-react-labels";
import { FieldProps } from 'formik';
import { Button } from '@progress/kendo-react-buttons';
import SurveyQuestion from '../classes/SurveyQuestion';
import styled from 'styled-components';

interface OpinionScaleProps extends FieldProps {
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
  text-transform: none;
  height: 50;
  flex-basis: 0;
  flex-grow: 1;
  @media (max-width: 768px) {
    min-height: 50px;
  }
  @media (min-width: 768px) {
    padding: 1em;
    margin-left: 1vw;
    margin-right: 1vw;
  }

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

const OpinionScale = (fieldRenderProps:OpinionScaleProps) => {
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
          answers,
          required = false,
          leftOpinion,
          rightOpinion,
        }
    } = fieldRenderProps;
  
    const error = errors[name];
    const isTouched = touched[name];
    const showValidationMessage = isTouched && error;
    const errorId = showValidationMessage ? `${name}_error` : "";
  
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
          <div style={{display:'flex', flexDirection:'row', justifyContent:'space-evenly'}}>
            {
              answers?.map(answer => (
                <StyledButton
                  key={answer.valueOf()}
                  themeColor={showValidationMessage ? "error" : undefined}
                  togglable={true}
                  selected={answer.valueOf() === value}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!required && answer.valueOf() === value) {
                      setFieldValue(id, null, true);
                    } else {
                      setFieldValue(id, answer.valueOf(), true);
                    }
                    setTimeout(() => setFieldTouched(id, true, true), 500);
                  }}
                >{answer.toString()}</StyledButton>
              ))
            }
          </div>
          <div style={{display:'flex', flexDirection:'row', justifyContent:'space-between'}}>
            <Hint>{leftOpinion?.toString()}</Hint>
            <Hint>{rightOpinion?.toString()}</Hint>
          </div>
          {showValidationMessage && (
            <Error id={errorId}>{error.toString()}</Error>
          )}
        </div>
      </FieldWrapper>
    );
  };

export default OpinionScale;
