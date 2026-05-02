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
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { 
  getMaintenanceRequestById, 
  updateMaintenanceRequest 
} from '../../services/maintenanceService';

const STATUS_OPTIONS = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'ACTION_SCHEDULED', label: 'Action Scheduled' },
  { value: 'AWAITING_PARTS', label: 'Awaiting Parts' },
  { value: 'RESOLVED', label: 'Resolved' },
];

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function AdminRequestDetailScreen({ route, navigation }) {
  const { requestId } = route.params;
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [selectedStatus, setSelectedStatus] = useState('SUBMITTED');
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMaintenanceRequestById(requestId);
      setRequest(data);
      setSelectedStatus(data.status !== 'CLOSED' ? data.status : 'RESOLVED'); // Admin cannot set CLOSED, handle gracefully
      setAdminNotes(data.adminNotes || '');
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

  const handleSave = async () => {
    if (request.status === 'CLOSED') {
      Alert.alert('Error', 'Cannot update a closed ticket.');
      return;
    }
    
    setSaving(true);
    try {
      await updateMaintenanceRequest(requestId, { status: selectedStatus, adminNotes });
      Alert.alert('Success', 'Request updated successfully.', [
        { text: 'OK', onPress: () => load() }
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to update request.');
    } finally {
      setSaving(false);
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

  const isClosed = request.status === 'CLOSED';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Manage Request</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Ticket Details */}
        <View style={styles.card}>
          <Text style={styles.categoryTitle}>{request.category} Issue</Text>
          <View style={styles.detailRow}>
            <MaterialIcons name="location-on" size={16} color={Colors.onSurfaceVariant} />
            <Text style={styles.detailText}>{request.property?.name || request.property?.address || 'Property'}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="person" size={16} color={Colors.onSurfaceVariant} />
            <Text style={styles.detailText}>{request.tenant?.firstName} {request.tenant?.lastName} ({request.tenant?.email})</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="calendar-today" size={16} color={Colors.onSurfaceVariant} />
            <Text style={styles.detailText}>Submitted: {formatDate(request.createdAt)}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{request.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Entry Permission</Text>
          <Text style={styles.infoText}>
            {request.entryPermission === 'GRANTED_MASTER_KEY' 
              ? 'Master key access granted.' 
              : 'Please contact tenant to schedule.'}
          </Text>
        </View>

        {/* Update Form */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.formTitle}>Update Ticket</Text>

          {isClosed && (
            <View style={styles.closedBanner}>
              <MaterialIcons name="lock" size={20} color="#475569" />
              <Text style={styles.closedBannerText}>This ticket has been closed by the tenant and cannot be modified.</Text>
            </View>
          )}

          <Text style={styles.label}>Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 20 }}>
            {STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity 
                key={opt.value} 
                style={[styles.chip, selectedStatus === opt.value && styles.chipActive]}
                onPress={() => setSelectedStatus(opt.value)}
                disabled={isClosed}
              >
                <Text style={[styles.chipText, selectedStatus === opt.value && styles.chipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Admin Notes</Text>
          <TextInput
            style={[styles.textInput, isClosed && styles.textInputDisabled]}
            placeholder="Add notes for the tenant..."
            multiline
            numberOfLines={4}
            value={adminNotes}
            onChangeText={setAdminNotes}
            textAlignVertical="top"
            editable={!isClosed}
          />

          {!isClosed && (
            <TouchableOpacity 
              style={[styles.submitBtn, saving && styles.submitBtnDisabled]} 
              onPress={handleSave} 
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          )}
        </View>
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
  
  categoryTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary, marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  detailText: { fontSize: 14, color: Colors.onSurfaceVariant },

  divider: { height: 1, backgroundColor: Colors.surfaceContainerHigh, marginVertical: 16 },
  
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 8 },
  descriptionText: { fontSize: 15, color: Colors.onSurface, lineHeight: 22 },
  infoText: { fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 20, fontWeight: '500' },

  formTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.onSurface, marginBottom: 10 },
  
  chip: { 
    paddingHorizontal: 16, paddingVertical: 8, 
    borderRadius: 20, backgroundColor: Colors.surfaceContainerLow, 
    marginRight: 10, borderWidth: 1, borderColor: 'transparent' 
  },
  chipActive: { backgroundColor: 'rgba(0,101,145,0.1)', borderColor: Colors.secondary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  chipTextActive: { color: Colors.secondary },

  textInput: { 
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', 
    borderRadius: 12, padding: 14, fontSize: 15, color: Colors.onSurface,
    minHeight: 120, marginBottom: 20
  },
  textInputDisabled: { backgroundColor: Colors.surfaceContainerLow, color: Colors.onSurfaceVariant },

  submitBtn: { 
    backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, 
    alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  closedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f1f5f9', padding: 12, borderRadius: 8, marginBottom: 20 },
  closedBannerText: { flex: 1, color: '#475569', fontSize: 13, fontWeight: '500' },
});
