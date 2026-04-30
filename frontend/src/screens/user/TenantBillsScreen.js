import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, RefreshControl, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { getInvoicesByTenant, deleteInvoiceByTenant } from '../../services/paymentService';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
  `LKR ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

const STATUS_STYLES = {
  PAID:    { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  SENT:    { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  PENDING: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  OVERDUE: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.PENDING;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[styles.badgeText, { color: s.text }]}>{status}</Text>
    </View>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────
export default function TenantBillsScreen({ navigation }) {
  const { user } = useAuth();
  const [invoices, setInvoices]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInvoices = useCallback(async (isRefresh = false) => {
    if (!user?._id && !user?.id) return;
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const tenantId = user._id || user.id;
      const res = await getInvoicesByTenant(tenantId);
      setInvoices(res.data || []);
    } catch (err) {
      console.error('Fetch invoices error:', err);
      Alert.alert('Error', 'Could not load your bills. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handlePayBill = (bill) => {
    navigation.navigate('RentPayment', { bill, onPaid: fetchInvoices });
  };

  const handleDelete = (inv) => {
    Alert.alert(
      'Remove Invoice',
      'Hide this invoice from your dashboard? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            try {
              const id = inv.id || inv.invoiceNo;
              await deleteInvoiceByTenant(id);
              setInvoices(prev => prev.filter(i => (i.id || i.invoiceNo) !== id));
            } catch (e) {
              Alert.alert('Error', 'Failed to remove invoice.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Bills</Text>
          <View style={styles.liveDot} />
        </View>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={styles.loadingText}>Loading your bills…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchInvoices(true)}
              colors={[Colors.secondary]}
              tintColor={Colors.secondary}
            />
          }
        >
          {invoices.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt-long" size={56} color={Colors.outlineVariant} />
              <Text style={styles.emptyTitle}>No bills found</Text>
              <Text style={styles.emptySubtitle}>Your invoices will appear here once raised by your landlord.</Text>
            </View>
          ) : (
            invoices.map((inv) => (
              <View key={inv.id || inv.invoiceNo} style={styles.card}>
                {/* Card header */}
                <View style={styles.cardHeader}>
                  <View style={styles.invoiceIconWrap}>
                    <MaterialIcons name="receipt" size={20} color={Colors.secondary} />
                  </View>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.invoiceNo}>{inv.invoiceNo}</Text>
                    <Text style={styles.unit}>{inv.unit || '—'}</Text>
                  </View>
                  <StatusBadge status={inv.status} />
                </View>

                {/* Details row */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Total</Text>
                    <Text style={styles.detailValue}>{fmt(inv.total)}</Text>
                  </View>
                  {inv.overdueFee > 0 && (
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: '#dc2626' }]}>Overdue Fee</Text>
                      <Text style={[styles.detailValue, { color: '#dc2626' }]}>{fmt(inv.overdueFee)}</Text>
                    </View>
                  )}
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Due Date</Text>
                    <Text style={styles.detailValue}>{inv.dueDate || '—'}</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.cardActions}>
                  {inv.status !== 'PAID' ? (
                    <TouchableOpacity
                      style={styles.payBtn}
                      activeOpacity={0.85}
                      onPress={() => handlePayBill(inv)}
                    >
                      <MaterialIcons name="payment" size={16} color="#fff" />
                      <Text style={styles.payBtnText}>Pay Rent</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.paidChip}>
                      <MaterialIcons name="check-circle" size={14} color="#065f46" />
                      <Text style={styles.paidChipText}>Paid</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    activeOpacity={0.7}
                    onPress={() => handleDelete(inv)}
                  >
                    <MaterialIcons name="delete-outline" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceContainerHigh,
  },
  backBtn: { padding: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary, letterSpacing: -0.3 },
  liveDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981',
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 4, elevation: 3,
  },
  headerRight: { width: 32 },

  // Loading / empty
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: Colors.onSurfaceVariant },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  emptySubtitle: { fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16, marginBottom: 14, padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
    elevation: 3,
    borderWidth: 1, borderColor: Colors.surfaceContainerHigh,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  invoiceIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(0,101,145,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardHeaderText: { flex: 1 },
  invoiceNo: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  unit: { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },

  // Badge
  badge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },

  // Details
  detailsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 16,
    backgroundColor: Colors.surfaceContainerLow, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14,
  },
  detailItem: { minWidth: 90 },
  detailLabel: { fontSize: 10, fontWeight: '700', color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginTop: 2 },

  // Actions
  cardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 10,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8,
    elevation: 5,
  },
  payBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  paidChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#d1fae5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  paidChipText: { fontSize: 13, fontWeight: '700', color: '#065f46' },
  deleteBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(186,26,26,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
});
