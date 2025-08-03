import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

const TestWebView: React.FC = () => {
  // Basic SurveyJS HTML with simple form
  const surveyHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SurveyJS Test</title>
    
    <!-- SurveyJS Core -->
    <script src="https://unpkg.com/survey-core@1.12.12/survey.core.min.js"></script>
    
    <!-- SurveyJS React UI -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/survey-react-ui@1.12.12/survey-react-ui.min.js"></script>
    
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
        }
        
        .survey-container {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        h1 {
            color: #333;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .test-info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            border-left: 4px solid #2196f3;
        }
    </style>
</head>
<body>
    <div class="survey-container">
        <h1>SurveyJS WebView Test</h1>
        
        <div class="test-info">
            <strong>Test Status:</strong> WebView successfully loaded SurveyJS<br>
            <strong>Environment:</strong> React Native WebView<br>
            <strong>SurveyJS Version:</strong> 1.12.12
        </div>
        
        <div id="surveyElement"></div>
        
        <div id="results" style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 4px; display: none;">
            <h3>Survey Results:</h3>
            <pre id="resultsJson"></pre>
        </div>
    </div>

    <script>
        // Simple test survey JSON
        const surveyJson = {
            "title": "WebView Compatibility Test",
            "description": "Testing SurveyJS integration in React Native WebView",
            "pages": [{
                "name": "page1",
                "elements": [{
                    "type": "text",
                    "name": "firstName",
                    "title": "First Name",
                    "isRequired": true,
                    "placeholder": "Enter your first name"
                }, {
                    "type": "text", 
                    "name": "lastName",
                    "title": "Last Name",
                    "isRequired": true,
                    "placeholder": "Enter your last name"
                }, {
                    "type": "dropdown",
                    "name": "favoriteColor",
                    "title": "Favorite Color",
                    "choices": [
                        { "value": "red", "text": "Red" },
                        { "value": "blue", "text": "Blue" },
                        { "value": "green", "text": "Green" },
                        { "value": "yellow", "text": "Yellow" }
                    ]
                }, {
                    "type": "rating",
                    "name": "webviewExperience",
                    "title": "How is your WebView experience?",
                    "rateMin": 1,
                    "rateMax": 5,
                    "rateStep": 1,
                    "minRateDescription": "Poor",
                    "maxRateDescription": "Excellent"
                }]
            }],
            "completeText": "Complete Test",
            "showQuestionNumbers": "on"
        };

        // Create SurveyJS model
        const survey = new Survey.Model(surveyJson);
        
        // Handle survey completion
        survey.onComplete.add(function(sender, options) {
            const results = sender.data;
            console.log('Survey completed:', results);
            
            // Show results on page
            document.getElementById('results').style.display = 'block';
            document.getElementById('resultsJson').textContent = JSON.stringify(results, null, 2);
            
            // Send data to React Native (if bridge is set up)
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'surveyComplete',
                    data: results
                }));
            }
        });
        
        // Apply default theme
        survey.applyTheme({
            "themeName": "defaultV2",
            "colorPalette": "light",
            "isPanelless": false
        });
        
        // Render survey
        function renderSurvey() {
            try {
                const surveyContainer = document.getElementById("surveyElement");
                if (surveyContainer && window.SurveyReact) {
                    ReactDOM.render(
                        React.createElement(SurveyReact.Survey, { model: survey }),
                        surveyContainer
                    );
                    console.log('Survey rendered successfully');
                } else {
                    console.error('SurveyJS React components not loaded');
                    document.getElementById("surveyElement").innerHTML = 
                        '<p style="color: red;">Error: SurveyJS React components failed to load</p>';
                }
            } catch (error) {
                console.error('Survey rendering error:', error);
                document.getElementById("surveyElement").innerHTML = 
                    '<p style="color: red;">Error rendering survey: ' + error.message + '</p>';
            }
        }
        
        // Wait for all scripts to load
        window.addEventListener('load', function() {
            setTimeout(renderSurvey, 100);
        });
        
        // Fallback if libraries don't load
        setTimeout(function() {
            if (!document.querySelector('.sv-root')) {
                document.getElementById("surveyElement").innerHTML = 
                    '<p style="color: orange;">Loading SurveyJS components...</p>';
                setTimeout(renderSurvey, 1000);
            }
        }, 2000);
    </script>
</body>
</html>
  `;

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('WebView message received:', message);
      
      if (message.type === 'surveyComplete') {
        console.log('Survey completed with data:', message.data);
        // Here we could save to SQLite, send to API, etc.
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const handleError = (error: any) => {
    console.error('WebView error:', error);
  };

  const handleLoadEnd = () => {
    console.log('WebView finished loading');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>SurveyJS WebView Test</Text>
        <Text style={styles.subHeaderText}>
          Testing React Native WebView compatibility with SurveyJS v1.12.12
        </Text>
      </View>
      
      <WebView
        source={{ html: surveyHTML }}
        style={styles.webview}
        onMessage={handleMessage}
        onError={handleError}
        onLoadEnd={handleLoadEnd}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        allowsBackForwardNavigationGestures={false}
        scalesPageToFit={true}
        scrollEnabled={true}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
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
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  subHeaderText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 4,
  },
  webview: {
    flex: 1,
    width: width,
    height: height - 100, // Account for header
  },
});

export default TestWebView;