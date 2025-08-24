import React from 'react';
import { useLocation } from 'react-router-dom';

import Survey from '../classes/Survey';

import './Thanks.scss';
import styled, { DefaultTheme, ThemeProvider } from 'styled-components';
import { fordTheme } from '../themes/defaultTheme';
import LocaleString from '../classes/LocaleString';

function ThanksScreen() {
  const location = useLocation();
  console.log('location.state', location.state);
  // Support both new map field and legacy JSON string
  const theme = location.state.surveyJSTheme || 
                (location.state.theme ? JSON.parse(location.state.theme) : {});
  const thanks = location.state.thanks;

  const newTheme:DefaultTheme = {
    ...fordTheme,
    ...theme,
    colors: {
      ...fordTheme.colors,
      ...theme.colors,
    }
  }

  return (
    <div className="fds-layout-grid__inner">
      <ThemeProvider theme={newTheme}>
        <div className="fds-layout-grid__cell--span-12">
          <Title>{thanks}</Title>
        </div>
      </ThemeProvider>
    </div>
  );
}

// themed components
const Title = styled.h1`
  color: ${props => props.theme.colors.text};
  text-align: center;
`;

export default ThanksScreen;
