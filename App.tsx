import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ProfessionalProvider, useProfessional } from './src/context/ProfessionalContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/NavigationService';
import { Colors } from './src/constants/colors';

const FixNestDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.border,
    primary: Colors.primary,
  },
};

/**
 * NavigationRoot reads `role` from context and keys the NavigationContainer on it.
 * When role changes (e.g. professional → null → user), React fully unmounts
 * the old NavigationContainer and mounts a fresh one, so RootNavigator always
 * resolves the correct initial screen from scratch.
 *
 * The navigationRef is attached so NavigationService can also dispatch
 * imperative actions (resetToChooseRole) when needed as a belt-and-suspenders.
 */
const NavigationRoot: React.FC = () => {
  const { role } = useProfessional();
  return (
    <NavigationContainer
      key={role ?? 'no-role'}
      ref={navigationRef}
      theme={FixNestDarkTheme}
    >
      <StatusBar style="light" />
      <RootNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ProfessionalProvider>
        <NotificationProvider>
          <NavigationRoot />
        </NotificationProvider>
      </ProfessionalProvider>
    </AuthProvider>
  );
}
