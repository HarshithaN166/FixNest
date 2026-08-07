import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  style,
  textStyle,
  icon,
  ...props
}) => {
  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = { ...styles.base };

    switch (size) {
      case 'sm':
        base = { ...base, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 };
        break;
      case 'lg':
        base = { ...base, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 14 };
        break;
      case 'md':
      default:
        base = { ...base, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12 };
        break;
    }

    switch (variant) {
      case 'secondary':
        return {
          ...base,
          backgroundColor: Colors.surfaceElevated,
          borderWidth: 1,
          borderColor: Colors.border,
        };
      case 'outline':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: Colors.primary,
        };
      case 'ghost':
        return {
          ...base,
          backgroundColor: 'transparent',
        };
      case 'primary':
      default:
        return {
          ...base,
          backgroundColor: Colors.primary,
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'secondary':
        return { color: Colors.textPrimary, fontWeight: '600', fontSize: 15 };
      case 'outline':
      case 'ghost':
        return { color: Colors.primary, fontWeight: '600', fontSize: 15 };
      case 'primary':
      default:
        return { color: Colors.textPrimary, fontWeight: '700', fontSize: 16 };
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || loading}
      style={[
        getContainerStyle(),
        (disabled || loading) && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.textPrimary} size="small" />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
