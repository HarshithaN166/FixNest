import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Home, Briefcase, MessageSquare, User } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

export type ProTabType = 'Home' | 'Jobs' | 'Messages' | 'Profile';

interface ProfessionalBottomTabBarProps {
  activeTab: ProTabType;
  onTabPress: (tab: ProTabType) => void;
  unreadMessages?: number;
}

export const ProfessionalBottomTabBar: React.FC<ProfessionalBottomTabBarProps> = ({
  activeTab,
  onTabPress,
  unreadMessages = 0,
}) => {
  const PURPLE = '#A855F7';

  const tabs: { id: ProTabType; label: string; icon: (active: boolean) => React.ReactNode }[] = [
    {
      id: 'Home',
      label: 'Home',
      icon: (a) => <Home size={22} color={a ? PURPLE : Colors.textMuted} />,
    },
    {
      id: 'Jobs',
      label: 'Jobs',
      icon: (a) => <Briefcase size={22} color={a ? PURPLE : Colors.textMuted} />,
    },
    {
      id: 'Messages',
      label: 'Messages',
      icon: (a) => <MessageSquare size={22} color={a ? PURPLE : Colors.textMuted} />,
    },
    {
      id: 'Profile',
      label: 'Profile',
      icon: (a) => <User size={22} color={a ? PURPLE : Colors.textMuted} />,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const hasBadge = tab.id === 'Messages' && unreadMessages > 0;

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabButton}
              onPress={() => onTabPress(tab.id)}
              activeOpacity={0.7}
            >
              {isActive && <View style={styles.activeIndicator} />}
              <View style={styles.iconWrap}>
                {tab.icon(isActive)}
                {hasBadge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.label, isActive && styles.activeLabel]}>
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
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(18,18,22,0.97)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.15)',
    height: 66,
    paddingHorizontal: 8,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
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
    backgroundColor: '#A855F7',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  iconWrap: {
    position: 'relative',
    marginBottom: 3,
    marginTop: 6,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  activeLabel: {
    color: '#A855F7',
    fontWeight: '700',
  },
});
