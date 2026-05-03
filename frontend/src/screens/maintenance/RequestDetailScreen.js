import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { 
  getMaintenanceRequestById, 
  deleteMaintenanceRequest, 
  updateMaintenanceRequest 
} from '../../services/maintenanceService';

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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function RequestDetailScreen({ route, navigation }) {
  const { requestId } = route.params;
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMaintenanceRequestById(requestId);
      setRequest(data);
    } catch (err) {
      Alert.alert('Error', 'Could not load request details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [requestId, navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDelete = () => {
    Alert.alert('Cancel Request', 'Are you sure you want to cancel and delete this maintenance request?', [
      { text: 'No', style: 'cancel' },
      { 
        text: 'Yes, Cancel', 
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await deleteMaintenanceRequest(requestId);
            Alert.alert('Success', 'Request cancelled.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
          } catch (err) {
            Alert.alert('Error', 'Failed to cancel request.');
          } finally {
            setActionLoading(false);
          }
        }
      }
    ]);
  };

  const handleUpdateStatus = async (newStatus) => {
    setActionLoading(true);
    try {
      await updateMaintenanceRequest(requestId, { status: newStatus });
      Alert.alert('Success', `Status updated to ${newStatus}.`);
      load();
    } catch (err) {
      Alert.alert('Error', 'Failed to update request.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !request) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      </SafeAreaView>
    );
  }

  const statusStyle = getStatusStyle(request.status);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Request Details</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.ticketId}>Ticket #{request._id.slice(-6).toUpperCase()}</Text>
              <Text style={styles.categoryTitle}>{request.category} Issue</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <MaterialIcons name={statusStyle.icon} size={14} color={statusStyle.text} />
              <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <View style={styles.iconBox}>
                <MaterialIcons name="location-on" size={18} color={Colors.secondary} />
              </View>
              <View style={styles.detailTextWrap}>
                <Text style={styles.detailLabel}>Property</Text>
                <Text style={styles.detailText}>{request.property?.title || request.property?.location || 'Property'}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.iconBox}>
                <MaterialIcons name="calendar-today" size={18} color={Colors.secondary} />
              </View>
              <View style={styles.detailTextWrap}>
                <Text style={styles.detailLabel}>Submitted</Text>
                <Text style={styles.detailText}>{formatDate(request.createdAt)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{request.description}</Text>

          {request.images && request.images.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Attached Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                {request.images.map((img, idx) => (
                  <Image key={idx} source={{ uri: img }} style={styles.attachedImage} />
                ))}
              </ScrollView>
            </>
          )}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Entry Permission</Text>
          <Text style={styles.infoText}>
            {request.entryPermission === 'GRANTED_MASTER_KEY' 
              ? 'Master key access granted.' 
              : 'Please contact me to schedule.'}
          </Text>

          {request.adminNotes && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Admin Notes</Text>
              <Text style={styles.infoText}>{request.adminNotes}</Text>
            </>
          )}
        </View>

        {/* Conditional Actions */}
        {actionLoading ? (
          <ActivityIndicator size="large" color={Colors.secondary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.actionContainer}>
            {request.status === 'SUBMITTED' && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <MaterialIcons name="delete-outline" size={20} color="#fff" />
                <Text style={styles.deleteBtnText}>Cancel Request</Text>
              </TouchableOpacity>
            )}

            {request.status === 'RESOLVED' && (
              <>
                <Text style={styles.resolvedPrompt}>Is the issue completely fixed?</Text>
                <TouchableOpacity style={styles.confirmBtn} onPress={() => handleUpdateStatus('CLOSED')}>
                  <MaterialIcons name="check-circle-outline" size={20} color="#fff" />
                  <Text style={styles.confirmBtnText}>Yes, Confirm Fixed</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.revertBtn} onPress={() => handleUpdateStatus('SUBMITTED')}>
                  <MaterialIcons name="error-outline" size={20} color={Colors.secondary} />
                  <Text style={styles.revertBtnText}>No, Still Broken</Text>
                </TouchableOpacity>
              </>
            )}
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
  
  scrollContent: { padding: 16, paddingBottom: 100 },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#191C1E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ticketId: { fontSize: 12, fontWeight: '700', color: Colors.onSurfaceVariant, marginBottom: 4, letterSpacing: 0.5 },
  categoryTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusBadgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  detailGrid: { gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,101,145,0.06)', alignItems: 'center', justifyContent: 'center' },
  detailTextWrap: { flex: 1, paddingTop: 2 },
  detailLabel: { fontSize: 11, fontWeight: '700', color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  detailText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  detailSubText: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 2 },

  divider: { height: 1, backgroundColor: Colors.surfaceContainerHigh, marginVertical: 16 },
  
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 8 },
  descriptionText: { fontSize: 15, color: Colors.onSurface, lineHeight: 22 },
  infoText: { fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 20 },

  actionContainer: { marginTop: 24, gap: 12 },
  
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ef4444', paddingVertical: 16, borderRadius: 12 },
  deleteBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  resolvedPrompt: { fontSize: 16, fontWeight: '600', color: Colors.primary, textAlign: 'center', marginBottom: 4 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 12 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  revertBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.surfaceContainerLow, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  revertBtnText: { color: Colors.secondary, fontSize: 16, fontWeight: '700' },

  imageScroll: { flexDirection: 'row', marginTop: 8 },
  attachedImage: { width: 100, height: 100, borderRadius: 12, marginRight: 12, backgroundColor: Colors.surfaceContainerLow },
});
