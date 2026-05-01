import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Platform, RefreshControl, ActivityIndicator, Alert, Modal, TextInput, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AdminHeader from './components/AdminHeader';
import AdminStatsGrid from './components/AdminStatsGrid';
import AdminModerationList from './components/AdminModerationList';
import BottomNav from '../../components/navigation/BottomNav';
import { getAllPropertiesForAdmin, updatePropertyStatus, formatProperty } from '../../services/propertyService';

export default function AdminDashboardScreen({ navigation }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State for Reject Reason
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectPropertyId, setRejectPropertyId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchProperties = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const rawProps = await getAllPropertiesForAdmin();
      const formatted = rawProps.map(formatProperty);
      formatted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setProperties(formatted);
    } catch (error) {
      console.error('Failed to fetch admin properties:', error);
      Alert.alert('Error', 'Failed to load properties. Check network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProperties();
    }, [fetchProperties])
  );

  const confirmApprove = (propertyId) => {
    Alert.alert(
      "Approve Property",
      "Are you sure you want to approve this property? It will be visible to all users.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Approve", onPress: () => handleApprove(propertyId), style: "default" }
      ]
    );
  };

  const handleApprove = async (propertyId) => {
    try {
      await updatePropertyStatus(propertyId, 'approved');
      setProperties(prev => prev.map(p => 
        p.id === propertyId ? { ...p, status: 'approved' } : p
      ));
      Alert.alert("Success", "Property approved successfully.");
    } catch (err) {
      Alert.alert('Error', 'Failed to approve property.');
    }
  };

  const confirmReject = (propertyId) => {
    setRejectPropertyId(propertyId);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert("Error", "Please provide a reason for rejection.");
      return;
    }
    
    setRejectModalVisible(false);
    try {
      await updatePropertyStatus(rejectPropertyId, 'rejected', rejectReason);
      setProperties(prev => prev.map(p => 
        p.id === rejectPropertyId ? { ...p, status: 'rejected' } : p
      ));
      Alert.alert("Success", "Property rejected successfully.");
    } catch (err) {
      Alert.alert('Error', 'Failed to reject property.');
    }
  };

  const handlePressProperty = (property) => {
    navigation.navigate('PropertyDetails', { property });
  };

  const totalMonthlyViews = 8432;
  const pendingCount = properties.filter(p => p.status === 'pending').length;
  const uniqueOwners = new Set(properties.filter(p => p.owner).map(p => p.owner._id)).size;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AdminHeader />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchProperties(true)} />
        }
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Manage platform activity and approve new property listings.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Analytics')} style={styles.analyticsBtn}>
            <Text style={styles.analyticsBtnText}>View System Analytics</Text>
          </TouchableOpacity>
        </View>

        <AdminStatsGrid 
          totalViews={totalMonthlyViews}
          pendingCount={pendingCount} 
          verifiedUsers={uniqueOwners} 
        />

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#006591" style={{ marginTop: 40 }} />
        ) : (
          <AdminModerationList 
            properties={properties} 
            onApprove={confirmApprove}
            onReject={confirmReject}
            onPressProperty={handlePressProperty}
          />
        )}
      </ScrollView>

      {/* Reject Reason Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Property</Text>
            <Text style={styles.modalSubtitle}>Please provide a reason for rejecting this property.</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="Enter rejection reason..."
              multiline
              numberOfLines={4}
              value={rejectReason}
              onChangeText={setRejectReason}
              textAlignVertical="top"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setRejectModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnReject} onPress={handleReject}>
                <Text style={styles.modalBtnRejectText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomNavContainer}>
        <BottomNav activeTab="dashboard" onTabPress={(tab) => {
          if(tab === 'dashboard') navigation.navigate('AdminDashboard');
          if(tab === 'profile') {
            // handle profile navigation or logout
          }
        }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f9fb' },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  sectionHeader: { paddingVertical: 32 },
  title: {
    fontSize: 32, fontWeight: '800', color: '#091426', letterSpacing: -0.5, marginBottom: 8,
    ...(Platform.OS === 'web' && { fontSize: 36 }),
  },
  subtitle: { fontSize: 18, color: '#45474c' },
  analyticsBtn: { marginTop: 16, backgroundColor: '#091426', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignSelf: 'flex-start' },
  analyticsBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  bottomNavContainer: { position: 'absolute', bottom: 0, width: '100%' },

  // Modal Styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#091426', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#45474c', marginBottom: 16 },
  textInput: {
    borderWidth: 1, borderColor: '#c5c6cd', borderRadius: 12, padding: 12,
    fontSize: 14, color: '#091426', backgroundColor: '#f7f9fb', minHeight: 100, marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBtnCancel: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  modalBtnCancelText: { color: '#45474c', fontWeight: '600', fontSize: 14 },
  modalBtnReject: { backgroundColor: '#ba1a1a', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  modalBtnRejectText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
