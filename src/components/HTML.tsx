import React from 'react';
import './HTML.scss';
import {
    FieldWrapper,
} from "@progress/kendo-react-form";
import SurveyQuestion from '../classes/SurveyQuestion';
import styled from 'styled-components';

interface HTMLProps {
  question: SurveyQuestion;
}

// TODO: expand the supported content here
const StyledDiv = styled.div`
  color: ${props => {
    return props.theme.colors.text;
  }};
  p {
    color: ${props => {
      return props.theme.colors.text;
    }};
    margin: 1em 0 1em;
  }
  h2 {
    color: ${props => {
      return props.theme.colors.text;
    }};
  }
  a {
    color: ${props => {
      return props.theme.colors.highlight;
    }};
  }
  a:visited {
    color: ${props => {
      return props.theme.colors.highlight;
    }};
  }
`;

const HTML = (fieldRenderProps:HTMLProps) => {
  console.log('html', fieldRenderProps.question)
  const {
      question: {
        html
      }
  } = fieldRenderProps;
  
  return (
    <StyledDiv className={"k-form-field-wrap"} dangerouslySetInnerHTML={{__html: html!}} style={{marginBottom: '-10px'}} />
  );
};

export default HTML;
