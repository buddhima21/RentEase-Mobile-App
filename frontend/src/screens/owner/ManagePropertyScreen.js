import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';

const AMENITIES_LIST = [
  { id: 'wifi', label: 'High-speed WiFi', icon: 'wifi' },
  { id: 'pool', label: 'Swimming Pool', icon: 'pool' },
  { id: 'parking', label: 'Free Parking', icon: 'local-parking' },
  { id: 'gym', label: 'Gym Access', icon: 'fitness-center' },
  { id: 'ac', label: 'Air Conditioning', icon: 'ac-unit' },
  { id: 'pets', label: 'Pet Friendly', icon: 'pets' },
];

export default function ManagePropertyScreen({ navigation, route }) {
  // If property exists in route.params, we are in Edit Mode
  const existingProperty = route.params?.property;
  const isEditMode = !!existingProperty;

  // Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  // Mock pre-fill if editing
  useEffect(() => {
    if (isEditMode) {
      setTitle(existingProperty.title || '');
      setPrice(existingProperty.price ? existingProperty.price.toString() : '');
      setLocation(existingProperty.location || '');
      setDescription(existingProperty.description || 'This is a beautiful property located centrally with great views.');
      setSelectedAmenities(existingProperty.amenities || ['wifi', 'parking', 'ac']);
    }
  }, [isEditMode, existingProperty]);

  const toggleAmenity = (id) => {
    setSelectedAmenities(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEditMode ? 'Edit Listing' : 'Add Listing'}</Text>
          </View>
          <Text style={styles.brand}>RentEase</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* ── PROGRESS INDICATOR (UI Only) ── */}
          {!isEditMode && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressStep}>STEP 2 OF 4</Text>
                <Text style={styles.progressLabel}>Listing Details</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={styles.progressBarFill} />
              </View>
            </View>
          )}

          {/* ── ESSENTIALS SECTION ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Essentials</Text>
            <Text style={styles.sectionSubtitle}>Provide the fundamental details about your property.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PROPERTY TITLE</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Modern Penthouse with Skyline View"
                placeholderTextColor={Colors.outline}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>PRICE PER MONTH</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputPrefix}>$</Text>
                  <TextInput
                    style={[styles.input, styles.inputWithPrefix]}
                    placeholder="2,500"
                    placeholderTextColor={Colors.outline}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1.5 }]}>
                <Text style={styles.label}>LOCATION</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="location-on" size={20} color={Colors.outline} style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.input, 
                      styles.inputWithIcon,
                      isEditMode && styles.inputDisabled
                    ]}
                    placeholder="Start typing address..."
                    placeholderTextColor={Colors.outline}
                    value={location}
                    onChangeText={setLocation}
                    editable={!isEditMode}
                    selectTextOnFocus={!isEditMode}
                  />
                </View>
                {isEditMode && (
                  <Text style={styles.helperText}>Address cannot be changed after listing.</Text>
                )}
              </View>
            </View>
          </View>

          {/* ── GALLERY SECTION ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <Text style={styles.sectionSubtitle}>High-quality photos increase booking chances by 40%.</Text>

            <View style={styles.galleryGrid}>
              <TouchableOpacity style={styles.uploadBox} activeOpacity={0.7}>
                <MaterialIcons name="add-a-photo" size={28} color={Colors.outline} />
                <Text style={styles.uploadText}>UPLOAD</Text>
              </TouchableOpacity>

              <View style={styles.imageWrapper}>
                <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxqtprtTWeiXjf2TJbVt1KbpFAKezcptU_i7MalE_WRaoaZB9Uqqll2mkeogkDunJQQjDg7QT6tbGkbBCcGpjfo6hz7EKbL1OY0WlNUdM7s8w_ul1RnfOV53AUg_4cppV5XCo-nMeLm0vWMAUmtm3N7NtF0wYCCjRj-lLvUXamdOQ93VjCE4abPOwLGTzQhWkJk6rE0R6PTDWxV4ggndhDn60Qb7wQ-ODrPtlEtfs-3UhAX12OgNB2I3gQQAze3vCiV5vLqofhua4' }} style={styles.galleryImage} />
                <TouchableOpacity style={styles.deleteImageBtn}>
                  <MaterialIcons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.imageWrapper}>
                <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6BR-dwA8ajL3X3h768ou8yHkrtOGQ1tqFBkpR4vl9U3EvzEOrTt0Mv4Zc62CWRdJyi01jqS2Y67Ra6lwHbIVGQCL-Zof45BbwXPATnAPfo1CuAIMG1R_-rSuTS1r1RP9emhogMskNa6MStzje01nPbfX1M9oERUebdek07e7Go0tEZYZuM1KaADYssRDVovzIGrIN2kkh2NfRSXAyo7OJMuhP70so9VJePwxZpkU8qkvL_0ZfVIk-srXqJkbwJzQg9fnjfZDrYkk' }} style={styles.galleryImage} />
                <TouchableOpacity style={styles.deleteImageBtn}>
                  <MaterialIcons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.imageWrapper}>
                <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKDprw6Qn8reb94qbIw7MuKGHJEqlVUJvTGXLoT4H_F1INwOIgkV2iEP7Z7_sCaWw8B2_DEV1vyhhhVr2WADq71HY3rjs56_-kTqhY6vxianUDMdPvJNZOaGSecLEcIV1e8YMHEox7w0GSR6n9fkIE-Y-ok4ogXc1Sozz0K3wG1-gVw8m1kYQUClM2xqbvp1MiYi1ITCn9TP_Fojx2yOp7Z8Qvc0PBHGeDW_IQMLZYbcJ4v01ce1LR67EVni53Yv1YZgS0HzDPWEI' }} style={styles.galleryImage} />
                <TouchableOpacity style={styles.deleteImageBtn}>
                  <MaterialIcons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── DESCRIPTION SECTION ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe the atmosphere, neighborhood, and unique features of the space..."
              placeholderTextColor={Colors.outline}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* ── AMENITIES SECTION ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <Text style={styles.sectionSubtitle}>Select all features that apply to your listing.</Text>
            
            <View style={styles.amenitiesGrid}>
              {AMENITIES_LIST.map((item) => {
                const isSelected = selectedAmenities.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.amenityChip, isSelected && styles.amenityChipActive]}
                    onPress={() => toggleAmenity(item.id)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons 
                      name={item.icon} 
                      size={20} 
                      color={isSelected ? Colors.onSecondaryContainer : Colors.onSurfaceVariant} 
                    />
                    <Text style={[styles.amenityText, isSelected && styles.amenityTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

        </ScrollView>

        {/* ── BOTTOM ACTIONS ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.draftBtn} activeOpacity={0.7} onPress={() => navigation.goBack()}>
            <Text style={styles.draftBtnText}>{isEditMode ? 'Cancel' : 'Save Draft'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <LinearGradient colors={[Colors.primary, '#1e293b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.saveBtnGradient}>
              <Text style={styles.saveBtnText}>{isEditMode ? 'Save Changes' : 'Continue to Verification'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(247,249,251,0.95)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  brand: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },

  // Progress
  progressContainer: {
    marginBottom: 40,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  progressStep: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.secondary,
    letterSpacing: 1,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    width: '50%',
    backgroundColor: Colors.secondary,
    borderRadius: 3,
  },

  // Sections
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
    marginBottom: 20,
  },

  // Inputs
  inputGroup: {
    marginBottom: 20,
  },
  rowInputs: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 15,
    color: Colors.onSurface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputPrefix: {
    position: 'absolute',
    left: 20,
    top: 16,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
    zIndex: 1,
  },
  inputWithPrefix: {
    paddingLeft: 40,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
  },
  inputWithIcon: {
    paddingLeft: 48,
  },
  inputDisabled: {
    backgroundColor: Colors.surfaceContainerHigh,
    color: Colors.onSurfaceVariant,
  },
  helperText: {
    fontSize: 11,
    color: Colors.error,
    marginTop: 6,
    marginLeft: 4,
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 15,
    color: Colors.onSurface,
    height: 140,
    marginTop: 10,
  },

  // Gallery
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  uploadBox: {
    width: Platform.OS === 'web' ? 140 : '48%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: 'rgba(197, 198, 205, 0.5)',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.outline,
    letterSpacing: 0.5,
    marginTop: 8,
  },
  imageWrapper: {
    width: Platform.OS === 'web' ? 140 : '48%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  deleteImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(9, 20, 38, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Amenities
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  amenityChipActive: {
    backgroundColor: Colors.secondaryContainer,
  },
  amenityText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  amenityTextActive: {
    color: Colors.onSecondaryContainer,
  },

  // Bottom Actions
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247,249,251,0.9)',
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(197, 198, 205, 0.15)',
  },
  draftBtn: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  saveBtn: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
});
