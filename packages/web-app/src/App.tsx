import { Outlet } from 'react-router-dom';
import * as Sentry from "@sentry/react";

import './App.scss';

// import '@ford/gdux-design-foundation/dist/lincoln/styles/_variables.css';
// import '@ford/gdux-design-foundation/dist/lincoln/styles/gdux-lincoln.css';
// import '@ford/gdux-design-foundation/dist/lincoln/fontFamilies/lincoln-font-families.css';

Sentry.init({
  dsn: "https://d0f53ca4df48eafabf4a663fd814b805@o4506238718967808.ingest.sentry.io/4506747184283648",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

function App() {
  return (
    <div className='app'>
      <div className="layout-base">
        <Outlet />
      </div>
    </div>
  );
}

export default App;
