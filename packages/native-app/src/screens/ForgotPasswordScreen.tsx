import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { sendPasswordReset } = useAuth();
  const router = useRouter();
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await sendPasswordReset(data.email);
      setEmailSent(true);
      // Show generic success message that doesn't reveal if email exists
      Alert.alert(
        'Email Sent',
        'If an account with that email address exists, you will receive a password reset email shortly. Please check your inbox and spam folder.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      // Generic error message for security
      Alert.alert(
        'Error',
        'Unable to process your request at this time. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
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
        <View className="flex-1 justify-center px-6 py-12">
          {/* Title Section */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-center text-ford-blue mb-4">
              Reset Password
            </Text>
            <Text className="text-base text-center text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </Text>
          </View>

          {/* Form Section */}
          <View className="space-y-6">
            {/* Email Field */}
            <View>
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
                    placeholder="Enter your email address"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    editable={!isLoading}
                  />
                )}
                name="email"
              />
              {errors.email && (
                <Text className="mt-1 text-sm text-red-600">{errors.email.message}</Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className={`w-full py-3 rounded-lg ${
                isLoading
                  ? 'bg-gray-300'
                  : 'bg-ford-light-blue active:bg-ford-blue'
              }`}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading || emailSent}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-center text-white font-semibold text-base">
                  {emailSent ? 'Email Sent' : 'Send Reset Email'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to Login Link */}
            <TouchableOpacity
              onPress={handleBackToLogin}
              disabled={isLoading}
              className="mt-4"
            >
              <Text className="text-center text-sm font-semibold text-ford-light-blue">
                ← Back to sign in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}