import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, TextInput, Platform, Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import {
  getBankCards,
  saveBankCard,
  updateBankCard,
  deleteBankCard,
} from '../../services/paymentService';

// ── Helpers ───────────────────────────────────────────────────────────────────
const EMPTY_FORM = { _id: '', cardHolderName: '', cardNumber: '', expiryDate: '', cvv: '' };

const validateCard = (form) => {
  const errors = {};
  if (!form.cardHolderName.trim()) errors.cardHolderName = 'Card holder name is required.';
  const raw = form.cardNumber.replace(/\s/g, '');
  if (!raw) errors.cardNumber = 'Card number is required.';
  else if (raw.length !== 16) errors.cardNumber = 'Card number must be 16 digits.';
  if (!form.expiryDate) {
    errors.expiryDate = 'Expiry date is required.';
  } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.expiryDate)) {
    errors.expiryDate = 'Enter a valid expiry date (MM/YY).';
  } else {
    const [mm, yy] = form.expiryDate.split('/').map(Number);
    const now = new Date();
    const expYear = 2000 + yy;
    if (expYear < now.getFullYear() || (expYear === now.getFullYear() && mm < now.getMonth() + 1)) {
      errors.expiryDate = 'This card has expired.';
    }
  }
  if (!form.cvv) errors.cvv = 'CVV is required.';
  else if (!/^\d{3}$/.test(form.cvv)) errors.cvv = 'CVV must be 3 digits.';
  return errors;
};

// ── Bank Card Visual ──────────────────────────────────────────────────────────
function CardVisual({ card }) {
  return (
    <View style={styles.cardVisual}>
      <View style={styles.cardVisualHeader}>
        <MaterialIcons name="contactless" size={28} color="rgba(255,255,255,0.4)" />
        <Text style={styles.cardVisualBrand}>✦ CARD</Text>
      </View>
      <Text style={styles.cardVisualNumber}>**** **** **** {(card.cardNumber || '').slice(-4)}</Text>
      <View style={styles.cardVisualFooter}>
        <View>
          <Text style={styles.cardVisualMeta}>CARD HOLDER</Text>
          <Text style={styles.cardVisualValue}>{card.cardHolderName}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.cardVisualMeta}>EXPIRES</Text>
          <Text style={styles.cardVisualValue}>{card.expiryDate}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function TenantWalletScreen({ navigation }) {
  const { user } = useAuth();
  const [cards, setCards]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modalVisible, setModal]    = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [errors, setErrors]         = useState({});
  const [saving, setSaving]         = useState(false);

  const uid = user?._id || user?.id;

  const fetchCards = useCallback(async () => {
    if (!uid) return;
    try {
      setLoading(true);
      const res = await getBankCards(uid);
      setCards(res.data || []);
    } catch (err) {
      console.error('Fetch cards error:', err);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  // ── Input formatting ─────────────────────────────────────────────────────
  const handleInput = (field, value) => {
    if (field === 'cardNumber') {
      value = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
    }
    if (field === 'expiryDate') {
      value = value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1/$2').slice(0, 5);
    }
    if (field === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 3);
    }
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setModal(true);
  };

  const openEdit = (card) => {
    setForm({ ...card, cvv: '' });
    setErrors({});
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setErrors({});
    setForm(EMPTY_FORM);
  };

  // ── Save card ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const errs = validateCard(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, ownerId: uid };
      if (form._id) {
        await updateBankCard(form._id, payload);
      } else {
        await saveBankCard(payload);
      }
      Alert.alert('Success', 'Card saved successfully!');
      closeModal();
      fetchCards();
    } catch (err) {
      Alert.alert('Error', 'Failed to save card.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete card ───────────────────────────────────────────────────────────
  const handleDelete = (cardId) => {
    Alert.alert('Delete Card', 'Are you sure you want to delete this card?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteBankCard(cardId);
            fetchCards();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete card.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn} activeOpacity={0.85}>
          <MaterialIcons name="add" size={20} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* Card List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {cards.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MaterialIcons name="credit-card-off" size={48} color={Colors.outlineVariant} />
              </View>
              <Text style={styles.emptyTitle}>No saved cards</Text>
              <Text style={styles.emptySubtitle}>Add a card to quickly pay rent each month.</Text>
              <TouchableOpacity style={styles.addFirstBtn} onPress={openAdd} activeOpacity={0.85}>
                <MaterialIcons name="add-card" size={18} color="#fff" />
                <Text style={styles.addFirstBtnText}>Add Your First Card</Text>
              </TouchableOpacity>
            </View>
          ) : (
            cards.map(card => (
              <View key={card._id || card.id} style={styles.cardContainer}>
                <CardVisual card={card} />
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(card)} activeOpacity={0.8}>
                    <MaterialIcons name="edit" size={16} color={Colors.secondary} />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(card._id || card.id)} activeOpacity={0.8}>
                    <MaterialIcons name="delete-outline" size={16} color={Colors.error} />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Add / Edit Card Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{form._id ? 'Edit Bank Card' : 'Add Bank Card'}</Text>
              <TouchableOpacity onPress={closeModal} activeOpacity={0.7}>
                <MaterialIcons name="close" size={24} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Card Holder Name */}
              <Text style={styles.fieldLabel}>CARD HOLDER NAME</Text>
              <TextInput
                style={[styles.input, errors.cardHolderName && styles.inputError]}
                placeholder="JOHN DOE"
                placeholderTextColor={Colors.outline}
                autoCapitalize="characters"
                value={form.cardHolderName}
                onChangeText={v => handleInput('cardHolderName', v)}
              />
              {errors.cardHolderName ? <Text style={styles.errorText}>{errors.cardHolderName}</Text> : null}

              {/* Card Number */}
              <Text style={styles.fieldLabel}>CARD NUMBER</Text>
              <TextInput
                style={[styles.input, errors.cardNumber && styles.inputError]}
                placeholder="xxxx xxxx xxxx xxxx"
                placeholderTextColor={Colors.outline}
                keyboardType="number-pad"
                value={form.cardNumber}
                onChangeText={v => handleInput('cardNumber', v)}
                maxLength={19}
              />
              {errors.cardNumber ? <Text style={styles.errorText}>{errors.cardNumber}</Text> : null}

              {/* Expiry + CVV */}
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>EXPIRY DATE</Text>
                  <TextInput
                    style={[styles.input, errors.expiryDate && styles.inputError]}
                    placeholder="MM/YY"
                    placeholderTextColor={Colors.outline}
                    keyboardType="number-pad"
                    value={form.expiryDate}
                    onChangeText={v => handleInput('expiryDate', v)}
                    maxLength={5}
                  />
                  {errors.expiryDate ? <Text style={styles.errorText}>{errors.expiryDate}</Text> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>CVV</Text>
                  <TextInput
                    style={[styles.input, errors.cvv && styles.inputError]}
                    placeholder="***"
                    placeholderTextColor={Colors.outline}
                    keyboardType="number-pad"
                    secureTextEntry
                    value={form.cvv}
                    onChangeText={v => handleInput('cvv', v)}
                    maxLength={3}
                  />
                  {errors.cvv ? <Text style={styles.errorText}>{errors.cvv}</Text> : null}
                </View>
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeModal} activeOpacity={0.7}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.btnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.saveBtnText}>Save Card</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceContainerHigh,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  addBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(0,101,145,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 72, gap: 12 },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: Colors.primary },
  emptySubtitle: { fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center' },
  addFirstBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.secondary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8,
  },
  addFirstBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Card visual
  cardContainer: { marginBottom: 18 },
  cardVisual: {
    backgroundColor: Colors.primary, borderRadius: 20, padding: 22,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16,
    elevation: 8,
  },
  cardVisualHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  cardVisualBrand:   { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  cardVisualNumber:  { fontSize: 20, fontWeight: '700', color: '#fff', letterSpacing: 4, marginBottom: 24, fontVariant: ['tabular-nums'] },
  cardVisualFooter:  { flexDirection: 'row', justifyContent: 'space-between' },
  cardVisualMeta:    { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase' },
  cardVisualValue:   { fontSize: 14, fontWeight: '700', color: '#fff', marginTop: 2 },

  cardActions: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 4, marginTop: 10,
  },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(0,101,145,0.07)',
    borderWidth: 1, borderColor: 'rgba(0,101,145,0.15)',
  },
  editBtnText:   { fontSize: 13, fontWeight: '700', color: Colors.secondary },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(186,26,26,0.07)',
    borderWidth: 1, borderColor: 'rgba(186,26,26,0.15)',
  },
  deleteBtnText: { fontSize: 13, fontWeight: '700', color: Colors.error },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary },

  // Form fields
  fieldLabel: {
    fontSize: 10, fontWeight: '800', color: Colors.onSurfaceVariant,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6, marginTop: 12,
  },
  input: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 11,
    fontSize: 15, color: Colors.onSurface, borderWidth: 1.5, borderColor: Colors.surfaceContainerHigh,
    marginBottom: 2,
  },
  inputError: { borderColor: Colors.error },
  errorText:  { fontSize: 11, color: Colors.error, marginBottom: 4, marginLeft: 2 },
  row:        { flexDirection: 'row', gap: 12 },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.outlineVariant, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: Colors.onSurfaceVariant },
  saveBtn: {
    flex: 1, backgroundColor: Colors.secondary, paddingVertical: 14,
    borderRadius: 12, alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  btnDisabled: { opacity: 0.45 },
});
