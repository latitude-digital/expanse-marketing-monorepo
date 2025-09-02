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
import ProtectedRoute from './components/auth/ProtectedRoute';
import EventAccessRoute from './components/auth/EventAccessRoute';
import SessionProvider from './components/auth/SessionProvider';

// screens
import App from './App';
import Home from './screens/Home';
import UserHome from './screens/UserHome';
import Experiential from './screens/Experiential';
import CheckIn from './screens/CheckIn';
import CheckOut from './screens/CheckOut';
import Login from './screens/Login';
import Logout from './screens/Logout';
import ForgotPassword from './screens/ForgotPassword';
import ResetPassword from './screens/ResetPassword';
import Survey from './screens/Survey';
import Thanks from './screens/Thanks';
import Stats from './screens/Stats';
import Dashboard from './screens/Dashboard';

// Admin components
import AdminLayout from './components/AdminLayout';
import AdminEvents from './screens/admin/AdminEvents';
import AdminTags from './screens/admin/AdminTags';
import AdminUsers from './screens/admin/AdminUsers';
import EditEventTailwind from './screens/admin/EditEventTailwind';
import EditEventLegacy from './screens/admin/EditEventLegacy';
import EditSurvey from './screens/admin/EditSurvey';
import ReUpload from './screens/admin/ReUpload';

console.log('window._env_ at runtime:', window._env_);

// AUTH-009: Enable CloudFront testing utilities in development
if (process.env.NODE_ENV === 'development') {
  import('./utils/cloudFrontTestUtils').then(({ enableCloudFrontConsoleHelpers, logCloudFrontStatus }) => {
    enableCloudFrontConsoleHelpers();
    console.log('🔒 CloudFront test utilities enabled in development mode');
    console.log('   Use CloudFrontTest.log() to check CloudFront status');
    console.log('   Use CloudFrontTest.test() to run full integration test');
    
    // Auto-log status after a brief delay to let auth initialize
    setTimeout(() => {
      logCloudFrontStatus();
    }, 2000);
  }).catch(err => {
    console.warn('Failed to load CloudFront test utilities:', err);
  });
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <AuthProvider>
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="home" element={<ProtectedRoute><UserHome /></ProtectedRoute>} />
          <Route path="login" element={<Login />} />
          <Route path="welcome" element={<Login />} />
          <Route path="auth" element={<Login />} />
          <Route path="logout" element={<Logout />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="ford/:eventID" element={<Experiential />} />
          <Route path="s/:eventID/" element={<Survey />} />
          <Route path="s/:eventID/in/login" element={<Login />} />
          <Route path="s/:eventID/in" element={<ProtectedRoute><EventAccessRoute><CheckIn /></EventAccessRoute></ProtectedRoute>} />
          <Route path="s/:eventID/out/login" element={<Login />} />
          <Route path="s/:eventID/out" element={<ProtectedRoute><EventAccessRoute><CheckOut /></EventAccessRoute></ProtectedRoute>} />
          <Route path="s/:eventID/p/:preSurveyID" element={<Survey />} />
          <Route path="s/:eventID/stats" element={<ProtectedRoute><EventAccessRoute><Stats /></EventAccessRoute></ProtectedRoute>} />
          <Route path="s/:eventID/stats/login" element={<Login />} />
          <Route path="s/:eventID/dashboard" element={<ProtectedRoute><EventAccessRoute><Dashboard /></EventAccessRoute></ProtectedRoute>} />
          <Route path="s/:eventID/dashboard/login" element={<Login />} />
          <Route path="thanks" element={<Thanks />} />

          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminEvents />} />
            <Route path="tags" element={<AdminTags />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="event/:eventID" element={<EditEventTailwind />} />
            <Route path="event/new" element={<EditEventTailwind />} />
            <Route path="event-legacy/:eventID" element={<EditEventLegacy />} />
            <Route path="event-legacy/new" element={<EditEventLegacy />} />
            <Route path="survey/:eventID" element={<EditSurvey />} />
            <Route path="reupload" element={<ReUpload />} />
          </Route>
          
          <Route path="admin/login" element={<Login />} />
          <Route path="admin/*/login" element={<Login />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </SessionProvider>
  </AuthProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Development-only test utilities
if (process.env.NODE_ENV === 'development') {
  // CloudFront test utilities
  import('./utils/cloudFrontTestUtils').then(module => {
    console.log('CloudFront test helpers enabled. Use CloudFrontTest.log() to check status.');
  });
  
  // Test user creation utility
  import('./utils/createTestUsers').then(module => {
    console.log('Test user creation enabled. Use createTestUsers() to create test accounts.');
  });
}
