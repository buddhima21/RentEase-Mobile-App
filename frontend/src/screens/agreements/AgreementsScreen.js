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
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import {
  getMyAgreements,
  getAgreementStatusStyle,
  formatDate,
} from '../../services/agreementService';

// ─── Agreement Card ───────────────────────────────────────────────────────────

function AgreementCard({ agreement, onPress }) {
  const statusStyle = getAgreementStatusStyle(agreement.status);
  const property = agreement.property || {};

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={onPress}
      accessibilityLabel={`Agreement ${agreement.agreementNumber}`}
    >
      {/* Top row: agreement number + status badge */}
      <View style={styles.cardTop}>
        <View style={styles.agreementNumRow}>
          <MaterialIcons name="description" size={16} color={Colors.secondary} />
          <Text style={styles.agreementNum}>{agreement.agreementNumber || '—'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <MaterialIcons name={statusStyle.icon} size={12} color={statusStyle.text} />
          <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
            {statusStyle.label}
          </Text>
        </View>
      </View>

      {/* Property title */}
      <Text style={styles.propertyTitle} numberOfLines={1}>
        {property.title || 'Property'}
      </Text>
      <View style={styles.locationRow}>
        <MaterialIcons name="location-on" size={13} color={Colors.onSurfaceVariant} />
        <Text style={styles.locationText} numberOfLines={1}>
          {property.location || '—'}
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Meta row */}
      <View style={styles.metaRow}>
        <MetaChip icon="calendar-today" label={`${formatDate(agreement.leaseStartDate)} → ${formatDate(agreement.leaseEndDate)}`} />
        <MetaChip
          icon="attach-money"
          label={`LKR ${Number(agreement.rentAmount || 0).toLocaleString()}/mo`}
          highlight
        />
      </View>

      {/* Arrow hint */}
      <View style={styles.viewRow}>
        <Text style={styles.viewLabel}>View Details</Text>
        <MaterialIcons name="chevron-right" size={18} color={Colors.secondary} />
      </View>
    </TouchableOpacity>
  );
}

function MetaChip({ icon, label, highlight }) {
  return (
    <View style={[styles.metaChip, highlight && styles.metaChipHighlight]}>
      <MaterialIcons
        name={icon}
        size={12}
        color={highlight ? Colors.secondary : Colors.onSurfaceVariant}
      />
      <Text
        style={[styles.metaChipText, highlight && { color: Colors.secondary, fontWeight: '700' }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AgreementsScreen({ navigation }) {
  const { user } = useAuth();
  const [agreements, setAgreements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const data = await getMyAgreements();
      setAgreements(data);
    } catch (err) {
      console.error('AgreementsScreen load error:', err);
      setError(
        err.response?.data?.message ||
          'Could not load agreements. Please check your connection.'
      );
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

  // ── Summary counts ──
  const counts = {
    active: agreements.filter((a) => a.status === 'ACTIVE').length,
    pending: agreements.filter((a) => a.status === 'PENDING').length,
    created: agreements.filter((a) => a.status === 'CREATED').length,
    signed: agreements.filter((a) => a.status === 'SIGNED_BY_TENANT').length,
    approved: agreements.filter((a) => a.status === 'APPROVED_BY_OWNER').length,
    termination: agreements.filter((a) => a.status === 'TERMINATION_REQUESTED').length,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <MaterialIcons name="description" size={20} color={Colors.secondary} />
          <Text style={styles.headerTitle}>My Agreements</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

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
        {/* ── Hero ── */}
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroTitle}>
            {user?.role === 'owner' ? 'Owner Agreements' : 'My Rental Agreements'}
          </Text>
          <Text style={styles.heroSub}>
            {user?.role === 'owner'
              ? 'Manage contracts with your tenants'
              : 'View and manage your rental contracts'}
          </Text>

          {/* Stats pills */}
          <View style={styles.statsRow}>
            <StatPill label="Active" value={counts.active} color="#4ade80" />
            <StatPill label="Pending" value={counts.pending} color="#fbbf24" />
            {counts.termination > 0 && (
              <StatPill label="Termination" value={counts.termination} color="#fb923c" />
            )}
            <StatPill label="Total" value={agreements.length} color="rgba(255,255,255,0.9)" />
          </View>
        </LinearGradient>

        {/* ── Loading ── */}
        {isLoading && (
          <View style={styles.centeredBox}>
            <ActivityIndicator size="large" color={Colors.secondary} />
            <Text style={styles.stateText}>Loading agreements...</Text>
          </View>
        )}

        {/* ── Error ── */}
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

        {/* ── Empty ── */}
        {!isLoading && !error && agreements.length === 0 && (
          <View style={styles.stateBox}>
            <MaterialIcons name="article" size={56} color={Colors.outlineVariant} />
            <Text style={styles.stateTitle}>No Agreements Yet</Text>
            <Text style={styles.stateText}>
              {user?.role === 'owner'
                ? 'Create agreements for your tenants from the property dashboard.'
                : 'Your agreements will appear here once an owner creates one for you.'}
            </Text>
          </View>
        )}

        {/* ── Agreement Cards ── */}
        {!isLoading && !error && agreements.length > 0 && (
          <View style={styles.listContainer}>
            <Text style={styles.sectionLabel}>
              {agreements.length} agreement{agreements.length !== 1 ? 's' : ''}
            </Text>
            {agreements.map((agreement) => (
              <AgreementCard
                key={agreement._id}
                agreement={agreement}
                onPress={() =>
                  navigation.navigate('AgreementDetails', { agreementId: agreement._id })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatPill({ label, value, color }) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statPillValue, { color }]}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197,198,205,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerLow,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.primary },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Hero banner
  hero: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    marginBottom: 4,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 20, flexWrap: 'wrap' },
  statPill: { alignItems: 'center' },
  statPillValue: { fontSize: 22, fontWeight: '800' },
  statPillLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },

  // States
  centeredBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  stateBox: {
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 40,
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 20,
    gap: 10,
    shadowColor: '#191C1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  stateTitle: { fontSize: 17, fontWeight: '800', color: Colors.primary },
  stateText: { fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
  },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // List
  listContainer: { paddingHorizontal: 16, paddingTop: 20, gap: 14 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#191C1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  agreementNumRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  agreementNum: { fontSize: 13, fontWeight: '800', color: Colors.secondary },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  propertyTitle: { fontSize: 16, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locationText: { fontSize: 12, color: Colors.onSurfaceVariant, flex: 1 },
  divider: { height: 1, backgroundColor: Colors.surfaceContainerHigh, marginVertical: 12 },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  metaChipHighlight: { backgroundColor: 'rgba(0, 101, 145, 0.08)' },
  metaChipText: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant },
  viewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  viewLabel: { fontSize: 12, fontWeight: '700', color: Colors.secondary },
});
