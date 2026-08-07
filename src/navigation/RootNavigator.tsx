import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { RootStackParamList } from './types';
import { SplashScreen } from '../screens/SplashScreen';
import { ChooseRoleScreen } from '../screens/ChooseRoleScreen';
import { MainNavigator } from './MainNavigator';
import { AuthNavigator } from './AuthNavigator';
import { ProfessionalNavigator } from './ProfessionalNavigator';
import { useAuth } from '../hooks/useAuth';
import { useProfessional } from '../context/ProfessionalContext';
import { navigationRef } from './NavigationService';
import { Colors } from '../constants/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Module-level flag — splash only plays on the very first mount of the entire app.
 * When the NavigationContainer remounts due to a role key change, RootNavigator
 * remounts too, but we skip the splash so role transitions are instant.
 */
let _splashPlayed = false;

export const RootNavigator: React.FC = () => {
  const [showSplash, setShowSplash] = useState(!_splashPlayed);
  const { isLoading, isAuthenticated } = useAuth();
  const { role, isRoleLoading } = useProfessional();

  if (showSplash) {
    return (
      <SplashScreen
        onFinish={() => {
          _splashPlayed = true;
          setShowSplash(false);
        }}
      />
    );
  }

  // Wait for role to be restored from storage
  if (isRoleLoading || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Determine which root screen to show based on role + auth state
  const resolveInitialRoute = (): keyof RootStackParamList => {
    if (!role) return 'ChooseRole';
    if (role === 'professional') return 'ProfessionalMain';
    // role === 'user'
    return isAuthenticated ? 'Main' : 'Auth';
  };

  return (
    <Stack.Navigator
      initialRouteName={resolveInitialRoute()}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'fade',
      }}
    >
      {/* No role chosen yet — show role selector */}
      <Stack.Screen name="ChooseRole">
        {() => (
          <ChooseRoleScreen
            onChooseUser={() => {
              /**
               * ChooseRoleScreen calls setRole('user') before this callback.
               * Two cases:
               *
               * A) Role CHANGED (e.g. professional → user):
               *    NavigationRoot re-keys the NavigationContainer → it remounts fresh
               *    and resolveInitialRoute() returns 'Main'/'Auth' automatically.
               *    The dispatch below is harmless (fires on the old container).
               *
               * B) Role SAME (e.g. user→user, after logout flow):
               *    No key change → NavigationContainer stays mounted.
               *    We must explicitly navigate to Auth or Main.
               */
              if (navigationRef.isReady()) {
                navigationRef.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: isAuthenticated ? 'Main' : 'Auth' }],
                  }),
                );
              }
            }}
            onChooseProfessional={() => {
              /**
               * A) Role CHANGED (e.g. user → professional):
               *    NavigationContainer remounts and starts at ProfessionalMain.
               *
               * B) Role SAME (e.g. pro→pro, after exit-pro flow):
               *    NavigationContainer stays mounted → we dispatch to ProfessionalMain.
               */
              if (navigationRef.isReady()) {
                navigationRef.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'ProfessionalMain' }],
                  }),
                );
              }
            }}
          />
        )}
      </Stack.Screen>

      {/* Professional role */}
      <Stack.Screen name="ProfessionalMain" component={ProfessionalNavigator} />

      {/* User role — auth screen or home depending on saved session */}
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="Main" component={MainNavigator} />
    </Stack.Navigator>
  );
};
