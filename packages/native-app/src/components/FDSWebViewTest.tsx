import React, { useState } from 'react';
import { StyleSheet, View, Text, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { environment, getSurveyWebViewUrl } from '../config/environment';

const { width, height } = Dimensions.get('window');

interface FDSTestResults {
  cssLoaded: boolean;
  fontsLoaded: boolean;
  customRenderersWorking: boolean;
  themeApplied: boolean;
  errors: string[];
}

const FDSWebViewTest: React.FC = () => {
  const [testResults, setTestResults] = useState<FDSTestResults | null>(null);
  const [currentBrand, setCurrentBrand] = useState<'ford' | 'lincoln' | 'other'>('ford');
  const [isLoading, setIsLoading] = useState(true);

  // Generate Ford Design System test HTML with CSS loading validation
  const generateFDSTestHTML = (brand: 'ford' | 'lincoln' | 'other') => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ford Design System WebView Test</title>
    
    <!-- SurveyJS Core (v2 for modern features) -->
    <script src="https://unpkg.com/survey-core@2.0.0/survey.core.min.js"></script>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/survey-react-ui@2.0.0/survey-react-ui.min.js"></script>
    
    <!-- Try to load Ford Design System CSS from web-app -->
    <link rel="stylesheet" href="${environment.webAppUrl}/src/styles/${brand}/${brand}.css" id="brand-css">
    <link rel="stylesheet" href="${environment.webAppUrl}/src/styles/${brand}/${brand}-font-families.css" id="font-css">
    <link rel="stylesheet" href="${environment.webAppUrl}/src/index.scss" id="main-css">
    
    <!-- Fallback CSS for testing if FDS doesn't load -->
    <style id="fallback-css">
        /* Test brand colors to verify CSS loading */
        :root {
            --test-primary-color: ${brand === 'ford' ? '#257180' : brand === 'lincoln' ? '#8B1538' : '#333333'};
            --test-font-family: ${brand === 'ford' ? '"FordF1", Arial, sans-serif' : brand === 'lincoln' ? '"LincolnFont", Georgia, serif' : 'Arial, sans-serif'};
        }
        
        body {
            margin: 0;
            padding: 20px;
            font-family: var(--test-font-family);
            background-color: #f5f5f5;
            line-height: 1.6;
        }
        
        .${brand}_light {
            background: white;
            color: #333;
        }
        
        .test-container {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            max-width: 800px;
            margin: 0 auto;
        }
        
        .brand-header {
            background: var(--test-primary-color);
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
            border-left: 4px solid var(--test-primary-color);
            background: #f8f9fa;
        }
        
        .test-item {
            margin: 10px 0;
            padding: 8px;
            border-radius: 4px;
        }
        
        .test-passed {
            background: #d4edda;
            color: #155724;
            border-left: 4px solid #28a745;
        }
        
        .test-failed {
            background: #f8d7da;
            color: #721c24;
            border-left: 4px solid #dc3545;
        }
        
        /* Ford Design System test classes */
        .ford-button-test {
            background: var(--semantic-color-fill-onlight-interactive, var(--test-primary-color));
            color: var(--semantic-color-text-onlight-interactive, white);
            padding: 12px 24px;
            border: none;
            border-radius: var(--semantic-radius-interactive, 4px);
            font-family: var(--font-button-font-family, var(--test-font-family));
            cursor: pointer;
            margin: 10px 5px;
        }
        
        .typography-test {
            font-family: var(--font-body-1-regular-font-family, var(--test-font-family));
            font-size: var(--font-body-1-regular-font-size, 16px);
            line-height: var(--font-body-1-regular-line-height, 1.5);
        }
        
        #surveyElement {
            margin-top: 20px;
        }
        
        /* SurveyJS theme overrides for FDS integration */
        .sv-root {
            font-family: var(--test-font-family) !important;
        }
        
        .sv-string-viewer {
            color: var(--semantic-color-text-onlight-moderate-default, #333);
        }
        
        .sv-button {
            background: var(--semantic-color-fill-onlight-interactive, var(--test-primary-color)) !important;
            border-color: var(--semantic-color-fill-onlight-interactive, var(--test-primary-color)) !important;
        }
    </style>
</head>
<body>
    <div class="${brand}_light">
        <div class="test-container">
            <div class="brand-header">
                ${brand.toUpperCase()} Design System WebView Test
            </div>
            
            <div class="test-results" id="test-results">
                <h3>Ford Design System Loading Tests</h3>
                <div id="css-test" class="test-item">⏳ Testing CSS loading...</div>
                <div id="font-test" class="test-item">⏳ Testing font loading...</div>
                <div id="variables-test" class="test-item">⏳ Testing CSS variables...</div>
                <div id="surveyjs-test" class="test-item">⏳ Testing SurveyJS integration...</div>
            </div>
            
            <div class="typography-test">
                <h3>Typography Test</h3>
                <p>This text should display in the ${brand} brand font family.</p>
                <button class="ford-button-test" onclick="runTests()">
                    Run Design System Tests
                </button>
            </div>
            
            <div id="surveyElement"></div>
            
            <div id="debug-info" style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 4px; font-family: monospace; font-size: 12px;">
                <h4>Debug Information</h4>
                <div id="debug-content"></div>
            </div>
        </div>
    </div>

    <script>
        let testResults = {
            cssLoaded: false,
            fontsLoaded: false,
            customRenderersWorking: false,
            themeApplied: false,
            errors: []
        };

        function updateTestResult(testId, passed, message) {
            const element = document.getElementById(testId);
            if (element) {
                element.className = 'test-item ' + (passed ? 'test-passed' : 'test-failed');
                element.innerHTML = (passed ? '✅' : '❌') + ' ' + message;
            }
        }

        function checkCSSLoading() {
            const brandCss = document.getElementById('brand-css');
            const fontCss = document.getElementById('font-css');
            
            try {
                // Check if CSS variables are available
                const computedStyle = getComputedStyle(document.documentElement);
                const primaryColor = computedStyle.getPropertyValue('--semantic-color-fill-onlight-interactive');
                const fontFamily = computedStyle.getPropertyValue('--font-body-1-regular-font-family');
                
                const cssLoaded = primaryColor && primaryColor.trim() !== '';
                const fontsLoaded = fontFamily && fontFamily.trim() !== '';
                
                testResults.cssLoaded = cssLoaded;
                testResults.fontsLoaded = fontsLoaded;
                
                updateTestResult('css-test', cssLoaded, 
                    cssLoaded ? 'Ford Design System CSS loaded successfully' : 'FDS CSS failed to load, using fallback');
                
                updateTestResult('font-test', fontsLoaded,
                    fontsLoaded ? 'Brand fonts loaded successfully' : 'Brand fonts failed to load, using fallback');
                
                updateTestResult('variables-test', cssLoaded && fontsLoaded,
                    'CSS Variables: ' + (cssLoaded ? 'Available' : 'Missing') + 
                    ', Fonts: ' + (fontsLoaded ? 'Available' : 'Missing'));
                
                // Log debug information
                const debugContent = document.getElementById('debug-content');
                debugContent.innerHTML = 
                    'Primary Color: ' + (primaryColor || 'Not found') + '<br>' +
                    'Font Family: ' + (fontFamily || 'Not found') + '<br>' +
                    'Brand CSS URL: ' + brandCss.href + '<br>' +
                    'Font CSS URL: ' + fontCss.href + '<br>' +
                    'CSS Loaded: ' + cssLoaded + '<br>' +
                    'Fonts Loaded: ' + fontsLoaded;
                    
            } catch (error) {
                testResults.errors.push('CSS loading test error: ' + error.message);
                updateTestResult('css-test', false, 'CSS loading test failed: ' + error.message);
                updateTestResult('font-test', false, 'Font loading test failed');
                updateTestResult('variables-test', false, 'CSS variables test failed');
            }
        }

        function createSurvey() {
            const surveyJson = {
                "title": "Ford Design System Integration Test",
                "description": "Testing SurveyJS with Ford Design System styling",
                "pages": [{
                    "name": "page1",
                    "elements": [{
                        "type": "text",
                        "name": "testInput",
                        "title": "Test Input Field",
                        "placeholder": "This should be styled with FDS",
                        "isRequired": true
                    }, {
                        "type": "dropdown",
                        "name": "testDropdown",
                        "title": "Test Dropdown",
                        "choices": ["Option 1", "Option 2", "Option 3"]
                    }, {
                        "type": "radiogroup",
                        "name": "testRadio",
                        "title": "Test Radio Group",
                        "choices": ["Choice A", "Choice B", "Choice C"]
                    }]
                }]
            };

            try {
                const survey = new Survey.Model(surveyJson);
                
                // Apply theme to match current brand
                const themeJson = {
                    "themeName": "defaultV2",
                    "colorPalette": "light",
                    "isPanelless": false,
                    "cssVariables": {
                        "--sjs-primary-color": "var(--semantic-color-fill-onlight-interactive, ${testResults?.cssLoaded ? 'inherit' : 'var(--test-primary-color)'})",
                        "--sjs-font-family": "var(--font-body-1-regular-font-family, var(--test-font-family))"
                    }
                };
                
                survey.applyTheme(themeJson);
                testResults.themeApplied = true;
                
                survey.onComplete.add(function(sender, options) {
                    testResults.customRenderersWorking = true;
                    updateTestResult('surveyjs-test', true, 'SurveyJS integration working correctly');
                    sendTestResults();
                });
                
                // Render survey
                const surveyContainer = document.getElementById("surveyElement");
                if (surveyContainer && window.SurveyReact) {
                    ReactDOM.render(
                        React.createElement(SurveyReact.Survey, { model: survey }),
                        surveyContainer
                    );
                    updateTestResult('surveyjs-test', true, 'SurveyJS rendered with FDS styling');
                } else {
                    throw new Error('SurveyJS React components not available');
                }
                
            } catch (error) {
                testResults.errors.push('Survey creation error: ' + error.message);
                updateTestResult('surveyjs-test', false, 'SurveyJS integration failed: ' + error.message);
            }
        }

        function runTests() {
            console.log('Running Ford Design System WebView tests...');
            
            // Reset test results
            testResults = {
                cssLoaded: false,
                fontsLoaded: false,
                customRenderersWorking: false,
                themeApplied: false,
                errors: []
            };
            
            // Run tests sequentially
            setTimeout(checkCSSLoading, 100);
            setTimeout(createSurvey, 500);
            setTimeout(sendTestResults, 2000);
        }

        function sendTestResults() {
            console.log('Ford Design System test results:', testResults);
            
            // Send results to React Native
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'fdsTestResults',
                    results: testResults,
                    brand: '${brand}',
                    timestamp: new Date().toISOString()
                }));
            }
        }

        // Auto-run tests when page loads
        window.addEventListener('load', function() {
            setTimeout(runTests, 1000);
        });
        
        // Fallback error handling
        window.addEventListener('error', function(event) {
            testResults.errors.push('Global error: ' + event.error.message);
            console.error('Ford Design System test error:', event.error);
        });
    </script>
</body>
</html>
  `;

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('FDS WebView message received:', message);
      
      if (message.type === 'fdsTestResults') {
        setTestResults(message.results);
        setIsLoading(false);
        console.log('Ford Design System test results:', message.results);
      }
    } catch (error) {
      console.error('Error parsing FDS WebView message:', error);
      setIsLoading(false);
    }
  };

  const handleError = (error: any) => {
    console.error('FDS WebView error:', error);
    setIsLoading(false);
  };

  const handleLoadEnd = () => {
    console.log('FDS WebView finished loading');
    // Keep loading state for a bit to wait for test results
    setTimeout(() => {
      if (!testResults) {
        setIsLoading(false);
      }
    }, 5000);
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
        <Text style={styles.headerText}>Ford Design System WebView Test</Text>
        <Text style={styles.subHeaderText}>
          Testing {currentBrand.toUpperCase()} brand CSS and font loading in WebView
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
          <Text style={styles.resultsTitle}>Test Results for {currentBrand.toUpperCase()}</Text>
          <View style={styles.resultItem}>
            <Text style={[styles.resultText, testResults.cssLoaded ? styles.passed : styles.failed]}>
              CSS Loaded: {testResults.cssLoaded ? '✅ Pass' : '❌ Fail'}
            </Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={[styles.resultText, testResults.fontsLoaded ? styles.passed : styles.failed]}>
              Fonts Loaded: {testResults.fontsLoaded ? '✅ Pass' : '❌ Fail'}
            </Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={[styles.resultText, testResults.themeApplied ? styles.passed : styles.failed]}>
              Theme Applied: {testResults.themeApplied ? '✅ Pass' : '❌ Fail'}
            </Text>
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
        key={currentBrand} // Force re-render when brand changes
        source={{ html: generateFDSTestHTML(currentBrand) }}
        style={styles.webview}
        onMessage={handleMessage}
        onError={handleError}
        onLoadEnd={handleLoadEnd}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={isLoading}
        allowsInlineMediaPlayback={true}
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
    maxHeight: 120,
    backgroundColor: '#f8f9fa',
    padding: 10,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  resultItem: {
    marginVertical: 2,
  },
  resultText: {
    fontSize: 14,
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
    fontSize: 12,
    color: '#721c24',
  },
  webview: {
    flex: 1,
  },
});

export default FDSWebViewTest;