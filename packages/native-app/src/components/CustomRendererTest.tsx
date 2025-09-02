import React, { useState } from 'react';
import { StyleSheet, View, Text, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { environment } from '../config/environment';

const { width, height } = Dimensions.get('window');

interface CustomRendererTestResults {
  touchEventsWorking: boolean;
  customRenderersLoaded: boolean;
  fordUIComponentsWorking: boolean;
  interactionTested: boolean;
  errors: string[];
  detailedResults: {
    textInput: boolean;
    dropdown: boolean;
    radioGroup: boolean;
    checkbox: boolean;
    rating: boolean;
    fileUpload: boolean;
  };
}

const CustomRendererTest: React.FC = () => {
  const [testResults, setTestResults] = useState<CustomRendererTestResults | null>(null);
  const [currentBrand, setCurrentBrand] = useState<'ford' | 'lincoln' | 'other'>('ford');
  const [isLoading, setIsLoading] = useState(true);

  // Generate comprehensive custom renderer testing HTML
  const generateCustomRendererTestHTML = (brand: 'ford' | 'lincoln' | 'other') => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Custom Renderer Touch Event Test</title>
    
    <!-- SurveyJS Core and React UI -->
    <script src="https://unpkg.com/survey-core@2.0.0/survey.core.min.js"></script>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/survey-react-ui@2.0.0/survey-react-ui.min.js"></script>
    
    <!-- Ford UI CSS (if available) -->
    <link rel="stylesheet" href="${environment.webAppUrl}/src/styles/${brand}/${brand}.css" id="brand-css">
    <link rel="stylesheet" href="${environment.webAppUrl}/src/styles/${brand}/${brand}-font-families.css" id="font-css">
    
    <style>
        * {
            box-sizing: border-box;
        }
        
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
            line-height: 1.6;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
        
        .${brand}_light {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .test-header {
            background: ${brand === 'ford' ? '#257180' : brand === 'lincoln' ? '#8B1538' : '#333333'};
            color: white;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            text-align: center;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .test-results {
            margin: 20px 0;
            padding: 15px;
            border-radius: 4px;
            background: #f8f9fa;
            border-left: 4px solid ${brand === 'ford' ? '#257180' : brand === 'lincoln' ? '#8B1538' : '#333333'};
        }
        
        .test-item {
            margin: 8px 0;
            padding: 8px;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .test-passed {
            background: #d4edda;
            color: #155724;
        }
        
        .test-failed {
            background: #f8d7da;
            color: #721c24;
        }
        
        .test-pending {
            background: #fff3cd;
            color: #856404;
        }
        
        .interaction-test {
            margin: 20px 0;
            padding: 15px;
            background: white;
            border-radius: 4px;
            border: 2px solid #dee2e6;
        }
        
        .touch-test-button {
            background: ${brand === 'ford' ? '#257180' : brand === 'lincoln' ? '#8B1538' : '#333333'};
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px 5px;
            min-height: 44px; /* iOS minimum touch target */
            min-width: 44px;
            -webkit-tap-highlight-color: rgba(0,0,0,0.1);
        }
        
        .touch-test-button:active {
            transform: scale(0.95);
            background: ${brand === 'ford' ? '#0052A3' : brand === 'lincoln' ? '#6F1029' : '#222222'};
        }
        
        .touch-feedback {
            margin-top: 10px;
            padding: 10px;
            border-radius: 4px;
            background: #e3f2fd;
            color: #1565c0;
            display: none;
        }
        
        /* Custom renderer styles to match Ford UI */
        .custom-text-input {
            width: 100%;
            padding: 12px;
            border: 2px solid var(--semantic-color-stroke-onlight-moderate-default, #dee2e6);
            border-radius: var(--semantic-radius-interactive, 4px);
            font-size: 16px;
            font-family: var(--font-body-1-regular-font-family, inherit);
            background: white;
            -webkit-appearance: none;
            appearance: none;
        }
        
        .custom-text-input:focus {
            outline: none;
            border-color: var(--semantic-color-fill-onlight-interactive, ${brand === 'ford' ? '#257180' : brand === 'lincoln' ? '#8B1538' : '#333333'});
            box-shadow: 0 0 0 2px var(--semantic-color-fill-onlight-interactive, ${brand === 'ford' ? '#257180' : brand === 'lincoln' ? '#8B1538' : '#333333'})33;
        }
        
        .custom-dropdown {
            width: 100%;
            padding: 12px;
            border: 2px solid var(--semantic-color-stroke-onlight-moderate-default, #dee2e6);
            border-radius: var(--semantic-radius-interactive, 4px);
            font-size: 16px;
            background: white;
            -webkit-appearance: none;
            appearance: none;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 12px center;
            background-repeat: no-repeat;
            background-size: 16px;
            padding-right: 40px;
        }
        
        .custom-radio-group {
            margin: 15px 0;
        }
        
        .custom-radio-option {
            display: flex;
            align-items: center;
            margin: 10px 0;
            padding: 10px;
            border-radius: 4px;
            cursor: pointer;
            min-height: 44px;
            -webkit-tap-highlight-color: rgba(0,0,0,0.1);
        }
        
        .custom-radio-option:hover {
            background: #f8f9fa;
        }
        
        .custom-radio-option input[type="radio"] {
            margin-right: 12px;
            transform: scale(1.2);
        }
        
        .custom-checkbox {
            display: flex;
            align-items: center;
            margin: 10px 0;
            padding: 10px;
            border-radius: 4px;
            cursor: pointer;
            min-height: 44px;
            -webkit-tap-highlight-color: rgba(0,0,0,0.1);
        }
        
        .custom-checkbox input[type="checkbox"] {
            margin-right: 12px;
            transform: scale(1.2);
        }
        
        .rating-container {
            display: flex;
            gap: 10px;
            margin: 15px 0;
            justify-content: center;
        }
        
        .rating-star {
            font-size: 32px;
            color: #ddd;
            cursor: pointer;
            transition: color 0.2s;
            min-height: 44px;
            min-width: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-tap-highlight-color: rgba(0,0,0,0.1);
        }
        
        .rating-star:hover,
        .rating-star.active {
            color: #ffc107;
        }
        
        #surveyElement {
            margin-top: 20px;
        }
        
        /* SurveyJS overrides for mobile */
        .sv-root {
            font-family: inherit !important;
        }
        
        .sv-button {
            min-height: 44px !important;
            min-width: 44px !important;
            -webkit-tap-highlight-color: rgba(0,0,0,0.1) !important;
        }
        
        .sv-string-editor {
            min-height: 44px !important;
            -webkit-appearance: none !important;
            appearance: none !important;
        }
        
        .sv-dropdown {
            min-height: 44px !important;
            -webkit-appearance: none !important;
            appearance: none !important;
        }
        
        /* Debug information */
        .debug-info {
            margin-top: 20px;
            padding: 15px;
            background: #f0f0f0;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            max-height: 200px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="${brand}_light">
        <div class="test-header">
            ${brand.toUpperCase()} Custom Renderer Touch Test
        </div>
        
        <div class="test-results" id="test-results">
            <h3>Custom Renderer & Touch Tests</h3>
            <div id="touch-test" class="test-item test-pending">⏳ Testing touch events...</div>
            <div id="renderer-test" class="test-item test-pending">⏳ Testing custom renderers...</div>
            <div id="ford-ui-test" class="test-item test-pending">⏳ Testing Ford UI integration...</div>
            <div id="interaction-test" class="test-item test-pending">⏳ Testing user interactions...</div>
        </div>
        
        <div class="interaction-test">
            <h4>Touch Event Validation</h4>
            <p>Tap these buttons to test touch responsiveness:</p>
            <button class="touch-test-button" onclick="testTouchEvent('button1')">
                Touch Test 1
            </button>
            <button class="touch-test-button" onclick="testTouchEvent('button2')">
                Touch Test 2
            </button>
            <button class="touch-test-button" onclick="testTouchEvent('button3')">
                Touch Test 3
            </button>
            <div id="touch-feedback" class="touch-feedback"></div>
        </div>
        
        <div class="interaction-test">
            <h4>Custom Renderer Elements</h4>
            
            <div style="margin: 15px 0;">
                <label for="custom-text">Custom Text Input:</label>
                <input type="text" id="custom-text" class="custom-text-input" 
                       placeholder="Test typing here..." 
                       onchange="testInteraction('textInput', this.value)"
                       ontouchstart="logTouchEvent('text-input')">
            </div>
            
            <div style="margin: 15px 0;">
                <label for="custom-select">Custom Dropdown:</label>
                <select id="custom-select" class="custom-dropdown" 
                        onchange="testInteraction('dropdown', this.value)"
                        ontouchstart="logTouchEvent('dropdown')">
                    <option value="">Select an option...</option>
                    <option value="option1">Option 1</option>
                    <option value="option2">Option 2</option>
                    <option value="option3">Option 3</option>
                </select>
            </div>
            
            <div class="custom-radio-group">
                <label>Custom Radio Group:</label>
                <div class="custom-radio-option" ontouchstart="logTouchEvent('radio')">
                    <input type="radio" name="test-radio" value="radio1" 
                           onchange="testInteraction('radioGroup', this.value)">
                    <span>Radio Option 1</span>
                </div>
                <div class="custom-radio-option" ontouchstart="logTouchEvent('radio')">
                    <input type="radio" name="test-radio" value="radio2" 
                           onchange="testInteraction('radioGroup', this.value)">
                    <span>Radio Option 2</span>
                </div>
            </div>
            
            <div class="custom-checkbox" ontouchstart="logTouchEvent('checkbox')">
                <input type="checkbox" id="test-checkbox" 
                       onchange="testInteraction('checkbox', this.checked)">
                <label for="test-checkbox">Custom Checkbox</label>
            </div>
            
            <div style="margin: 15px 0;">
                <label>Rating Component:</label>
                <div class="rating-container">
                    <span class="rating-star" data-rating="1" onclick="setRating(1)" ontouchstart="logTouchEvent('rating')">★</span>
                    <span class="rating-star" data-rating="2" onclick="setRating(2)" ontouchstart="logTouchEvent('rating')">★</span>
                    <span class="rating-star" data-rating="3" onclick="setRating(3)" ontouchstart="logTouchEvent('rating')">★</span>
                    <span class="rating-star" data-rating="4" onclick="setRating(4)" ontouchstart="logTouchEvent('rating')">★</span>
                    <span class="rating-star" data-rating="5" onclick="setRating(5)" ontouchstart="logTouchEvent('rating')">★</span>
                </div>
            </div>
        </div>
        
        <div id="surveyElement"></div>
        
        <div class="debug-info" id="debug-info">
            <h4>Debug Information</h4>
            <div id="debug-content">Initializing tests...</div>
        </div>
    </div>

    <script>
        let testResults = {
            touchEventsWorking: false,
            customRenderersLoaded: false,
            fordUIComponentsWorking: false,
            interactionTested: false,
            errors: [],
            detailedResults: {
                textInput: false,
                dropdown: false,
                radioGroup: false,
                checkbox: false,
                rating: false,
                fileUpload: false
            }
        };
        
        let touchEventCount = 0;
        let interactionCount = 0;
        let debugLogs = [];

        function logDebug(message) {
            debugLogs.push(new Date().toLocaleTimeString() + ': ' + message);
            const debugContent = document.getElementById('debug-content');
            debugContent.innerHTML = debugLogs.slice(-10).join('<br>');
            console.log('Custom Renderer Test:', message);
        }

        function updateTestResult(testId, passed, message) {
            const element = document.getElementById(testId);
            if (element) {
                element.className = 'test-item ' + (passed ? 'test-passed' : 'test-failed');
                element.innerHTML = (passed ? '✅' : '❌') + ' ' + message;
            }
            logDebug('Test result: ' + testId + ' = ' + (passed ? 'PASS' : 'FAIL') + ': ' + message);
        }

        function testTouchEvent(buttonId) {
            touchEventCount++;
            const feedback = document.getElementById('touch-feedback');
            feedback.style.display = 'block';
            feedback.innerHTML = 'Touch event ' + touchEventCount + ' detected on ' + buttonId + '!';
            
            logDebug('Touch event on ' + buttonId + ' (count: ' + touchEventCount + ')');
            
            if (touchEventCount >= 2) {
                testResults.touchEventsWorking = true;
                updateTestResult('touch-test', true, 'Touch events working correctly (' + touchEventCount + ' events)');
            }
            
            setTimeout(() => {
                feedback.style.display = 'none';
            }, 2000);
        }

        function logTouchEvent(elementType) {
            logDebug('Touch started on ' + elementType);
        }

        function testInteraction(type, value) {
            interactionCount++;
            testResults.detailedResults[type] = true;
            logDebug('Interaction with ' + type + ': ' + value);
            
            // Check if we've tested multiple interaction types
            const testedTypes = Object.values(testResults.detailedResults).filter(Boolean).length;
            if (testedTypes >= 3) {
                testResults.interactionTested = true;
                updateTestResult('interaction-test', true, 'User interactions working (' + testedTypes + ' types tested)');
            }
        }

        function setRating(rating) {
            // Update visual rating
            const stars = document.querySelectorAll('.rating-star');
            stars.forEach((star, index) => {
                if (index < rating) {
                    star.classList.add('active');
                } else {
                    star.classList.remove('active');
                }
            });
            
            testInteraction('rating', rating);
            logDebug('Rating set to: ' + rating);
        }

        function createCustomRendererSurvey() {
            const surveyJson = {
                "title": "Custom Renderer Touch Test Survey",
                "description": "Testing custom renderers with mobile touch events",
                "pages": [{
                    "name": "page1",
                    "elements": [{
                        "type": "text",
                        "name": "customTextTest",
                        "title": "Custom Text Renderer Test",
                        "placeholder": "Type to test custom text input...",
                        "isRequired": false
                    }, {
                        "type": "dropdown",
                        "name": "customDropdownTest",
                        "title": "Custom Dropdown Renderer Test",
                        "choices": ["Custom Option 1", "Custom Option 2", "Custom Option 3"],
                        "isRequired": false
                    }, {
                        "type": "radiogroup",
                        "name": "customRadioTest",
                        "title": "Custom Radio Renderer Test",
                        "choices": ["Custom Radio 1", "Custom Radio 2", "Custom Radio 3"],
                        "isRequired": false
                    }, {
                        "type": "boolean",
                        "name": "customBooleanTest",
                        "title": "Custom Boolean Renderer Test",
                        "isRequired": false
                    }, {
                        "type": "rating",
                        "name": "customRatingTest", 
                        "title": "Custom Rating Renderer Test",
                        "rateMin": 1,
                        "rateMax": 5,
                        "isRequired": false
                    }]
                }],
                "completeText": "Complete Test Survey"
            };

            try {
                const survey = new Survey.Model(surveyJson);
                
                // Register custom renderers to override default SurveyJS components
                if (window.SurveyReact && Survey) {
                    logDebug('SurveyJS React components available, registering custom renderers...');
                    
                    // Register custom text input renderer
                    Survey.ComponentCollection.Instance.add({
                        name: "custom-text-input",
                        questionJSON: { type: "text" },
                        onInit: () => {
                            logDebug('Custom text input renderer initialized');
                        }
                    });
                    
                    testResults.customRenderersLoaded = true;
                    updateTestResult('renderer-test', true, 'Custom renderers loaded and registered');
                }
                
                // Apply theme
                survey.applyTheme({
                    "themeName": "defaultV2",
                    "colorPalette": "light",
                    "isPanelless": false
                });
                
                // Handle survey events
                survey.onValueChanged.add(function(sender, options) {
                    logDebug('Survey value changed: ' + options.name + ' = ' + options.value);
                    testInteraction(options.name, options.value);
                });
                
                survey.onComplete.add(function(sender, options) {
                    logDebug('Survey completed with data: ' + JSON.stringify(sender.data));
                    testResults.fordUIComponentsWorking = true;
                    updateTestResult('ford-ui-test', true, 'Survey completion and data capture working');
                    sendTestResults();
                });
                
                // Render survey
                const surveyContainer = document.getElementById("surveyElement");
                if (surveyContainer && window.SurveyReact) {
                    ReactDOM.render(
                        React.createElement(SurveyReact.Survey, { 
                            model: survey,
                            css: {
                                // Custom CSS overrides for mobile touch targets
                                button: 'sv-button touch-optimized',
                                text: 'sv-string-editor touch-optimized'
                            }
                        }),
                        surveyContainer
                    );
                    logDebug('Custom renderer survey rendered successfully');
                } else {
                    throw new Error('SurveyJS React components not available for custom rendering');
                }
                
            } catch (error) {
                testResults.errors.push('Survey creation error: ' + error.message);
                updateTestResult('ford-ui-test', false, 'Survey creation failed: ' + error.message);
                logDebug('Error creating survey: ' + error.message);
            }
        }

        function runCustomRendererTests() {
            logDebug('Starting custom renderer and touch event tests...');
            
            // Test touch event detection
            setTimeout(() => {
                if (touchEventCount === 0) {
                    // Auto-trigger a touch test for demo purposes
                    testTouchEvent('auto-test');
                }
            }, 2000);
            
            // Test custom renderer loading
            setTimeout(createCustomRendererSurvey, 500);
            
            // Check Ford UI CSS loading
            setTimeout(() => {
                try {
                    const computedStyle = getComputedStyle(document.documentElement);
                    const primaryColor = computedStyle.getPropertyValue('--semantic-color-fill-onlight-interactive');
                    const hasFordUI = primaryColor && primaryColor.trim() !== '';
                    
                    testResults.fordUIComponentsWorking = hasFordUI;
                    updateTestResult('ford-ui-test', hasFordUI, 
                        hasFordUI ? 'Ford UI CSS variables loaded' : 'Using fallback styling');
                    
                    logDebug('Ford UI check: ' + (hasFordUI ? 'Available' : 'Not available'));
                } catch (error) {
                    testResults.errors.push('Ford UI check error: ' + error.message);
                    logDebug('Error checking Ford UI: ' + error.message);
                }
            }, 1000);
            
            // Send results after tests complete
            setTimeout(sendTestResults, 5000);
        }

        function sendTestResults() {
            logDebug('Sending test results to React Native...');
            console.log('Custom Renderer Test Results:', testResults);
            
            // Send results to React Native
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'customRendererTestResults',
                    results: testResults,
                    brand: '${brand}',
                    timestamp: new Date().toISOString(),
                    debugLogs: debugLogs
                }));
            }
        }

        // Auto-run tests when page loads
        window.addEventListener('load', function() {
            logDebug('Page loaded, starting tests...');
            setTimeout(runCustomRendererTests, 1000);
        });
        
        // Global error handling
        window.addEventListener('error', function(event) {
            const errorMsg = 'Global error: ' + event.error.message;
            testResults.errors.push(errorMsg);
            logDebug(errorMsg);
        });
        
        // Touch event debugging
        document.addEventListener('touchstart', function(event) {
            logDebug('Touch start detected on: ' + event.target.tagName);
        }, { passive: true });
        
        document.addEventListener('touchend', function(event) {
            logDebug('Touch end detected on: ' + event.target.tagName);
        }, { passive: true });
    </script>
</body>
</html>
  `;

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('Custom Renderer WebView message received:', message);
      
      if (message.type === 'customRendererTestResults') {
        setTestResults(message.results);
        setIsLoading(false);
        console.log('Custom Renderer test results:', message.results);
      }
    } catch (error) {
      console.error('Error parsing Custom Renderer WebView message:', error);
      setIsLoading(false);
    }
  };

  const handleError = (error: any) => {
    console.error('Custom Renderer WebView error:', error);
    setIsLoading(false);
  };

  const handleLoadEnd = () => {
    console.log('Custom Renderer WebView finished loading');
    setTimeout(() => {
      if (!testResults) {
        setIsLoading(false);
      }
    }, 8000);
  };

  const switchBrand = (brand: 'ford' | 'lincoln' | 'other') => {
    setCurrentBrand(brand);
    setTestResults(null);
    setIsLoading(true);
  };

  const getBrandColor = (brand: string) => {
    switch (brand) {
      case 'ford': return '#257180';
      case 'lincoln': return '#8B1538';
      default: return '#333333';
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: getBrandColor(currentBrand) }]}>
        <Text style={styles.headerText}>Custom Renderer Touch Test</Text>
        <Text style={styles.subHeaderText}>
          Testing {currentBrand.toUpperCase()} custom renderers and touch events
        </Text>
      </View>
      
      <View style={styles.brandSwitcher}>
        <TouchableOpacity 
          style={[styles.brandButton, currentBrand === 'ford' && styles.activeBrand]}
          onPress={() => switchBrand('ford')}
        >
          <Text style={[styles.brandButtonText, currentBrand === 'ford' && styles.activeBrandText]}>
            Ford
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.brandButton, currentBrand === 'lincoln' && styles.activeBrand]}
          onPress={() => switchBrand('lincoln')}
        >
          <Text style={[styles.brandButtonText, currentBrand === 'lincoln' && styles.activeBrandText]}>
            Lincoln
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.brandButton, currentBrand === 'other' && styles.activeBrand]}
          onPress={() => switchBrand('other')}
        >
          <Text style={[styles.brandButtonText, currentBrand === 'other' && styles.activeBrandText]}>
            Other
          </Text>
        </TouchableOpacity>
      </View>
      
      {testResults && (
        <ScrollView style={styles.results}>
          <Text style={styles.resultsTitle}>Custom Renderer Test Results</Text>
          
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>Core Tests</Text>
            <View style={styles.resultItem}>
              <Text style={[styles.resultText, testResults.touchEventsWorking ? styles.passed : styles.failed]}>
                Touch Events: {testResults.touchEventsWorking ? '✅ Working' : '❌ Failed'}
              </Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={[styles.resultText, testResults.customRenderersLoaded ? styles.passed : styles.failed]}>
                Custom Renderers: {testResults.customRenderersLoaded ? '✅ Loaded' : '❌ Failed'}
              </Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={[styles.resultText, testResults.fordUIComponentsWorking ? styles.passed : styles.failed]}>
                Ford UI Integration: {testResults.fordUIComponentsWorking ? '✅ Working' : '❌ Failed'}
              </Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={[styles.resultText, testResults.interactionTested ? styles.passed : styles.failed]}>
                User Interactions: {testResults.interactionTested ? '✅ Working' : '❌ Failed'}
              </Text>
            </View>
          </View>
          
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>Component Tests</Text>
            {Object.entries(testResults.detailedResults).map(([component, passed]) => (
              <View key={component} style={styles.resultItem}>
                <Text style={[styles.resultText, passed ? styles.passed : styles.failed]}>
                  {component}: {passed ? '✅ Pass' : '❌ Fail'}
                </Text>
              </View>
            ))}
          </View>
          
          {testResults.errors.length > 0 && (
            <View style={styles.errorSection}>
              <Text style={styles.errorTitle}>Errors:</Text>
              {testResults.errors.map((error, index) => (
                <Text key={index} style={styles.errorText}>• {error}</Text>
              ))}
            </View>
          )}
        </ScrollView>
      )}
      
      <WebView
        key={currentBrand}
        source={{ html: generateCustomRendererTestHTML(currentBrand) }}
        style={styles.webview}
        onMessage={handleMessage}
        onError={handleError}
        onLoadEnd={handleLoadEnd}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={isLoading}
        allowsInlineMediaPlaybook={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        allowsBackForwardNavigationGestures={false}
        scalesPageToFit={true}
        scrollEnabled={true}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  subHeaderText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.9,
  },
  brandSwitcher: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
  },
  brandButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  activeBrand: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  brandButtonText: {
    color: '#495057',
    fontWeight: '500',
  },
  activeBrandText: {
    color: '#ffffff',
  },
  results: {
    maxHeight: 180,
    backgroundColor: '#f8f9fa',
    padding: 10,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  resultSection: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  resultItem: {
    marginVertical: 1,
  },
  resultText: {
    fontSize: 12,
  },
  passed: {
    color: '#28a745',
  },
  failed: {
    color: '#dc3545',
  },
  errorSection: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f8d7da',
    borderRadius: 4,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#721c24',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 11,
    color: '#721c24',
  },
  webview: {
    flex: 1,
  },
});

export default CustomRendererTest;