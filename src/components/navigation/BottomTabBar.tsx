import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Home, Grid, Sparkles, Calendar, User } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

export type TabType = 'Home' | 'Services' | 'AI' | 'Bookings' | 'Profile';

interface BottomTabBarProps {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabPress }) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode; isAi?: boolean }[] = [
    {
      id: 'Home',
      label: 'Home',
      icon: <Home size={20} color={activeTab === 'Home' ? Colors.primary : Colors.textMuted} />,
    },
    {
      id: 'Services',
      label: 'Services',
      icon: <Grid size={20} color={activeTab === 'Services' ? Colors.primary : Colors.textMuted} />,
    },
    {
      id: 'AI',
      label: 'AI',
      isAi: true,
      icon: <Sparkles size={22} color="#FFFFFF" />,
    },
    {
      id: 'Bookings',
      label: 'Bookings',
      icon: <Calendar size={20} color={activeTab === 'Bookings' ? Colors.primary : Colors.textMuted} />,
    },
    {
      id: 'Profile',
      label: 'Profile',
      icon: <User size={20} color={activeTab === 'Profile' ? Colors.primary : Colors.textMuted} />,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          if (tab.isAi) {
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.aiTabButton}
                onPress={() => onTabPress(tab.id)}
                activeOpacity={0.8}
              >
                <View style={styles.aiBadge}>
                  {tab.icon}
                </View>
                <Text style={[styles.tabLabel, { color: Colors.primary, fontWeight: '700' }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabButton}
              onPress={() => onTabPress(tab.id)}
              activeOpacity={0.7}
            >
              {isActive && <View style={styles.activeIndicator} />}
              <View style={styles.iconContainer}>{tab.icon}</View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.activeTabLabel,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(18, 18, 22, 0.95)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: 66,
    paddingHorizontal: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 4,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  iconContainer: {
    marginBottom: 3,
    marginTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  activeTabLabel: {
    color: Colors.primary,
    fontWeight: '700',
  },
  aiTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
  },
  aiBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 2,
  },
});
