import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { getMyMaintenanceRequests } from '../../services/maintenanceService';

const getStatusStyle = (status) => {
  switch (status) {
    case 'SUBMITTED':
      return { label: 'Submitted', bg: '#e0f2fe', text: '#0284c7', icon: 'schedule' };
    case 'ACTION_SCHEDULED':
      return { label: 'Scheduled', bg: '#fef08a', text: '#854d0e', icon: 'event' };
    case 'AWAITING_PARTS':
      return { label: 'Awaiting Parts', bg: '#fed7aa', text: '#c2410c', icon: 'build' };
    case 'RESOLVED':
      return { label: 'Resolved', bg: '#dcfce7', text: '#166534', icon: 'check-circle' };
    case 'CLOSED':
      return { label: 'Closed', bg: '#f1f5f9', text: '#475569', icon: 'done-all' };
    default:
      return { label: status, bg: '#f1f5f9', text: '#475569', icon: 'info' };
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function RequestCard({ request, onPress }) {
  const statusStyle = getStatusStyle(request.status);
  const property = request.property || {};

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={styles.categoryRow}>
          <MaterialIcons name="build" size={16} color={Colors.secondary} />
          <Text style={styles.categoryText}>{request.category}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <MaterialIcons name={statusStyle.icon} size={12} color={statusStyle.text} />
          <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
            {statusStyle.label}
          </Text>
        </View>
      </View>

      <Text style={styles.propertyTitle} numberOfLines={1}>
        {property.name || property.address || 'Property'}
      </Text>
      <Text style={styles.descriptionText} numberOfLines={2}>
        {request.description}
      </Text>

      <View style={styles.divider} />

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <MaterialIcons name="calendar-today" size={12} color={Colors.onSurfaceVariant} />
          <Text style={styles.metaChipText}>{formatDate(request.createdAt)}</Text>
        </View>
        <View style={styles.viewRow}>
          <Text style={styles.viewLabel}>View Details</Text>
          <MaterialIcons name="chevron-right" size={18} color={Colors.secondary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MaintenanceHubScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ACTIVE');

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const data = await getMyMaintenanceRequests();
      setRequests(data);
    } catch (err) {
      console.error('Maintenance load error:', err);
      setError('Could not load maintenance requests.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const activeRequests = requests.filter(r => r.status !== 'CLOSED' && r.status !== 'RESOLVED');
  const historyRequests = requests.filter(r => r.status === 'CLOSED' || r.status === 'RESOLVED');
  
  const displayedRequests = activeTab === 'ACTIVE' ? activeRequests : historyRequests;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <MaterialIcons name="build" size={20} color={Colors.secondary} />
          <Text style={styles.headerTitle}>Maintenance Hub</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ACTIVE' && styles.activeTab]} 
          onPress={() => setActiveTab('ACTIVE')}
        >
          <Text style={[styles.tabText, activeTab === 'ACTIVE' && styles.activeTabText]}>Active ({activeRequests.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'HISTORY' && styles.activeTab]} 
          onPress={() => setActiveTab('HISTORY')}
        >
          <Text style={[styles.tabText, activeTab === 'HISTORY' && styles.activeTabText]}>History ({historyRequests.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[Colors.secondary]} />}
      >
        {isLoading && (
          <View style={styles.centeredBox}>
            <ActivityIndicator size="large" color={Colors.secondary} />
            <Text style={styles.stateText}>Loading requests...</Text>
          </View>
        )}

        {!isLoading && error && (
          <View style={styles.stateBox}>
            <MaterialIcons name="cloud-off" size={48} color={Colors.error} />
            <Text style={styles.stateTitle}>Failed to Load</Text>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !error && displayedRequests.length === 0 && (
          <View style={styles.stateBox}>
            <MaterialIcons name="home-repair-service" size={56} color={Colors.outlineVariant} />
            <Text style={styles.stateTitle}>No {activeTab === 'ACTIVE' ? 'Active' : 'Past'} Requests</Text>
            <Text style={styles.stateText}>You don't have any maintenance requests here.</Text>
          </View>
        )}

        {!isLoading && !error && displayedRequests.length > 0 && (
          <View style={styles.listContainer}>
            {displayedRequests.map((req) => (
              <RequestCard
                key={req._id}
                request={req}
                onPress={() => navigation.navigate('RequestDetail', { requestId: req._id })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.85} 
        onPress={() => navigation.navigate('CreateRequest')}
      >
        <MaterialIcons name="add" size={24} color="#fff" />
        <Text style={styles.fabText}>Book Repair</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: 'rgba(197,198,205,0.25)',
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceContainerLow },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.primary },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(197,198,205,0.25)' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: Colors.secondary },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.onSurfaceVariant },
  activeTabText: { color: Colors.secondary, fontWeight: '800' },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  centeredBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  stateBox: { alignItems: 'center', marginHorizontal: 20, marginTop: 40, padding: 32, backgroundColor: '#fff', borderRadius: 20, gap: 10 },
  stateTitle: { fontSize: 17, fontWeight: '800', color: Colors.primary },
  stateText: { fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 12, backgroundColor: Colors.secondary, borderRadius: 12 },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  listContainer: { paddingHorizontal: 16, paddingTop: 20, gap: 14 },

  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#191C1E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryText: { fontSize: 13, fontWeight: '800', color: Colors.secondary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  propertyTitle: { fontSize: 16, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  descriptionText: { fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 18 },
  divider: { height: 1, backgroundColor: Colors.surfaceContainerHigh, marginVertical: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surfaceContainerLow, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  metaChipText: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant },
  viewRow: { flexDirection: 'row', alignItems: 'center' },
  viewLabel: { fontSize: 12, fontWeight: '700', color: Colors.secondary },

  fab: {
    position: 'absolute', bottom: 30, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 28,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
