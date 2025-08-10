import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import './styles/grid-layout.css';
import reportWebVitals from './reportWebVitals';

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

// Auth provider
import { AuthProvider } from './contexts/AuthContext';

// screens
import App from './App';
import Home from './screens/Home';
import Experiential from './screens/Experiential';
import CheckIn from './screens/CheckIn';
import CheckOut from './screens/CheckOut';
import Login from './screens/Login';
import Survey from './screens/Survey';
import Thanks from './screens/Thanks';
import Stats from './screens/Stats';
import Dashboard from './screens/Dashboard';
import Charts from './screens/Charts';

import FDSDemo from './screens/FDS_Demo';
const FDSSurveyDemo = React.lazy(() => import('./screens/FDSSurveyDemo'));

import BroncoQuiz from './screens/BroncoQuiz';

import Admin from './screens/admin/index';
import EditEvent from './screens/admin/EditEvent';
import EditSurvey from './screens/admin/EditSurvey';

// Add a type declaration for window._env_
declare global {
  interface Window {
    _env_?: any;
  }
}

console.log('window._env_ at runtime:', window._env_);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route path="demo" element={<FDSDemo />} />
          <Route path="fds-survey-demo" element={
            <React.Suspense fallback={<div>Loading FDS Demo...</div>}>
              <FDSSurveyDemo />
            </React.Suspense>
          } />
          <Route index element={<Home />} />
          <Route path="welcome" element={<Login />} />
          <Route path="auth" element={<Login />} />
          <Route path="ford/:eventID" element={<Experiential />} />
          <Route path="s/:eventID/" element={<Survey />} />
          <Route path="s/:eventID/in/login" element={<Login />} />
          <Route path="s/:eventID/in" element={<CheckIn />} />
          <Route path="s/:eventID/out/login" element={<Login />} />
          <Route path="s/:eventID/out" element={<CheckOut />} />
          <Route path="s/:eventID/p/:preSurveyID" element={<Survey />} />
          <Route path="s/:eventID/stats" element={<Stats />} />
          <Route path="s/:eventID/stats/login" element={<Login />} />
          <Route path="s/:eventID/dashboard" element={<Dashboard />} />
          <Route path="s/:eventID/dashboard/login" element={<Login />} />
          <Route path="s/:eventID/charts" element={<Charts />} />
          <Route path="s/:eventID/charts/login" element={<Login />} />
          <Route path="thanks" element={<Thanks />} />

          <Route path="bronco/" element={<BroncoQuiz />} />

          <Route path="admin" element={<Admin />} />
          <Route path="admin/event/:eventID" element={<EditEvent />} />
          <Route path="admin/event/:eventID/survey" element={<EditSurvey />} />
          
          <Route path="admin/login" element={<Login />} />
          <Route path="admin/event/:eventID/login" element={<Login />} />
          <Route path="admin/event/:eventID/survey/login" element={<Login />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
