import React, { useState, useEffect } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";

// Import all our FDS renderers to ensure they're registered
import "../surveysjs_renderers/FDSRenderers/FDSText";
import "../surveysjs_renderers/FDSRenderers/FDSCheckbox";
import "../surveysjs_renderers/FDSRenderers/FDSRadio";
import "../surveysjs_renderers/FDSRenderers/FDSDropdown";
import "../surveysjs_renderers/FDSRenderers/FDSTextArea";
import "../surveysjs_renderers/FDSRenderers/FDSToggle";

// Demo survey JSON showcasing all FDS components
const demoSurveyJSON = {
  "title": "🎨 Ford Design System Components Demo",
  "description": "Experience all 6 core question types with real Ford UI components",
  "pages": [
    {
      "name": "selections",
      "title": "Selection Components", 
      "elements": [
        {
          "type": "radiogroup",
          "name": "favoriteVehicle",
          "title": "**Favorite Ford Vehicle**",
          "description": "Choose your favorite from our current lineup",
          "isRequired": true,
          "choices": [
            {"value": "f150", "text": "F-150 Lightning"},
            {"value": "mustang", "text": "Mustang Mach-E"},
            {"value": "explorer", "text": "Explorer"},
            {"value": "bronco", "text": "Bronco"},
            {"value": "escape", "text": "Escape"}
          ]
        },
        {
          "type": "checkbox",
          "name": "features",
          "title": "**Desired Features** (select all that apply)",
          "description": "Which features are most important to you?",
          "isRequired": true,
          "choices": [
            {"value": "autopilot", "text": "BlueCruise Hands-Free Driving"},
            {"value": "sync", "text": "SYNC 4A Technology"},
            {"value": "charging", "text": "Fast Charging Capability"},
            {"value": "terrain", "text": "Terrain Management System"},
            {"value": "safety", "text": "Ford Co-Pilot360"},
            {"value": "audio", "text": "B&O Premium Audio"}
          ]
        },
        {
          "type": "dropdown",
          "name": "dealership",
          "title": "Preferred Dealership Location",
          "description": "Select the dealership closest to you",
          "isRequired": true,
          "placeholder": "Choose a location...",
          "choices": [
            {"value": "downtown", "text": "Downtown Ford"},
            {"value": "north", "text": "North Side Ford"},
            {"value": "suburban", "text": "Suburban Ford Center"},
            {"value": "highway", "text": "Highway Ford Dealership"},
            {"value": "other", "text": "Other Location"}
          ]
        }
      ]
    },
    {
      "name": "textAndToggles",
      "title": "Text Area & Toggle Components",
      "elements": [
        {
          "type": "comment",
          "name": "feedback",
          "title": "**Additional Comments**",
          "description": "Share your thoughts about Ford vehicles or your experience",
          "isRequired": true,
          "placeholder": "Tell us what you think...",
          "rows": 4,
          "maxLength": 500
        },
        {
          "type": "boolean",
          "name": "newsletter",
          "title": "Newsletter Subscription",
          "description": "Would you like to receive **Ford newsletters** with the latest updates, special offers, and electric vehicle news?",
          "isRequired": true,
          "labelTrue": "Yes, keep me informed",
          "labelFalse": "No, thanks"
        },
        {
          "type": "boolean",
          "name": "testDrive",
          "title": "Schedule Test Drive",
          "description": "Are you interested in scheduling a test drive at your local Ford dealership?",
          "isRequired": true,
          "labelTrue": "Yes, I'm interested",
          "labelFalse": "Not at this time"
        }
      ]
    },
    {
      "name": "textInputs",
      "title": "Text Input Components",
      "elements": [
        {
          "type": "text",
          "name": "firstName",
          "title": "**First Name** (with markdown)",
          "description": "Enter your *first name* using the Ford UI StyledTextField component",
          "isRequired": true,
          "placeholder": "Enter your first name"
        },
        {
          "type": "text",
          "name": "email",
          "title": "Email Address",
          "inputType": "email",
          "isRequired": true,
          "placeholder": "your.email@example.com",
          "validators": [{"type": "email"}]
        },
        {
          "type": "text",
          "name": "phone",
          "title": "Phone Number",
          "inputType": "tel",
          "isRequired": false,
          "placeholder": "(555) 123-4567"
        }
      ]
    }
  ],
  "showQuestionNumbers": "off",
  "showProgressBar": "bottom",
  "completedHtml": "<div style='text-align: center; padding: 40px;'><h2>🎉 Demo Complete!</h2><p>All Ford Design System components are working perfectly with <strong id='final-theme'>Ford</strong> branding.</p><p>Try switching themes and submitting again to see the difference!</p></div>",
  "requiredText": ""
};

const FDSSurveyDemoScreen: React.FC = () => {
  const [currentBrand, setCurrentBrand] = useState<'ford' | 'lincoln'>('ford');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [survey, setSurvey] = useState<Model | null>(null);

  // Initialize survey
  useEffect(() => {
    const surveyModel = new Model(demoSurveyJSON);
    
    // Configure survey for better demo experience
    surveyModel.questionErrorLocation = "bottom";
    
    // Add completion handler to show current theme
    surveyModel.onComplete.add((sender) => {
      // Update the completion message with current brand
      const brandName = currentBrand === 'ford' ? 'Ford' : 'Lincoln';
      sender.completedHtml = sender.completedHtml.replace(
        '<strong id="final-theme">Ford</strong>', 
        `<strong id="final-theme">${brandName}</strong>`
      );
    });

    setSurvey(surveyModel);
  }, [currentBrand]);

  const toggleBrand = () => {
    setCurrentBrand(prev => prev === 'ford' ? 'lincoln' : 'ford');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="fds-survey-demo" style={{ 
      minHeight: '100vh',
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff'
    }}>
      {/* Demo Header */}
      <div style={{
        backgroundColor: currentBrand === 'ford' ? '#0066cc' : '#8B2635',
        color: 'white',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>
          🎨 Ford Design System Components Demo
        </h1>
        <p style={{ margin: '0', fontSize: '16px', opacity: 0.9 }}>
          Experience all 6 core SurveyJS question types using real Ford UI components
        </p>
      </div>

      {/* Brand & Theme Controls */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: '600', color: '#374151' }}>Brand:</span>
          <button
            onClick={toggleBrand}
            style={{
              padding: '10px 20px',
              backgroundColor: currentBrand === 'ford' ? '#0066cc' : '#8B2635',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              minWidth: '100px',
              transition: 'all 0.2s ease'
            }}
          >
            {currentBrand === 'ford' ? '🔵 Ford' : '🔴 Lincoln'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: '600', color: '#374151' }}>Theme:</span>
          <button
            onClick={toggleTheme}
            style={{
              padding: '10px 20px',
              backgroundColor: theme === 'light' ? '#fbbf24' : '#1f2937',
              color: theme === 'light' ? '#000' : '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              minWidth: '100px',
              transition: 'all 0.2s ease'
            }}
          >
            {theme === 'light' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        <div style={{ 
          padding: '8px 16px',
          backgroundColor: '#e5e7eb',
          borderRadius: '20px',
          fontSize: '14px',
          color: '#374151'
        }}>
          Current: <strong>{currentBrand === 'ford' ? 'Ford' : 'Lincoln'} {theme === 'light' ? 'Light' : 'Dark'}</strong>
        </div>
      </div>

      {/* Component Overview */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>
            Components in this Demo
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '10px',
            fontSize: '14px'
          }}>
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              📝 <strong>Text Input</strong><br/>StyledTextField
            </div>
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              ☑️ <strong>Checkbox</strong><br/>Checkbox + Wrapper
            </div>
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              🔘 <strong>Radio</strong><br/>RadioButtonGroup
            </div>
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              📋 <strong>Dropdown</strong><br/>StyledSelectDropdown
            </div>
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              📄 <strong>Text Area</strong><br/>TextArea
            </div>
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              🔄 <strong>Toggle</strong><br/>Toggle + Wrapper
            </div>
          </div>
        </div>
      </div>

      {/* Survey Container with Theme Wrapper */}
      <div style={{ padding: '20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {survey && (
            <div id="fd-nxt" className={`${currentBrand}_${theme}`}>
              <Survey model={survey} />
            </div>
          )}
        </div>
      </div>

      {/* Demo Footer */}
      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#1f2937',
        color: 'white',
        textAlign: 'center'
      }}>
        <p style={{ margin: '0', fontSize: '14px', opacity: 0.8 }}>
          🚀 This demo showcases the complete Ford Design System integration with SurveyJS<br/>
          All components automatically inherit {currentBrand === 'ford' ? 'Ford' : 'Lincoln'} {theme} theme colors via CSS variables
        </p>
      </div>
    </div>
  );
};

export default FDSSurveyDemoScreen;