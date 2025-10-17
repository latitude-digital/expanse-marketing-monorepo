import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useDebounceNavigation } from '../hooks/useDebounceNavigation';
import MeridianLogo from '../../assets/meridian-logo.svg';

const { width: screenWidth } = Dimensions.get('window');

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { navigate } = useDebounceNavigation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      // Navigation will be handled by auth state change
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center items-center px-6 py-12">
          {/* Logo Section */}
          <View className="mb-8 items-center">
            <MeridianLogo 
              width={Math.min(screenWidth * 0.7, 300)} 
              height={80}
              preserveAspectRatio="xMidYMid meet"
            />
            <Text className="text-base text-center text-gray-600 mt-4">
              Sign in to continue
            </Text>
          </View>

          {/* Form Section - Mobile width constrained */}
          <View className="w-full" style={{ maxWidth: Math.min(screenWidth * 0.9, 400) }}>
            {/* Email Field */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-900 mb-2">
                Email address
              </Text>
              <Controller
                control={control}
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`w-full px-3 py-3 border rounded-lg text-base ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    } ${isLoading ? 'bg-gray-50 text-gray-500' : 'bg-white text-gray-900'}`}
                    placeholder="Enter your email"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    editable={!isLoading}
                    autoFocus={true}
                  />
                )}
                name="email"
              />
              {errors.email && (
                <Text className="mt-1 text-sm text-red-600">{errors.email.message}</Text>
              )}
            </View>

            {/* Password Field */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-900 mb-2">
                Password
              </Text>
              <Controller
                control={control}
                rules={{
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`w-full px-3 py-3 border rounded-lg text-base ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    } ${isLoading ? 'bg-gray-50 text-gray-500' : 'bg-white text-gray-900'}`}
                    placeholder="Enter your password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry
                    editable={!isLoading}
                  />
                )}
                name="password"
              />
              {errors.password && (
                <Text className="mt-1 text-sm text-red-600">{errors.password.message}</Text>
              )}
            </View>

            {/* Forgot Password Link with more spacing */}
            <View className="flex-row justify-end mb-6">
              <Pressable
                disabled={isLoading}
                onPress={() => navigate('/forgot-password')}
              >
                <Text className="text-sm font-semibold text-meridian-primary">
                  Forgot password?
                </Text>
              </Pressable>
            </View>

            {/* Submit Button with more spacing */}
            <Pressable
              className={`w-full py-3 rounded-lg ${
                isLoading
                  ? 'bg-gray-300'
                  : 'bg-meridian-primary active:bg-meridian-primary-dark'
              }`}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-center text-white font-semibold text-base">
                  Sign In
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}