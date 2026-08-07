import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { ProfessionalHomeScreen } from '../screens/professional/ProfessionalHomeScreen';

type ProfessionalStackParamList = {
  ProfessionalHome: undefined;
};

const Stack = createNativeStackNavigator<ProfessionalStackParamList>();

export const ProfessionalNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="ProfessionalHome" component={ProfessionalHomeScreen} />
    </Stack.Navigator>
  );
};
