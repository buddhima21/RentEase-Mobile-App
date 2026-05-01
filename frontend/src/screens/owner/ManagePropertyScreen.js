import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Colors from '../../constants/Colors';
import { createProperty, updateProperty } from '../../services/propertyService';

// ─── Constants ────────────────────────────────────────────────────────────────

const AMENITIES_LIST = [
  { id: 'wifi',     label: 'High-speed WiFi',  icon: 'wifi' },
  { id: 'pool',     label: 'Swimming Pool',     icon: 'pool' },
  { id: 'parking',  label: 'Free Parking',      icon: 'local-parking' },
  { id: 'gym',      label: 'Gym Access',         icon: 'fitness-center' },
  { id: 'ac',       label: 'Air Conditioning',  icon: 'ac-unit' },
  { id: 'pets',     label: 'Pet Friendly',       icon: 'pets' },
  { id: 'security', label: 'Security',           icon: 'security' },
  { id: 'laundry',  label: 'Laundry',            icon: 'local-laundry-service' },
];

const PROPERTY_TYPES = ['Apartment', 'House', 'Villa', 'Annex', 'Rooms'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ManagePropertyScreen({ navigation, route }) {
  const existingProperty = route.params?.property;
  const isEditMode = !!existingProperty;

  // ── Form State ──
  const [title, setTitle]               = useState('');
  const [price, setPrice]               = useState('');
  const [location, setLocation]         = useState('');
  const [description, setDescription]   = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms]         = useState('');
  const [bathrooms, setBathrooms]       = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [images, setImages]             = useState([]); // Array of { uri, base64 }

  // ── UI State ──
  const [isLoading, setIsLoading]       = useState(false);
  const [errors, setErrors]             = useState({});
  const [showTypeModal, setShowTypeModal] = useState(false);

  // ── Pre-fill for Edit Mode ──
  useEffect(() => {
    if (isEditMode && existingProperty) {
      setTitle(existingProperty.title || '');
      setPrice(existingProperty.price ? existingProperty.price.toString() : '');
      setLocation(existingProperty.location || '');
      setDescription(existingProperty.description || '');
      setPropertyType(existingProperty.propertyType || '');
      setBedrooms(existingProperty.bedrooms ? existingProperty.bedrooms.toString() : '');
      setBathrooms(existingProperty.bathrooms ? existingProperty.bathrooms.toString() : '');
      setSecurityDeposit(existingProperty.securityDeposit ? existingProperty.securityDeposit.toString() : '');
      setTermsAndConditions(existingProperty.termsAndConditions || '');
      setTermsAccepted(!!existingProperty._id); // Assuming edit mode means they already accepted to create it
      setSelectedAmenities(existingProperty.amenities || []);
      // Restore existing images as uri-only objects (already saved URLs)
      if (existingProperty.images && existingProperty.images.length > 0) {
        setImages(existingProperty.images.map((uri) => ({ uri, base64: null })));
      }
    }
  }, []);

  // ─── Validation ──────────────────────────────────────────────────────────────

  const validate = () => {
    const newErrors = {};
    if (!title.trim())        newErrors.title       = 'Property title is required.';
    if (!price.trim())        newErrors.price       = 'Monthly price is required.';
    else if (isNaN(Number(price)) || Number(price) <= 0)
                              newErrors.price       = 'Enter a valid positive price.';
    if (!location.trim())     newErrors.location    = 'Location / address is required.';
    if (!description.trim())  newErrors.description = 'Description is required.';
    if (!propertyType)        newErrors.propertyType = 'Select a property type.';
    if (!bedrooms.trim())     newErrors.bedrooms    = 'Number of bedrooms is required.';
    else if (isNaN(Number(bedrooms)) || Number(bedrooms) < 0)
                              newErrors.bedrooms    = 'Enter a valid number of bedrooms.';
    if (!bathrooms.trim())    newErrors.bathrooms   = 'Number of bathrooms is required.';
    else if (isNaN(Number(bathrooms)) || Number(bathrooms) < 0)
                              newErrors.bathrooms   = 'Enter a valid number of bathrooms.';
    if (!securityDeposit.trim()) newErrors.securityDeposit = 'Security deposit is required.';
    else if (isNaN(Number(securityDeposit)) || Number(securityDeposit) < 0)
                              newErrors.securityDeposit = 'Enter a valid security deposit amount.';
    
    if (!termsAccepted)       newErrors.terms = 'You must agree to the terms and conditions.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Image Picker ─────────────────────────────────────────────────────────────

  const pickImages = async () => {
    if (images.length >= 6) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 6 photos.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to upload images.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
      selectionLimit: 6 - images.length,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => ({
        uri: asset.uri,
        base64: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null,
      }));
      setImages((prev) => [...prev, ...newImages].slice(0, 6));
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Submit Handler ───────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Missing Information', 'Please fill in all required fields before submitting.');
      return;
    }

    setIsLoading(true);
    try {
      // Build images array: use base64 if fresh pick, otherwise use existing URI
      const imagePayload = images.map((img) => img.base64 || img.uri);

      const payload = {
        title:        title.trim(),
        description:  description.trim(),
        price:        Number(price),
        location:     location.trim(),
        propertyType: propertyType,
        bedrooms:     Number(bedrooms),
        bathrooms:    Number(bathrooms),
        securityDeposit: Number(securityDeposit),
        termsAndConditions: termsAndConditions.trim(),
        images:       imagePayload,
        amenities:    selectedAmenities,
      };

      if (isEditMode) {
        await updateProperty(existingProperty._id, payload);
        Alert.alert(
          '✅ Listing Updated',
          'Your property has been updated and sent for re-review. It will be visible once approved.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else {
        await createProperty(payload);
        Alert.alert(
          '🎉 Listing Submitted!',
          'Your property has been submitted for admin review. Once approved, it will appear in the listings.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      }
    } catch (error) {
      console.error('Property submission error:', error);
      const message =
        error.response?.data?.message ||
        'Failed to submit the listing. Please check your connection and try again.';
      Alert.alert('Submission Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  const toggleAmenity = (id) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const clearError = (field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

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
            <Text style={styles.headerTitle}>
              {isEditMode ? 'Edit Listing' : 'Add New Listing'}
            </Text>
          </View>
          <Text style={styles.brand}>RentEase</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── SUBMISSION NOTE ── */}
          <View style={styles.infoNote}>
            <MaterialIcons name="info" size={16} color={Colors.secondary} />
            <Text style={styles.infoNoteText}>
              {isEditMode
                ? 'Updating your listing will reset it to "Pending" for re-review by an admin.'
                : 'Your listing will be reviewed by an admin before it goes live. Typically takes 24–48 hours.'}
            </Text>
          </View>

          {/* ═══════════════════════════════════════
              SECTION 1 — PROPERTY ESSENTIALS
          ════════════════════════════════════════ */}
          <SectionHeader
            title="Property Essentials"
            subtitle="Provide the fundamental details about your property."
          />

          {/* Title */}
          <InputGroup label="PROPERTY TITLE" error={errors.title}>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              placeholder="e.g. Modern Penthouse with Skyline View"
              placeholderTextColor={Colors.outline}
              value={title}
              onChangeText={(v) => { setTitle(v); clearError('title'); }}
              returnKeyType="next"
            />
          </InputGroup>

          {/* Property Type */}
          <InputGroup label="PROPERTY TYPE" error={errors.propertyType}>
            <TouchableOpacity
              style={[styles.input, styles.selectInput, errors.propertyType && styles.inputError]}
              onPress={() => setShowTypeModal(true)}
              activeOpacity={0.7}
            >
              <Text style={propertyType ? styles.selectText : styles.selectPlaceholder}>
                {propertyType || 'Select property type...'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.outline} />
            </TouchableOpacity>
          </InputGroup>

          {/* Price + Area row */}
          <View style={styles.rowInputs}>
            <InputGroup label="PRICE / MONTH (LKR)" error={errors.price} style={{ flex: 1 }}>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="attach-money" size={18} color={Colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon, errors.price && styles.inputError]}
                  placeholder="25,000"
                  placeholderTextColor={Colors.outline}
                  keyboardType="numeric"
                  value={price}
                  onChangeText={(v) => { setPrice(v); clearError('price'); }}
                />
              </View>
            </InputGroup>

            <InputGroup label="SECURITY DEPOSIT (LKR)" error={errors.securityDeposit} style={{ flex: 1 }}>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="security" size={18} color={Colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon, errors.securityDeposit && styles.inputError]}
                  placeholder="50,000"
                  placeholderTextColor={Colors.outline}
                  keyboardType="numeric"
                  value={securityDeposit}
                  onChangeText={(v) => { setSecurityDeposit(v); clearError('securityDeposit'); }}
                />
              </View>
            </InputGroup>
          </View>

          {/* Bedrooms + Bathrooms row */}
          <View style={styles.rowInputs}>
            <InputGroup label="BEDROOMS" error={errors.bedrooms} style={{ flex: 1 }}>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="hotel" size={18} color={Colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon, errors.bedrooms && styles.inputError]}
                  placeholder="3"
                  placeholderTextColor={Colors.outline}
                  keyboardType="numeric"
                  value={bedrooms}
                  onChangeText={(v) => { setBedrooms(v); clearError('bedrooms'); }}
                />
              </View>
            </InputGroup>

            <InputGroup label="BATHROOMS" error={errors.bathrooms} style={{ flex: 1 }}>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="bathtub" size={18} color={Colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon, errors.bathrooms && styles.inputError]}
                  placeholder="2"
                  placeholderTextColor={Colors.outline}
                  keyboardType="numeric"
                  value={bathrooms}
                  onChangeText={(v) => { setBathrooms(v); clearError('bathrooms'); }}
                />
              </View>
            </InputGroup>
          </View>

          {/* Location */}
          <InputGroup label="LOCATION / ADDRESS" error={errors.location}>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="location-on" size={20} color={Colors.outline} style={styles.inputIcon} />
              <TextInput
                style={[
                  styles.input,
                  styles.inputWithIcon,
                  errors.location && styles.inputError,
                  isEditMode && styles.inputDisabled,
                ]}
                placeholder="e.g. 45 Galle Road, Colombo 03, Sri Lanka"
                placeholderTextColor={Colors.outline}
                value={location}
                onChangeText={(v) => { setLocation(v); clearError('location'); }}
                editable={!isEditMode}
                selectTextOnFocus={!isEditMode}
              />
            </View>
            {isEditMode && (
              <Text style={styles.helperText}>
                <MaterialIcons name="lock" size={11} color={Colors.error} /> Address cannot be changed after listing.
              </Text>
            )}
          </InputGroup>

          {/* ═══════════════════════════════════════
              SECTION 2 — GALLERY
          ════════════════════════════════════════ */}
          <SectionHeader
            title="Photo Gallery"
            subtitle={`Add up to 6 high-quality photos. (${images.length}/6 added)`}
          />

          <View style={styles.galleryGrid}>
            {/* Upload Button */}
            {images.length < 6 && (
              <TouchableOpacity style={styles.uploadBox} onPress={pickImages} activeOpacity={0.7}>
                <View style={styles.uploadInner}>
                  <MaterialIcons name="add-a-photo" size={30} color={Colors.secondary} />
                  <Text style={styles.uploadText}>ADD PHOTOS</Text>
                  <Text style={styles.uploadSubtext}>Tap to pick from gallery</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Image Thumbnails */}
            {images.map((img, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: img.uri }} style={styles.galleryImage} />
                {index === 0 && (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>COVER</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.deleteImageBtn}
                  onPress={() => removeImage(index)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {images.length === 0 && (
            <View style={styles.noImagePlaceholder}>
              <MaterialIcons name="photo-library" size={40} color={Colors.outlineVariant} />
              <Text style={styles.noImageText}>No photos added yet.</Text>
              <Text style={styles.noImageSubtext}>Properties with photos get 3× more views.</Text>
            </View>
          )}

          {/* ═══════════════════════════════════════
              SECTION 3 — DESCRIPTION
          ════════════════════════════════════════ */}
          <SectionHeader
            title="Description"
            subtitle="Describe the atmosphere, neighborhood, and unique features."
          />

          <InputGroup label="" error={errors.description}>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              placeholder="Describe the atmosphere, neighborhood, unique features, proximity to transport, schools, etc..."
              placeholderTextColor={Colors.outline}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={description}
              onChangeText={(v) => { setDescription(v); clearError('description'); }}
            />
          </InputGroup>

          {/* ═══════════════════════════════════════
              SECTION 4 — AMENITIES
          ════════════════════════════════════════ */}
          <SectionHeader
            title="Amenities"
            subtitle="Select all features that apply to your property."
          />

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
                    size={18}
                    color={isSelected ? '#fff' : Colors.onSurfaceVariant}
                  />
                  <Text style={[styles.amenityText, isSelected && styles.amenityTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ═══════════════════════════════════════
              SECTION 5 — TERMS AND CONDITIONS
          ════════════════════════════════════════ */}
          <SectionHeader
            title="Terms & Conditions"
            subtitle="Outline any rules, lease terms, or conditions for tenants."
          />

          <InputGroup label="" error={errors.termsAndConditions}>
            <TextInput
              style={[styles.textArea, { minHeight: 100 }, errors.termsAndConditions && styles.inputError]}
              placeholder="e.g., Minimum 6 months lease, no pets allowed, 2 months advance payment required..."
              placeholderTextColor={Colors.outline}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={termsAndConditions}
              onChangeText={(v) => { setTermsAndConditions(v); clearError('termsAndConditions'); }}
            />
          </InputGroup>

          <TouchableOpacity
            style={styles.checkboxRow}
            activeOpacity={0.7}
            onPress={() => { setTermsAccepted(!termsAccepted); clearError('terms'); }}
          >
            <MaterialIcons
              name={termsAccepted ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={termsAccepted ? Colors.secondary : Colors.outline}
            />
            <Text style={styles.checkboxText}>
              I confirm the details above are accurate and agree to RentEase terms.
            </Text>
          </TouchableOpacity>
          {errors.terms && <Text style={styles.errorTextCheckbox}>{errors.terms}</Text>}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* ── BOTTOM ACTION BAR ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.cancelBtnText}>{isEditMode ? 'Cancel' : 'Discard'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[Colors.secondary, Colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitBtnGradient}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons
                    name={isEditMode ? 'save' : 'cloud-upload'}
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.submitBtnText}>
                    {isEditMode ? 'Save Changes' : 'Submit for Review'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── PROPERTY TYPE MODAL ── */}
      <Modal
        visible={showTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTypeModal(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Property Type</Text>
            {PROPERTY_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.modalOption,
                  propertyType === type && styles.modalOptionActive,
                ]}
                onPress={() => {
                  setPropertyType(type);
                  clearError('propertyType');
                  setShowTypeModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    propertyType === type && styles.modalOptionTextActive,
                  ]}
                >
                  {type}
                </Text>
                {propertyType === type && (
                  <MaterialIcons name="check" size={18} color={Colors.secondary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function InputGroup({ label, error, children, style }) {
  return (
    <View style={[styles.inputGroup, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {children}
      {error ? (
        <View style={styles.errorRow}>
          <MaterialIcons name="error-outline" size={12} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197,198,205,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn:    { padding: 6, borderRadius: 8 },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  brand: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.secondary,
    letterSpacing: -0.5,
  },

  scroll:        { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Info banner
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(0, 101, 145, 0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 28,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    color: Colors.secondary,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Section headers
  sectionHeader: { marginBottom: 16, marginTop: 8 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginTop: 3,
  },

  // Input groups
  inputGroup:     { marginBottom: 16 },
  rowInputs:      { flexDirection: 'row', gap: 12, marginBottom: 0 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.onSurface,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: 'rgba(186, 26, 26, 0.04)',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  inputWithIcon: {
    paddingLeft: 42,
  },
  inputDisabled: {
    backgroundColor: Colors.surfaceContainerHigh,
    color: Colors.onSurfaceVariant,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText:        { fontSize: 15, color: Colors.onSurface, flex: 1 },
  selectPlaceholder: { fontSize: 15, color: Colors.outline, flex: 1 },
  helperText: {
    fontSize: 11,
    color: Colors.error,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.onSurface,
    minHeight: 140,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },

  // Gallery
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  uploadBox: {
    width: '47%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: Colors.secondary,
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: 'rgba(0, 101, 145, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadInner: { alignItems: 'center', gap: 6 },
  uploadText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.secondary,
    letterSpacing: 1,
  },
  uploadSubtext: {
    fontSize: 10,
    color: Colors.outline,
    textAlign: 'center',
  },
  imageWrapper: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  coverBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  deleteImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(9, 20, 38, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImagePlaceholder: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 8,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
  },
  noImageText:    { fontSize: 14, fontWeight: '700', color: Colors.onSurfaceVariant, marginTop: 10 },
  noImageSubtext: { fontSize: 12, color: Colors.outline, marginTop: 4 },

  // Amenities
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
  },
  amenityChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  amenityText:       { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  amenityTextActive: { color: '#fff' },

  // Terms and Conditions Checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  checkboxText: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 18,
  },
  errorTextCheckbox: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '500',
    marginLeft: 36, // align under text, past checkbox
    marginBottom: 8,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(197,198,205,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  submitBtn: {
    flex: 2.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  submitBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  // Property type modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.outlineVariant,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  modalOptionActive: {},
  modalOptionText:       { fontSize: 15, color: Colors.onSurface, fontWeight: '500' },
  modalOptionTextActive: { color: Colors.secondary, fontWeight: '700' },
});
