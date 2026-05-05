import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import {
  getAgreementById,
  acceptAgreement,
  rejectAgreement,
  requestTermination,
  acceptTermination,
  rejectTermination,
  uploadSignature,
  ownerApproveAgreement,
  ownerRejectAgreement,
  downloadAgreementPDF,
  getAgreementStatusStyle,
  formatDate,
} from '../../services/agreementService';

// Base URL for serving static uploads (same host as API)
const BASE_URL = API.defaults.baseURL?.replace('/api', '') || '';

// ─── Small reusable row ───────────────────────────────────────────────────────
function InfoRow({ icon, label, value, valueStyle }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <MaterialIcons name={icon} size={16} color={Colors.secondary} />
      </View>
      <View style={styles.infoTextBox}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueStyle]}>{value || '—'}</Text>
      </View>
    </View>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function SectionCard({ title, icon, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name={icon} size={18} color={Colors.secondary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────
function ActionButton({ label, icon, onPress, variant = 'primary', disabled = false }) {
  const isSecondary = variant === 'secondary';
  const isDanger = variant === 'danger';

  const bgColor = isDanger
    ? Colors.error
    : isSecondary
    ? '#fff'
    : Colors.secondary;

  const textColor = isSecondary ? Colors.primary : '#fff';

  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        { backgroundColor: bgColor, opacity: disabled ? 0.5 : 1 },
        isSecondary && styles.actionBtnOutline,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityLabel={label}
    >
      <MaterialIcons name={icon} size={18} color={textColor} />
      <Text style={[styles.actionBtnText, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AgreementDetailsScreen({ navigation, route }) {
  const { agreementId } = route.params;
  const { user } = useAuth();

  const [agreement, setAgreement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Load agreement ──
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAgreementById(agreementId);
      setAgreement(data);
    } catch (err) {
      console.error('AgreementDetails load error:', err);
      setError(err.response?.data?.message || 'Could not load agreement details.');
    } finally {
      setIsLoading(false);
    }
  }, [agreementId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // ── Generic action wrapper ──
  const doAction = async (actionFn, confirmTitle, confirmMsg) => {
    Alert.alert(confirmTitle, confirmMsg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: 'default',
        onPress: async () => {
          setActionLoading(true);
          try {
            await actionFn();
            await load(); // re-fetch fresh data
          } catch (err) {
            Alert.alert(
              'Action Failed',
              err.response?.data?.message || 'Something went wrong. Please try again.'
            );
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  // ── Tenant: Accept ──
  const handleAccept = () =>
    doAction(
      () => acceptAgreement(agreement._id),
      'Accept Agreement',
      'By accepting, you agree to all terms in this rental contract. This agreement will become active.'
    );

  // ── Tenant: Reject ──
  const handleReject = () =>
    doAction(
      () => rejectAgreement(agreement._id),
      'Reject Agreement',
      'Are you sure you want to reject this agreement? This action cannot be undone.'
    );

  // ── Tenant: Request Termination ──
  const handleTerminate = () => {
    Alert.alert(
      'Request Early Termination',
      `Are you sure you want to request early termination?\n\nA penalty of up to LKR ${Number(
        agreement?.rentAmount || 0
      ).toLocaleString()} (1 month's rent) may apply if more than 30 days remain on your lease.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Termination',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const result = await requestTermination(agreement._id, 'Requested by tenant via app');
              await load();
              if (result.terminationPenalty > 0) {
                Alert.alert(
                  'Termination Requested',
                  `Your request has been submitted.\n\nPenalty due: LKR ${Number(
                    result.terminationPenalty
                  ).toLocaleString()}\n\nThe owner will review your request.`
                );
              } else {
                Alert.alert('Termination Requested', 'Your request has been submitted to the owner.');
              }
            } catch (err) {
              Alert.alert(
                'Request Failed',
                err.response?.data?.message || 'Could not submit termination request.'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // ── Owner: Accept Termination ──
  const handleAcceptTermination = () =>
    doAction(
      () => acceptTermination(agreement._id),
      'Accept Termination',
      "Are you sure you want to accept the tenant's termination request? The agreement will be terminated."
    );

  // ── Owner: Reject Termination ──
  const handleRejectTermination = () =>
    doAction(
      () => rejectTermination(agreement._id),
      'Reject Termination',
      "Reject the tenant's termination request? The agreement will remain active."
    );

  // ── Upload Signature (Tenant) ──
  const handleUploadSignature = async () => {
    const { status: permStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permStatus !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setActionLoading(true);
    try {
      await uploadSignature(agreement._id, {
        uri: asset.uri,
        name: asset.fileName || 'signature.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
      await load();
      Alert.alert('Success', 'Your signature has been uploaded. The owner will review it.');
    } catch (err) {
      Alert.alert('Upload Failed', err.response?.data?.message || 'Could not upload signature.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Owner: Approve Agreement ──
  const handleOwnerApprove = () =>
    doAction(
      () => ownerApproveAgreement(agreement._id),
      'Approve Agreement',
      'Confirm you have reviewed the tenant signature and approve this agreement.'
    );

  // ── Owner: Reject Agreement ──
  const handleOwnerReject = () => {
    Alert.alert(
      'Reject Agreement',
      'Are you sure you want to reject this agreement? The tenant will need to re-sign.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await ownerRejectAgreement(agreement._id, 'Signature rejected by owner');
              await load();
            } catch (err) {
              Alert.alert('Failed', err.response?.data?.message || 'Could not reject agreement.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // ── Download PDF (APPROVED_BY_OWNER) ──
  const handleDownloadPDF = async () => {
    setActionLoading(true);
    try {
      await downloadAgreementPDF(agreement._id);
    } catch (err) {
      Alert.alert('PDF Error', err.response?.data?.message || 'Could not generate PDF.');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Derived state ────────────────────────────────────────────────────────
  const isTenant = user?.role === 'tenant';
  const isOwner = user?.role === 'owner';
  const status = agreement?.status;
  const statusStyle = getAgreementStatusStyle(status);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header navigation={navigation} />
        <View style={styles.centeredBox}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={styles.stateText}>Loading agreement details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header navigation={navigation} />
        <View style={styles.stateBox}>
          <MaterialIcons name="cloud-off" size={48} color={Colors.error} />
          <Text style={styles.stateTitle}>Failed to Load</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const property = agreement.property || {};
  const tenant = agreement.tenant || {};
  const owner = agreement.owner || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header navigation={navigation} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status Banner ── */}
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <Text style={styles.heroAgrNum}>{agreement.agreementNumber || 'Agreement'}</Text>
          <View style={[styles.heroBadge, { backgroundColor: statusStyle.bg }]}>
            <MaterialIcons name={statusStyle.icon} size={14} color={statusStyle.text} />
            <Text style={[styles.heroBadgeText, { color: statusStyle.text }]}>
              {statusStyle.label}
            </Text>
          </View>
          <Text style={styles.heroPropertyTitle} numberOfLines={2}>
            {property.title}
          </Text>
          <Text style={styles.heroLocation}>
            <MaterialIcons name="location-on" size={12} color="rgba(255,255,255,0.7)" />{' '}
            {property.location}
          </Text>
        </LinearGradient>

        {/* ── Action Loading Overlay ── */}
        {actionLoading && (
          <View style={styles.actionLoadingBar}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.actionLoadingText}>Processing...</Text>
          </View>
        )}

        {/* ── Tenant Actions: CREATED (upload signature) ── */}
        {isTenant && status === 'CREATED' && (
          <SectionCard title="Signature Required" icon="draw">
            <Text style={styles.actionHintText}>
              Your rental agreement is ready. Please upload your signed image to proceed.
            </Text>
            <ActionButton
              label="Upload Signature"
              icon="upload"
              onPress={handleUploadSignature}
              disabled={actionLoading}
            />
          </SectionCard>
        )}

        {/* ── Tenant: SIGNED_BY_TENANT — waiting for owner ── */}
        {isTenant && status === 'SIGNED_BY_TENANT' && (
          <SectionCard title="Awaiting Owner Review" icon="hourglass-top">
            <Text style={styles.actionHintText}>
              Your signature has been submitted. The owner will review and approve it shortly.
            </Text>
            {agreement.signatureImagePath && (
              <Image
                source={{ uri: `${BASE_URL}/${agreement.signatureImagePath}` }}
                style={styles.signaturePreview}
                resizeMode="contain"
              />
            )}
          </SectionCard>
        )}

        {/* ── Tenant Actions: PENDING ── */}
        {isTenant && status === 'PENDING' && (
          <SectionCard title="Action Required" icon="notification-important">
            <Text style={styles.actionHintText}>
              Please review this agreement and accept or reject it.
            </Text>
            <View style={styles.actionRow}>
              <ActionButton
                label="Accept Agreement"
                icon="check-circle"
                onPress={handleAccept}
                disabled={actionLoading}
              />
              <ActionButton
                label="Reject"
                icon="cancel"
                onPress={handleReject}
                variant="danger"
                disabled={actionLoading}
              />
            </View>
          </SectionCard>
        )}

        {/* ── Tenant Actions: ACTIVE or APPROVED ── */}
        {isTenant && (status === 'ACTIVE' || status === 'APPROVED_BY_OWNER') && (
          <SectionCard title="Agreement Active" icon="check-circle">
            <Text style={styles.actionHintText}>
              Your agreement is currently active. You can request early termination below.
            </Text>
            <ActionButton
              label="Request Early Termination"
              icon="exit-to-app"
              onPress={handleTerminate}
              variant="danger"
              disabled={actionLoading}
            />
          </SectionCard>
        )}

        {/* ── Owner: review SIGNED_BY_TENANT agreement ── */}
        {isOwner && status === 'SIGNED_BY_TENANT' && (
          <SectionCard title="Review Tenant Signature" icon="draw">
            <Text style={styles.actionHintText}>
              The tenant has signed the agreement. Review the signature below and approve or reject.
            </Text>
            {agreement.signatureImagePath ? (
              <Image
                source={{ uri: `${BASE_URL}/${agreement.signatureImagePath}` }}
                style={styles.signaturePreview}
                resizeMode="contain"
              />
            ) : (
              <Text style={[styles.actionHintText, { color: Colors.error }]}>
                No signature image found.
              </Text>
            )}
            <View style={styles.actionRow}>
              <ActionButton
                label="Approve"
                icon="check-circle"
                onPress={handleOwnerApprove}
                disabled={actionLoading}
              />
              <ActionButton
                label="Reject"
                icon="cancel"
                onPress={handleOwnerReject}
                variant="danger"
                disabled={actionLoading}
              />
            </View>
          </SectionCard>
        )}

        {/* ── Owner Actions: TERMINATION_REQUESTED ── */}
        {isOwner && status === 'TERMINATION_REQUESTED' && (
          <SectionCard title="Termination Request" icon="pending-actions">
            <View style={styles.penaltyBox}>
              <MaterialIcons name="info" size={16} color="#c2410c" />
              <Text style={styles.penaltyText}>
                Tenant has requested early termination.
                {agreement.terminationPenalty > 0
                  ? `\n\nCalculated penalty: LKR ${Number(
                      agreement.terminationPenalty
                    ).toLocaleString()}`
                  : ''}
                {agreement.terminationReason
                  ? `\n\nReason: ${agreement.terminationReason}`
                  : ''}
              </Text>
            </View>
            <View style={styles.actionRow}>
              <ActionButton
                label="Accept Termination"
                icon="check-circle"
                onPress={handleAcceptTermination}
                variant="danger"
                disabled={actionLoading}
              />
              <ActionButton
                label="Reject"
                icon="cancel"
                onPress={handleRejectTermination}
                variant="secondary"
                disabled={actionLoading}
              />
            </View>
          </SectionCard>
        )}

        {/* ── PDF Download (APPROVED or ACTIVE) ── */}
        <View style={styles.pdfRow}>
          {(status === 'APPROVED_BY_OWNER' || status === 'ACTIVE') ? (
            <TouchableOpacity
              style={styles.pdfBtn}
              onPress={handleDownloadPDF}
              activeOpacity={0.8}
              disabled={actionLoading}
              accessibilityLabel="Download Agreement PDF"
            >
              <MaterialIcons name="picture-as-pdf" size={18} color={Colors.secondary} />
              <Text style={styles.pdfBtnText}>Download Agreement PDF</Text>
              <MaterialIcons name="download" size={16} color={Colors.secondary} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.pdfBtn, { opacity: 0.45 }]}>
              <MaterialIcons name="picture-as-pdf" size={18} color={Colors.onSurfaceVariant} />
              <Text style={[styles.pdfBtnText, { color: Colors.onSurfaceVariant }]}>
                PDF available after owner approval
              </Text>
            </View>
          )}
        </View>

        {/* ── Property Info ── */}
        <SectionCard title="Property Details" icon="home">
          <InfoRow icon="home" label="Property" value={property.title} />
          <InfoRow icon="location-on" label="Location" value={property.location} />
          <InfoRow icon="category" label="Type" value={property.propertyType} />
          {property.bedrooms != null && (
            <InfoRow icon="hotel" label="Bedrooms" value={`${property.bedrooms} bed(s)`} />
          )}
          {property.bathrooms != null && (
            <InfoRow icon="bathtub" label="Bathrooms" value={`${property.bathrooms} bath(s)`} />
          )}
        </SectionCard>

        {/* ── Lease Details ── */}
        <SectionCard title="Lease Terms" icon="assignment">
          <InfoRow icon="calendar-today" label="Start Date" value={formatDate(agreement.leaseStartDate)} />
          <InfoRow icon="event" label="End Date" value={formatDate(agreement.leaseEndDate)} />
          <InfoRow
            icon="attach-money"
            label="Monthly Rent"
            value={`LKR ${Number(agreement.rentAmount || 0).toLocaleString()}`}
            valueStyle={{ color: Colors.secondary, fontWeight: '800' }}
          />
          <InfoRow
            icon="security"
            label="Security Deposit"
            value={`LKR ${Number(agreement.securityDeposit || 0).toLocaleString()}`}
          />
          {agreement.notes && (
            <InfoRow icon="notes" label="Notes" value={agreement.notes} />
          )}
        </SectionCard>

        {/* ── Parties ── */}
        <SectionCard title="Parties" icon="people">
          <View style={styles.partyBlock}>
            <Text style={styles.partyRole}>TENANT</Text>
            <InfoRow icon="person" label="Name" value={tenant.name} />
            <InfoRow icon="email" label="Email" value={tenant.email} />
            <InfoRow icon="phone" label="Phone" value={tenant.phone} />
          </View>
          <View style={[styles.partyBlock, { marginTop: 8 }]}>
            <Text style={styles.partyRole}>OWNER</Text>
            <InfoRow icon="person" label="Name" value={owner.name} />
            <InfoRow icon="email" label="Email" value={owner.email} />
            <InfoRow icon="phone" label="Phone" value={owner.phone} />
          </View>
        </SectionCard>

        {/* ── Termination Info (if applicable) ── */}
        {(status === 'TERMINATION_REQUESTED' || status === 'TERMINATED') &&
          agreement.terminationReason && (
            <SectionCard title="Termination Details" icon="exit-to-app">
              <InfoRow icon="notes" label="Reason" value={agreement.terminationReason} />
              {agreement.terminationPenalty > 0 && (
                <InfoRow
                  icon="attach-money"
                  label="Penalty Amount"
                  value={`LKR ${Number(agreement.terminationPenalty).toLocaleString()}`}
                  valueStyle={{ color: Colors.error, fontWeight: '800' }}
                />
              )}
            </SectionCard>
          )}

        {/* ── Timestamps ── */}
        <SectionCard title="Agreement Timeline" icon="history">
          <InfoRow icon="add-circle" label="Created" value={formatDate(agreement.createdAt)} />
          <InfoRow icon="update" label="Last Updated" value={formatDate(agreement.updatedAt)} />
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Header component ─────────────────────────────────────────────────────────
function Header({ navigation }) {
  return (
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
        <Text style={styles.headerTitle}>Agreement Details</Text>
      </View>
      <View style={{ width: 40 }} />
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
  scrollContent: { paddingBottom: 48 },

  // States
  centeredBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  stateBox: {
    margin: 24,
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    gap: 10,
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

  // Hero banner
  heroBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
  },
  heroAgrNum: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 12,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  heroPropertyTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  heroLocation: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 6 },

  // Action loading bar
  actionLoadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.secondary,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  actionLoadingText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // PDF row
  pdfRow: { marginHorizontal: 16, marginTop: 14 },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 101, 145, 0.08)',
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  pdfBtnText: { fontSize: 14, fontWeight: '700', color: Colors.secondary },

  // Section card
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 14,
    shadowColor: '#191C1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
    paddingBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.primary },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerLow,
  },
  infoIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 101, 145, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextBox: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: Colors.onSurfaceVariant, marginBottom: 1 },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  // Party block
  partyBlock: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
  },
  partyRole: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondary,
    letterSpacing: 1,
    marginBottom: 8,
  },

  // Action hint
  actionHintText: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    lineHeight: 19,
    marginBottom: 14,
  },

  // Action row
  actionRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 13,
    minWidth: 120,
  },
  actionBtnOutline: {
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
  },
  actionBtnText: { fontSize: 13, fontWeight: '800' },

  // Penalty box
  penaltyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  penaltyText: {
    flex: 1,
    fontSize: 13,
    color: '#7c2d12',
    lineHeight: 20,
    fontWeight: '500',
  },

  // Signature preview image
  signaturePreview: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    backgroundColor: '#f8fafc',
  },
});

