import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * File Upload Test Component
 * Tests WebView file upload functionality including camera access and file picker
 * Note: Full file upload testing requires physical device and camera permissions
 */
const FileUploadTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);

  const fileUploadTestHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File Upload Test</title>
    <style>
        body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
        .test-container { background: white; padding: 20px; border-radius: 8px; }
        .file-input { margin: 15px 0; padding: 12px; border: 2px dashed #ccc; border-radius: 4px; }
        .upload-status { margin: 10px 0; padding: 10px; border-radius: 4px; background: #f0f0f0; }
    </style>
</head>
<body>
    <div class="test-container">
        <h1>File Upload WebView Test</h1>
        
        <div class="file-input">
            <label for="camera-upload">Camera Upload:</label>
            <input type="file" id="camera-upload" accept="image/*" capture="camera" onchange="handleFileSelect(this, 'camera')">
        </div>
        
        <div class="file-input">
            <label for="gallery-upload">Gallery Upload:</label>
            <input type="file" id="gallery-upload" accept="image/*" onchange="handleFileSelect(this, 'gallery')">
        </div>
        
        <div class="file-input">
            <label for="document-upload">Document Upload:</label>
            <input type="file" id="document-upload" accept=".pdf,.doc,.docx" onchange="handleFileSelect(this, 'document')">
        </div>
        
        <div id="upload-status" class="upload-status">
            Ready to test file uploads...
        </div>
    </div>

    <script>
        function handleFileSelect(input, type) {
            const status = document.getElementById('upload-status');
            
            if (input.files && input.files.length > 0) {
                const file = input.files[0];
                status.innerHTML = '✅ File selected: ' + file.name + ' (' + type + ')';
                
                // Send result to React Native
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'fileUploadTest',
                        success: true,
                        fileType: type,
                        fileName: file.name,
                        fileSize: file.size
                    }));
                }
            } else {
                status.innerHTML = '❌ No file selected (' + type + ')';
                
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'fileUploadTest',
                        success: false,
                        fileType: type,
                        error: 'No file selected'
                    }));
                }
            }
        }
        
        // Test file input availability
        window.addEventListener('load', function() {
            const hasFileAPI = !!(window.File && window.FileReader && window.FileList && window.Blob);
            
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'fileUploadTestInit',
                    hasFileAPI: hasFileAPI,
                    userAgent: navigator.userAgent
                }));
            }
        });
    </script>
</body>
</html>
  `;

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('File Upload WebView message:', message);
      setTestResults(message);
    } catch (error) {
      console.error('Error parsing File Upload WebView message:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>File Upload Test</Text>
        <Text style={styles.subHeaderText}>
          Testing WebView file upload capabilities (camera, gallery, documents)
        </Text>
      </View>
      
      {testResults && (
        <View style={styles.results}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          <Text style={styles.resultText}>
            {JSON.stringify(testResults, null, 2)}
          </Text>
        </View>
      )}
      
      <WebView
        source={{ html: fileUploadTestHTML }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        originWhitelist={['*']}
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
  results: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    maxHeight: 100,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  webview: {
    flex: 1,
  },
});

export default FileUploadTest;