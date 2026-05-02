import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { getUnreadCount } from '../../services/notificationService';
import { useFocusEffect } from '@react-navigation/native';

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
  const [unreadCount, setUnreadCount] = React.useState(0);
  const { favoriteIds } = useFavorites();
  const savedCount = favoriteIds?.size || 0;

  // Fetch unread count whenever this component's screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        getUnreadCount()
          .then(setUnreadCount)
          .catch(() => {});
      }
    }, [user])
  );
  
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
        const isSavedTab = tab.key === 'saved';
        const iconName = isSavedTab && isActive ? 'favorite' : tab.icon;
        const iconColor = isSavedTab && isActive ? '#ef4444' : isActive ? '#155e75' : '#94a3b8';
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => onTabPress && onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <View>
              <MaterialIcons
                name={iconName}
                size={24}
                color={iconColor}
              />
              {tab.key === 'inbox' && unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
              {tab.key === 'saved' && savedCount > 0 && (
                <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
                  <Text style={styles.badgeText}>{savedCount > 9 ? '9+' : savedCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive, isSavedTab && isActive && { color: '#ef4444' }]}>
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
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ba1a1a',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
});
