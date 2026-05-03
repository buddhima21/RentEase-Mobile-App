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
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { getAllMaintenanceRequests } from '../../services/maintenanceService';

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

function AdminRequestCard({ request, onPress }) {
  const statusStyle = getStatusStyle(request.status);
  const property = request.property || {};
  const tenant = request.tenant || {};

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
        {property.title || property.location || 'Property'}
      </Text>
      <Text style={styles.tenantText} numberOfLines={1}>
        Tenant: {tenant.name || 'Unknown'}
      </Text>

      <View style={styles.divider} />

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <MaterialIcons name="calendar-today" size={12} color={Colors.onSurfaceVariant} />
          <Text style={styles.metaChipText}>{formatDate(request.createdAt)}</Text>
        </View>
        <View style={styles.viewRow}>
          <Text style={styles.viewLabel}>Manage</Text>
          <MaterialIcons name="chevron-right" size={18} color={Colors.secondary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function AdminMaintenanceHubScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const data = await getAllMaintenanceRequests();
      setRequests(data);
    } catch (err) {
      console.error('Admin Maintenance load error:', err);
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

  const pendingRequests = requests.filter(r => r.status === 'SUBMITTED' || r.status === 'ACTION_SCHEDULED' || r.status === 'AWAITING_PARTS');
  const resolvedRequests = requests.filter(r => r.status === 'RESOLVED' || r.status === 'CLOSED');
  
  let displayedRequests = requests;
  if (activeTab === 'PENDING') displayedRequests = pendingRequests;
  if (activeTab === 'RESOLVED') displayedRequests = resolvedRequests;

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    displayedRequests = displayedRequests.filter(r => {
      const propTitle = (r.property?.title || '').toLowerCase();
      const tenantName = (r.tenant?.name || '').toLowerCase();
      const cat = (r.category || '').toLowerCase();
      return propTitle.includes(q) || tenantName.includes(q) || cat.includes(q);
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <MaterialIcons name="admin-panel-settings" size={20} color={Colors.secondary} />
          <Text style={styles.headerTitle}>Admin Maintenance</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={Colors.onSurfaceVariant} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search requests..."
          placeholderTextColor={Colors.outline}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <MaterialIcons name="close" size={16} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ALL' && styles.activeTab]} 
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.activeTabText]}>All ({requests.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'PENDING' && styles.activeTab]} 
          onPress={() => setActiveTab('PENDING')}
        >
          <Text style={[styles.tabText, activeTab === 'PENDING' && styles.activeTabText]}>Pending ({pendingRequests.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'RESOLVED' && styles.activeTab]} 
          onPress={() => setActiveTab('RESOLVED')}
        >
          <Text style={[styles.tabText, activeTab === 'RESOLVED' && styles.activeTabText]}>Resolved ({resolvedRequests.length})</Text>
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
            <MaterialIcons name="done-all" size={56} color={Colors.outlineVariant} />
            <Text style={styles.stateTitle}>No Requests Found</Text>
            <Text style={styles.stateText}>There are no requests matching this filter.</Text>
          </View>
        )}

        {!isLoading && !error && displayedRequests.length > 0 && (
          <View style={styles.listContainer}>
            {displayedRequests.map((req) => (
              <AdminRequestCard
                key={req._id}
                request={req}
                onPress={() => navigation.navigate('AdminRequestDetail', { requestId: req._id })}
              />
            ))}
          </View>
        )}
      </ScrollView>
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
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceContainerLow, marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(197,198,205,0.25)' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: Colors.onSurface },
  clearBtn: { padding: 4 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(197,198,205,0.25)' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: Colors.secondary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
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
  tenantText: { fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 18 },
  divider: { height: 1, backgroundColor: Colors.surfaceContainerHigh, marginVertical: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surfaceContainerLow, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  metaChipText: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant },
  viewRow: { flexDirection: 'row', alignItems: 'center' },
  viewLabel: { fontSize: 12, fontWeight: '700', color: Colors.secondary },
});
