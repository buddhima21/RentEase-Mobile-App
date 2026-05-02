import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Colors from '../../constants/Colors';
import { getMyBookings } from '../../services/bookingService';
import { createMaintenanceRequest } from '../../services/maintenanceService';

const CATEGORIES = ["Plumbing", "Electrical", "Appliance", "General"];

export default function CreateRequestScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [category, setCategory] = useState(CATEGORIES[3]);
  const [description, setDescription] = useState('');
  const [entryPermission, setEntryPermission] = useState('CONTACT_TO_SCHEDULE');
  const [images, setImages] = useState([]);

  const pickImage = async () => {
    if (images.length >= 3) {
      return Alert.alert('Limit Reached', 'You can upload a maximum of 3 images.');
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission Required', 'Please allow access to your photo library.');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
      selectionLimit: 3 - images.length,
    });
    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => 
        asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri
      );
      setImages(prev => [...prev, ...newImages].slice(0, 3));
    }
  };

  const removeImage = (index) => setImages(prev => prev.filter((_, i) => i !== index));

  useEffect(() => {
    async function fetchBookings() {
      try {
        const data = await getMyBookings();
        const approved = data.filter(b => b.status === 'approved');
        setBookings(approved);
        if (approved.length >= 1) {
          setSelectedPropertyId(approved[0].property._id || approved[0].property);
        }
      } catch (err) {
        Alert.alert('Error', 'Could not load your bookings.');
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  const handleSubmit = async () => {
    if (bookings.length === 0) {
      Alert.alert('Error', 'You have no approved bookings to report maintenance for.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please describe the issue.');
      return;
    }

    setSubmitting(true);
    try {
      await createMaintenanceRequest({
        propertyId: selectedPropertyId,
        category,
        description,
        entryPermission,
        images,
      });
      Alert.alert('Success', 'Maintenance request submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>New Request</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Book Repair</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {bookings.length === 0 ? (
          <View style={styles.noLeaseBox}>
            <MaterialIcons name="error-outline" size={32} color={Colors.error} />
            <Text style={styles.noLeaseText}>You don't have any approved bookings.</Text>
          </View>
        ) : (
          <>
            {bookings.length > 1 && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Select Property</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                  {bookings.map((bk) => {
                    const pId = bk.property._id || bk.property;
                    const isActive = selectedPropertyId === pId;
                    return (
                      <TouchableOpacity 
                        key={bk._id} 
                        style={[styles.chip, isActive && styles.chipActive]}
                        onPress={() => setSelectedPropertyId(pId)}
                      >
                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                          {bk.property.title || 'Property'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Issue Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.chip, category === cat && styles.chipActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Describe the issue</Text>
              <TextInput
                style={styles.textInput}
                placeholder="E.g., The kitchen sink is leaking heavily..."
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Photos (Optional)</Text>
              {images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreviewList}>
                  {images.map((img, idx) => (
                    <View key={idx} style={styles.mediaPreviewContainer}>
                      <Image source={{ uri: img }} style={styles.mediaPreview} />
                      <TouchableOpacity style={styles.mediaRemoveBtn} onPress={() => removeImage(idx)}>
                        <MaterialIcons name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
              {images.length < 3 && (
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <MaterialIcons name="add-a-photo" size={20} color={Colors.secondary} />
                  <Text style={styles.uploadBtnText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Entry Permission</Text>
              <TouchableOpacity 
                style={styles.radioRow} 
                onPress={() => setEntryPermission('CONTACT_TO_SCHEDULE')}
              >
                <MaterialIcons 
                  name={entryPermission === 'CONTACT_TO_SCHEDULE' ? 'radio-button-checked' : 'radio-button-unchecked'} 
                  size={20} 
                  color={entryPermission === 'CONTACT_TO_SCHEDULE' ? Colors.secondary : Colors.onSurfaceVariant} 
                />
                <Text style={styles.radioText}>Contact me to schedule</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.radioRow} 
                onPress={() => setEntryPermission('GRANTED_MASTER_KEY')}
              >
                <MaterialIcons 
                  name={entryPermission === 'GRANTED_MASTER_KEY' ? 'radio-button-checked' : 'radio-button-unchecked'} 
                  size={20} 
                  color={entryPermission === 'GRANTED_MASTER_KEY' ? Colors.secondary : Colors.onSurfaceVariant} 
                />
                <Text style={styles.radioText}>Grant master key access (Faster)</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} 
              onPress={handleSubmit} 
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </>
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
  
  scrollContent: { padding: 20, paddingBottom: 100 },

  noLeaseBox: { backgroundColor: '#fee2e2', padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  noLeaseText: { color: '#991b1b', marginTop: 10, textAlign: 'center', fontWeight: '500' },

  formGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 12 },
  
  chip: { 
    paddingHorizontal: 16, paddingVertical: 8, 
    borderRadius: 20, backgroundColor: Colors.surfaceContainerLow, 
    marginRight: 10, borderWidth: 1, borderColor: 'transparent' 
  },
  chipActive: { backgroundColor: 'rgba(0,101,145,0.1)', borderColor: Colors.secondary },
  chipText: { fontSize: 14, fontWeight: '600', color: Colors.onSurfaceVariant },
  chipTextActive: { color: Colors.secondary },

  textInput: { 
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', 
    borderRadius: 12, padding: 14, fontSize: 15, color: Colors.onSurface,
    minHeight: 120
  },

  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  radioText: { fontSize: 15, color: Colors.onSurface },

  submitBtn: { 
    backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, 
    alignItems: 'center', marginTop: 20,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: 'rgba(0,101,145,0.06)', borderRadius: 12, alignSelf: 'flex-start' },
  uploadBtnText: { fontSize: 14, fontWeight: '700', color: Colors.secondary },
  mediaPreviewList: { flexDirection: 'row', marginBottom: 12 },
  mediaPreviewContainer: { marginRight: 12, position: 'relative' },
  mediaPreview: { width: 80, height: 80, borderRadius: 12 },
  mediaRemoveBtn: { position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
});
