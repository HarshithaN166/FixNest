import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Colors } from '../../constants/colors';

interface CardProps extends ViewProps {
  style?: ViewStyle;
  variant?: 'flat' | 'elevated' | 'bordered';
  onPress?: () => void;
  activeOpacity?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'elevated',
  onPress,
  activeOpacity = 0.85,
}) => {
  const getCardStyle = (): ViewStyle => {
    switch (variant) {
      case 'flat':
        return { backgroundColor: Colors.surface };
      case 'bordered':
        return {
          backgroundColor: Colors.surfaceCard,
          borderWidth: 1,
          borderColor: Colors.borderLight,
        };
      case 'elevated':
      default:
        return {
          backgroundColor: Colors.surfaceCard,
          borderWidth: 1,
          borderColor: Colors.border,
        };
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onPress}
        style={[styles.card, getCardStyle(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, getCardStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 18,
    width: '100%',
  },
});
