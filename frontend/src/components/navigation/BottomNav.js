import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

const TABS_LOGGED_OUT = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'saved', label: 'Saved', icon: 'favorite-border' },
  { key: 'listings', label: 'Listings', icon: 'search' },
  { key: 'login', label: 'Sign In', icon: 'login' },
];

const TABS_LOGGED_IN = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'saved', label: 'Saved', icon: 'favorite-border' },
  { key: 'listings', label: 'Listings', icon: 'search' },
  { key: 'inbox', label: 'Inbox', icon: 'mail-outline' },
  { key: 'profile', label: 'Profile', icon: 'person-outline' },
];
const TABS_ADMIN = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'users', label: 'Users', icon: 'people-outline' },
  { key: 'approvals', label: 'Approvals', icon: 'pending-actions' },
];

export default function BottomNav({ activeTab = 'home', onTabPress }) {
  const { user } = useAuth();
  
  let tabs = TABS_LOGGED_OUT;
  if (user) {
    if (user.role === 'admin') {
      // Switch navbar style depending on whether they are in the admin section or regular app
      const isAdminTab = TABS_ADMIN.some(tab => tab.key === activeTab);
      tabs = isAdminTab ? TABS_ADMIN : TABS_LOGGED_IN;
    } else {
      tabs = TABS_LOGGED_IN;
    }
  }

  return (
    <View style={styles.nav}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => onTabPress && onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={isActive && tab.key === 'home' ? 'home' : tab.icon}
              size={24}
              color={isActive ? '#155e75' : '#94a3b8'}
            />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(241,245,249,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  tabItemActive: {
    backgroundColor: '#ecfeff',
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#155e75',
  },
});
