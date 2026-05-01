import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet,
   Platform, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { getOwnerAllocationHistory, removeAllocatedTenant } from '../../services/bookingService';

const FALLBACK = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';
const AVATAR_COLORS = ['#0ea5e9','#8b5cf6','#10b981','#f59e0b','#ef4444'];
const getAvatarColor = (n) => { if (!n) return AVATAR_COLORS[0]; let h=0; for(let i=0;i<n.length;i++) h=n.charCodeAt(i)+((h<<5)-h); return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length]; };
const getInitials = (n) => { if (!n) return '?'; const p=n.trim().split(' '); return p.length>=2?(p[0][0]+p[p.length-1][0]).toUpperCase():p[0][0].toUpperCase(); };

const STATUS = {
  pending:  { bg: '#fef3c7', text: '#92400e', label: 'PENDING', icon: 'hourglass-top' },
  approved: { bg: '#dcfce7', text: '#166534', label: 'ALLOCATED', icon: 'check-circle' },
  rejected: { bg: '#fee2e2', text: '#991b1b', label: 'REJECTED', icon: 'cancel' },
  removed:  { bg: '#f3f4f6', text: '#6b7280', label: 'REMOVED', icon: 'person-remove' },
};
const getStatus = (s) => STATUS[s] || STATUS.pending;

export default function OwnerAllocationHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchHistory = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      setError(null);
      const data = await getOwnerAllocationHistory();
      setHistory(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load history');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchHistory(); }, [fetchHistory]));

  const handleRemoveTenant = (booking) => {
    Alert.alert(
      'Remove Tenant',
      `Remove ${booking.tenant?.name} from "${booking.property?.title}"? This will free up a bedroom slot.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            setRemoveLoading(booking._id);
            await removeAllocatedTenant(booking._id);
            setHistory(prev => prev.map(b => b._id === booking._id ? { ...b, status: 'removed' } : b));
            Alert.alert('Tenant Removed', 'The bedroom slot is now available for new bookings.');
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to remove tenant');
          } finally { setRemoveLoading(null); }
        }},
      ]
    );
  };

  const FILTERS = ['all', 'approved', 'rejected', 'removed', 'pending'];
  const filtered = filter === 'all' ? history : history.filter(b => b.status === filter);
  const allocated = history.filter(b => b.status === 'approved').length;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 8 }}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <MaterialIcons name="history" size={22} color={Colors.primary} />
        <Text style={s.brand}>Allocation History</Text>
      </View>

      <ScrollView
        style={s.scroll} contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchHistory(true)} colors={[Colors.secondary]} tintColor={Colors.secondary} />}
      >
        {/* Stats */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { borderLeftColor: '#10b981' }]}>
            <Text style={[s.statVal, { color: '#10b981' }]}>{allocated}</Text>
            <Text style={s.statLbl}>Active Tenants</Text>
          </View>
          <View style={[s.statCard, { borderLeftColor: Colors.secondary }]}>
            <Text style={[s.statVal, { color: Colors.secondary }]}>{history.length}</Text>
            <Text style={s.statLbl}>Total Records</Text>
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[s.filterChip, filter === f && s.filterActive]} onPress={() => setFilter(f)} activeOpacity={0.7}>
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={Colors.secondary} /><Text style={s.loadText}>Loading history...</Text></View>
        ) : error ? (
          <View style={s.center}>
            <MaterialIcons name="error-outline" size={44} color={Colors.error} />
            <Text style={s.errText}>{error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => fetchHistory()}><Text style={s.retryBtnText}>Retry</Text></TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.center}>
            <MaterialIcons name="folder-open" size={56} color={Colors.outlineVariant} />
            <Text style={s.emptyTitle}>No Records Found</Text>
            <Text style={s.emptySub}>{filter === 'all' ? 'No booking history yet.' : `No ${filter} bookings.`}</Text>
          </View>
        ) : (
          filtered.map(b => {
            const st = getStatus(b.status);
            return (
              <View key={b._id} style={s.card}>
                <View style={s.cardTop}>
                  <View style={s.tenantRow}>
                    <View style={[s.avatar, { backgroundColor: getAvatarColor(b.tenant?.name) }]}>
                      <Text style={s.avatarText}>{getInitials(b.tenant?.name)}</Text>
                    </View>
                    <View style={s.tenantInfo}>
                      <Text style={s.tenantName}>{b.tenant?.name || 'Unknown'}</Text>
                      <Text style={s.tenantContact}>{b.tenant?.email || '—'} • {b.tenant?.phone || '—'}</Text>
                    </View>
                  </View>
                  <View style={[s.statusPill, { backgroundColor: st.bg }]}>
                    <MaterialIcons name={st.icon} size={11} color={st.text} />
                    <Text style={[s.statusText, { color: st.text }]}>{st.label}</Text>
                  </View>
                </View>

                <View style={s.propRow}>
                  <Image source={{ uri: b.property?.images?.[0] || FALLBACK }} style={s.propImg} />
                  <View style={s.propInfo}>
                    <Text style={s.propTitle} numberOfLines={1}>{b.property?.title || 'Property'}</Text>
                    <Text style={s.propLoc} numberOfLines={1}>{b.property?.location || '—'}</Text>
                    <Text style={s.propDate}>{b.preferredDate ? new Date(b.preferredDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Text>
                  </View>
                </View>

                {b.status === 'rejected' && b.rejectionReason ? (
                  <View style={s.reasonBox}>
                    <MaterialIcons name="info" size={12} color="#991b1b" />
                    <Text style={s.reasonText}>{b.rejectionReason}</Text>
                  </View>
                ) : null}

                {b.status === 'approved' && (
                  <TouchableOpacity
                    style={[s.removeBtn, removeLoading === b._id && { opacity: 0.6 }]}
                    activeOpacity={0.7}
                    onPress={() => handleRemoveTenant(b)}
                    disabled={removeLoading === b._id}
                  >
                    {removeLoading === b._id ? <ActivityIndicator color={Colors.error} size="small" /> : (
                      <><MaterialIcons name="person-remove" size={16} color={Colors.error} /><Text style={s.removeBtnText}>Remove Tenant</Text></>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(197,198,205,0.2)' },
  brand: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  scroll: { flex: 1 }, scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statVal: { fontSize: 26, fontWeight: '800' },
  statLbl: { fontSize: 11, fontWeight: '600', color: Colors.onSurfaceVariant, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  filterScroll: { marginBottom: 16 },
  filterRow: { gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surfaceContainerLow, borderWidth: 1, borderColor: Colors.outlineVariant },
  filterActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  filterTextActive: { color: '#fff' },
  center: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  loadText: { fontSize: 14, color: Colors.onSurfaceVariant },
  errText: { fontSize: 14, color: Colors.error, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 10 },
  retryBtnText: { fontWeight: '700', color: Colors.primary },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginTop: 8 },
  emptySub: { fontSize: 13, color: Colors.onSurfaceVariant },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  tenantRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  tenantInfo: { flex: 1, gap: 1 },
  tenantName: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  tenantContact: { fontSize: 11, color: Colors.onSurfaceVariant },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  propRow: { flexDirection: 'row', gap: 10, backgroundColor: Colors.surfaceContainerLow, borderRadius: 12, padding: 10, marginBottom: 8 },
  propImg: { width: 50, height: 50, borderRadius: 8 },
  propInfo: { flex: 1, gap: 2 },
  propTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  propLoc: { fontSize: 11, color: Colors.onSurfaceVariant },
  propDate: { fontSize: 11, color: Colors.secondary, fontWeight: '600' },
  reasonBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, backgroundColor: '#fee2e2', borderRadius: 8, padding: 8, marginBottom: 8 },
  reasonText: { fontSize: 11, color: '#991b1b', fontStyle: 'italic', flex: 1 },
  removeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(186,26,26,0.08)', borderWidth: 1, borderColor: 'rgba(186,26,26,0.15)' },
  removeBtnText: { fontSize: 13, fontWeight: '700', color: Colors.error },
});
