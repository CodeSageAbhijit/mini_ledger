import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { LoginScreen } from '../features/auth/LoginScreen';
import { OtpScreen } from '../features/auth/OtpScreen';
import { ProfileSetupScreen } from '../features/auth/ProfileSetupScreen';
import { HomeScreen } from '../features/loans/HomeScreen';
import { colors } from '../theme/tokens';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { isHydrated, isAuthenticated, user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          statusBarColor: '#FFFFFF',
          navigationBarColor: colors.bg,
          statusBarStyle: 'dark',
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="Otp"
              component={OtpScreen}
              options={{ animation: 'fade_from_bottom' }}
            />
          </>
        ) : !user?.name || !user?.username || !user?.email ? (
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        ) : (
          <Stack.Screen name="Home" component={HomeScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
