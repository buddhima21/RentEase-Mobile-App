import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Animated, Platform, RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import BottomNav from '../../components/navigation/BottomNav';
import { useAuth } from '../../context/AuthContext';
import {
  getMyNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
} from '../../services/notificationService';

// ── Icon & colour config per notification type ─────────────────────────────
const TYPE_CONFIG = {
  property_submitted: { icon: 'pending',             color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  property_approved:  { icon: 'verified',             color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  property_rejected:  { icon: 'cancel',               color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  booking_received:   { icon: 'mail',                 color: '#006591', bg: 'rgba(0,101,145,0.1)'  },
  booking_approved:   { icon: 'check-circle',         color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  booking_rejected:   { icon: 'do-not-disturb-on',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  booking_removed:    { icon: 'person-remove',        color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  general:            { icon: 'notifications',        color: '#64748b', bg: 'rgba(100,116,139,0.1)'},
};

const getConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.general;

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

// ── Single notification row ────────────────────────────────────────────────
function NotificationItem({ item, onRead, onDelete }) {
  const cfg = getConfig(item.type);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (!item.isRead) onRead(item._id);
  };

  const handleLongPress = () => {
    Alert.alert('Delete Notification', 'Remove this notification?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(item._id) },
    ]);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
        activeOpacity={0.75}
        onPress={handlePress}
        onLongPress={handleLongPress}
      >
        {/* Unread dot */}
        {!item.isRead ? <View style={styles.unreadDot} /> : null}

        {/* Icon */}
        <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
          <MaterialIcons name={cfg.icon} size={22} color={cfg.color} />
        </View>

        {/* Content */}
        <View style={styles.notifContent}>
          <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.notifBody} numberOfLines={3}>{item.body}</Text>
          <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────
export default function InboxScreen({ navigation }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await getMyNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) { /* silent */ }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) { /* silent */ }
  };

  const handleTabPress = (tabKey) => {
    if (tabKey === 'home')     navigation.navigate('Home');
    if (tabKey === 'listings') navigation.navigate('Listings');
    if (tabKey === 'profile')  { /* handled in HomeScreen */ }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleArea}>
          <Text style={styles.headerTitle}>Inbox</Text>
          {unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount} unread</Text>
            </View>
          ) : null}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead} activeOpacity={0.7}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.secondary} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={[Colors.secondary]}
              tintColor={Colors.secondary}
            />
          }
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconRing}>
                <MaterialIcons name="mail-outline" size={44} color={Colors.outlineVariant} />
              </View>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>
                Notifications about your properties, bookings, and approvals will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {notifications.map(item => (
                <NotificationItem
                  key={item._id}
                  item={item}
                  onRead={handleRead}
                  onDelete={handleDelete}
                />
              ))}
              <Text style={styles.hint}>Long-press a notification to delete it</Text>
            </View>
          )}
        </ScrollView>
      )}

      <BottomNav activeTab="inbox" onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197,198,205,0.2)',
    gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitleArea: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  unreadBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  markAllBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: 'rgba(0,101,145,0.1)', borderRadius: 10,
  },
  markAllText: { fontSize: 12, fontWeight: '700', color: Colors.secondary },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  list: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },

  notifCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  notifCardUnread: {
    backgroundColor: 'rgba(0,101,145,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,101,145,0.12)',
  },
  unreadDot: {
    position: 'absolute',
    top: 16, right: 16,
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  notifContent: { flex: 1, gap: 4 },
  notifTitle: {
    fontSize: 14, fontWeight: '600', color: Colors.onSurface, lineHeight: 20,
  },
  notifTitleUnread: { fontWeight: '800', color: Colors.primary },
  notifBody: {
    fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 19,
  },
  notifTime: { fontSize: 11, color: Colors.outline, fontWeight: '500', marginTop: 2 },

  emptyState: {
    alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 14,
  },
  emptyIconRing: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  emptySubtitle: {
    fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 21,
  },
  hint: {
    textAlign: 'center', fontSize: 11, color: Colors.outline, marginTop: 12, marginBottom: 4,
  },
});
