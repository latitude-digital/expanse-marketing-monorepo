import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Survey Events",
          headerShown: true,
          headerTintColor: "#0066CC",
          headerStyle: {
            backgroundColor: '#F8F9FA',
          }
        }} 
      />
      <Stack.Screen 
        name="event/[id]" 
        options={{ 
          headerShown: true,
          headerBackTitle: "Events",
          headerTintColor: "#0066CC",
          title: "" // Will be set dynamically
        }} 
      />
      <Stack.Screen 
        name="survey/[id]" 
        options={{ 
          headerShown: false
        }} 
      />
    </Stack>
  );
}