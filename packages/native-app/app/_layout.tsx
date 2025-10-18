import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import '../src/styles/global.css';
import { ensureSurveyBundle } from '../src/utils/surveyBundleManager';
import { VersionInfoModal } from '../src/components/VersionInfoModal';

function AuthenticatedLayout() {
  const { currentUser, loading, signOut } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [showVersionModal, setShowVersionModal] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  useEffect(() => {
    const inAuthRoute = segments[0] === 'login' || segments[0] === 'forgot-password';

    if (loading) return; // Still loading auth state

    if (!currentUser && !inAuthRoute) {
      // User is not signed in and trying to access protected routes
      router.replace('/login');
    } else if (currentUser && inAuthRoute) {
      // User is signed in and on auth screens, redirect to main
      router.replace('/');
    }
  }, [currentUser, segments, loading]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#257180" />
      </View>
    );
  }

  return (
    <>
      <VersionInfoModal
        visible={showVersionModal}
        onClose={() => setShowVersionModal(false)}
      />
      <Stack>
        <Stack.Screen
          name="login"
          options={{
            title: "Sign In",
            headerShown: false
          }}
        />
      <Stack.Screen 
        name="forgot-password" 
        options={{ 
          title: "Reset Password",
          headerShown: true,
          headerBackTitle: "Back",
          headerTintColor: "#257180",
          headerStyle: {
            backgroundColor: '#F8F9FA',
          }
        }} 
      />
      <Stack.Screen
        name="index"
        options={{
          title: "Meridian Events",
          headerShown: true,
          headerTintColor: "#257180",
          headerStyle: {
            backgroundColor: '#F8F9FA',
          },
          headerTitle: () => (
            <TouchableOpacity onPress={() => setShowVersionModal(true)}>
              <Text style={{
                color: '#257180',
                fontSize: 17,
                fontWeight: '600',
              }}>
                Meridian Events
              </Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSignOut}>
              <Text style={{ color: '#007AFF', fontSize: 17, fontWeight: '400' }}>Sign Out</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen 
        name="event/[id]" 
        options={{ 
          headerShown: true,
          headerBackTitle: "Events",
          headerTintColor: "#257180",
          title: "" // Will be set dynamically
        }} 
      />
      <Stack.Screen 
        name="survey/[id]" 
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen
        name="scan/[id]"
        options={{
          headerShown: false,
        }}
      />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  // Initialize survey bundle on app launch
  useEffect(() => {
    const initSurvey = async () => {
      try {
        await ensureSurveyBundle();
        console.log('[App] Survey bundle initialized at app launch');
      } catch (error) {
        console.error('[App] Failed to initialize survey bundle:', error);
      }
    };

    initSurvey();
  }, []);

  return (
    <AuthProvider>
      <AuthenticatedLayout />
    </AuthProvider>
  );
}
