import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet,
   ActivityIndicator, Alert, TextInput, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { getBankCards, saveBankCard, updateInvoiceStatus } from '../../services/paymentService';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
  `LKR ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

const BRAND_COLORS = { Visa: '#0055a6', Mastercard: '#c0392b', Amex: '#007bc1', Default: '#475569' };

// ── Card Tile ─────────────────────────────────────────────────────────────────
function CardTile({ card, selected, onSelect }) {
  const bg = BRAND_COLORS.Default;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onSelect(card.id || card._id)}
      style={[styles.cardTile, selected && styles.cardTileSelected]}
    >
      <View style={[styles.cardBrand, { backgroundColor: bg }]}>
        <Text style={styles.cardBrandText}>CARD</Text>
      </View>
      <View style={styles.cardTileInfo}>
        <Text style={styles.cardNumber}>•••• •••• •••• {(card.cardNumber || '').slice(-4)}</Text>
        <Text style={styles.cardExpiry}>Expires {card.expiryDate}</Text>
      </View>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function RentPaymentScreen({ navigation, route }) {
  const { bill, onPaid } = route.params || {};
  const { user } = useAuth();

  const displayAmount  = bill?.total   ? fmt(bill.total) : 'LKR 0.00';
  const displayUnit    = bill?.unit    || 'N/A';
  const displayBillNo  = bill?.invoiceNo || bill?.billNo || 'N/A';
  const displayDueDate = bill?.dueDate || 'TBD';

  const [method,       setMethod]       = useState('card');
  const [savedCards,   setSavedCards]   = useState([]);
  const [selectedCard, setSelectedCard] = useState('');
  const [showAddCard,  setShowAddCard]  = useState(false);

  const [name,    setName]    = useState(user?.name || '');
  const [email,   setEmail]   = useState(user?.email || '');
  const [bankAcc, setBankAcc] = useState('');

  const [newCard, setNewCard] = useState({ name: '', card: '', expiry: '', cvv: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cardsLoading, setCardsLoading] = useState(true);

  // Load saved cards
  useEffect(() => {
    const uid = user?._id || user?.id;
    if (!uid) return;
    getBankCards(uid)
      .then(res => {
        setSavedCards(res.data || []);
        if (res.data?.length > 0) setSelectedCard(res.data[0]._id || res.data[0].id);
      })
      .catch(err => console.error('Load cards error:', err))
      .finally(() => setCardsLoading(false));
  }, [user]);

  // ── New card input formatting ─────────────────────────────────────────────
  const handleNewCardInput = (field, value) => {
    if (field === 'card') {
      value = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
    }
    if (field === 'expiry') {
      value = value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1/$2').slice(0, 5);
    }
    if (field === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 3);
    }
    setNewCard(prev => ({ ...prev, [field]: value }));
  };

  const newCardValid =
    newCard.name && newCard.card.length === 19 && newCard.expiry.length === 5 && newCard.cvv.length === 3;

  // ── Add card ─────────────────────────────────────────────────────────────
  const handleAddCard = async () => {
    if (!newCardValid) return;
    const uid = user?._id || user?.id;
    if (!uid) return;
    setLoading(true);
    try {
      const res = await saveBankCard({
        ownerId:        uid,
        cardHolderName: newCard.name,
        cardNumber:     newCard.card,
        expiryDate:     newCard.expiry,
      });
      const saved = res.data;
      setSavedCards(prev => [...prev, saved]);
      setSelectedCard(saved._id || saved.id);
      setNewCard({ name: '', card: '', expiry: '', cvv: '' });
      setShowAddCard(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to save card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Submit payment ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!name || !email) {
      Alert.alert('Missing Info', 'Please enter your name and email.');
      return;
    }
    if (method === 'card' && !selectedCard) {
      Alert.alert('No Card', 'Please select a saved card or add a new one.');
      return;
    }
    if (method === 'bank' && !bankAcc) {
      Alert.alert('Missing Info', 'Please enter your bank account number.');
      return;
    }

    setLoading(true);
    try {
      // Simulate network delay
      await new Promise(r => setTimeout(r, 1500));
      const identifier = bill?.id || bill?.invoiceNo;
      await updateInvoiceStatus(identifier, 'PAID');
      setSuccess(true);
      if (onPaid) setTimeout(onPaid, 1800);
    } catch (err) {
      console.error('Payment error:', err);
      Alert.alert('Error', 'Payment processed but status update failed. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <View style={styles.successIconWrap}>
            <MaterialIcons name="check-circle" size={64} color="#10b981" />
          </View>
          <Text style={styles.successTitle}>Payment Sent!</Text>
          <Text style={styles.successMsg}>
            {displayAmount} has been successfully paid for {displayUnit}.{'\n'}
            A receipt has been sent to <Text style={{ fontWeight: '800' }}>{email}</Text>.
          </Text>
          <TouchableOpacity
            style={styles.successBtn}
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.successBtnText}>Back to Bills</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bill Payment Portal</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Amount Summary Banner */}
        <View style={styles.amountBanner}>
          <View>
            <Text style={styles.amountLabel}>TOTAL AMOUNT DUE</Text>
            <Text style={styles.amountValue}>{displayAmount}</Text>
            <Text style={styles.billMeta}>{displayUnit} · {displayBillNo}</Text>
          </View>
          <View style={styles.dueDateChip}>
            <Text style={styles.dueDateLabel}>DUE DATE</Text>
            <Text style={styles.dueDateValue}>{displayDueDate}</Text>
          </View>
        </View>

        {/* Payment Method Tabs */}
        <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
        <View style={styles.methodRow}>
          {[
            { id: 'card', icon: 'credit-card', label: 'Card' },
            { id: 'bank', icon: 'account-balance', label: 'Bank Transfer' },
          ].map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.methodTab, method === m.id && styles.methodTabActive]}
              activeOpacity={0.8}
              onPress={() => setMethod(m.id)}
            >
              <MaterialIcons name={m.icon} size={22} color={method === m.id ? '#fff' : Colors.onSurfaceVariant} />
              <Text style={[styles.methodLabel, method === m.id && styles.methodLabelActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Resident Info */}
        <Text style={styles.sectionLabel}>RESIDENT DETAILS</Text>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={Colors.outline}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor={Colors.outline}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Card Selection */}
        {method === 'card' && (
          <>
            <Text style={styles.sectionLabel}>SELECT CARD</Text>
            {cardsLoading ? (
              <ActivityIndicator color={Colors.secondary} style={{ marginVertical: 12 }} />
            ) : savedCards.length === 0 ? (
              <Text style={styles.noCardsText}>No saved cards. Add one below.</Text>
            ) : (
              savedCards.map(card => (
                <CardTile
                  key={card._id || card.id}
                  card={card}
                  selected={selectedCard === (card._id || card.id)}
                  onSelect={setSelectedCard}
                />
              ))
            )}

            {/* Add card toggle */}
            {!showAddCard ? (
              <TouchableOpacity
                style={styles.addCardBtn}
                activeOpacity={0.7}
                onPress={() => setShowAddCard(true)}
              >
                <MaterialIcons name="add-card" size={18} color={Colors.secondary} />
                <Text style={styles.addCardBtnText}>Add New Payment Method</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.addCardForm}>
                <View style={styles.addCardFormHeader}>
                  <Text style={styles.addCardFormTitle}>New Secure Card</Text>
                  <TouchableOpacity onPress={() => setShowAddCard(false)}>
                    <MaterialIcons name="close" size={22} color={Colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
                <TextInput style={styles.input} placeholder="Name on Card" placeholderTextColor={Colors.outline} value={newCard.name} onChangeText={v => handleNewCardInput('name', v)} />
                <TextInput style={styles.input} placeholder="Card Number" placeholderTextColor={Colors.outline} keyboardType="number-pad" value={newCard.card} onChangeText={v => handleNewCardInput('card', v)} maxLength={19} />
                <View style={styles.row}>
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder="MM/YY" placeholderTextColor={Colors.outline} keyboardType="number-pad" value={newCard.expiry} onChangeText={v => handleNewCardInput('expiry', v)} maxLength={5} />
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder="CVV" placeholderTextColor={Colors.outline} keyboardType="number-pad" secureTextEntry value={newCard.cvv} onChangeText={v => handleNewCardInput('cvv', v)} maxLength={3} />
                </View>
                <TouchableOpacity
                  style={[styles.saveCardBtn, !newCardValid && styles.btnDisabled]}
                  activeOpacity={0.85}
                  onPress={handleAddCard}
                  disabled={!newCardValid || loading}
                >
                  <Text style={styles.saveCardBtnText}>Save & Confirm Card</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Bank Transfer */}
        {method === 'bank' && (
          <>
            <Text style={styles.sectionLabel}>BANK ACCOUNT / ROUTING NUMBER</Text>
            <TextInput
              style={[styles.input, styles.bankInput]}
              placeholder="000000000 000000000"
              placeholderTextColor={Colors.outline}
              keyboardType="number-pad"
              value={bankAcc}
              onChangeText={setBankAcc}
            />
            <Text style={styles.bankNote}>Processing may take 3–5 business days for bank transfers.</Text>
          </>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.btnDisabled]}
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="lock" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Securely Pay {displayAmount}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* PCI note */}
        <View style={styles.pciRow}>
          <MaterialIcons name="verified-user" size={14} color={Colors.outline} />
          <Text style={styles.pciText}>PCI DSS Compliant · 256-bit SSL</Text>
        </View>
      </ScrollView>
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
  backBtn:     { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.primary, letterSpacing: -0.3 },
  headerRight: { width: 32 },

  scroll:       { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 60 },

  // Amount banner
  amountBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    backgroundColor: 'rgba(0,101,145,0.07)', borderRadius: 16, padding: 18, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(0,101,145,0.12)',
  },
  amountLabel: { fontSize: 10, fontWeight: '800', color: Colors.secondary, letterSpacing: 1, marginBottom: 4 },
  amountValue: { fontSize: 28, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  billMeta:    { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 4 },
  dueDateChip: {
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.surfaceContainerHigh,
  },
  dueDateLabel: { fontSize: 9, fontWeight: '800', color: Colors.onSurfaceVariant, letterSpacing: 1 },
  dueDateValue: { fontSize: 14, fontWeight: '800', color: Colors.secondary, marginTop: 2 },

  // Section label
  sectionLabel: {
    fontSize: 10, fontWeight: '800', color: Colors.onSurfaceVariant,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginTop: 4,
  },

  // Method tabs
  methodRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  methodTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 2, borderColor: 'transparent',
  },
  methodTabActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10,
    elevation: 6,
  },
  methodLabel:       { fontSize: 14, fontWeight: '700', color: Colors.onSurfaceVariant },
  methodLabelActive: { color: '#fff' },

  // Inputs
  inputGroup: { gap: 10, marginBottom: 20 },
  input: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 15, color: Colors.onSurface, borderWidth: 1.5, borderColor: Colors.surfaceContainerHigh,
  },
  row: { flexDirection: 'row', gap: 10 },
  bankInput: { fontSize: 18, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  bankNote: { fontSize: 12, color: Colors.onSurfaceVariant, fontStyle: 'italic', marginBottom: 20 },

  // Card tile
  cardTile: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, marginBottom: 10, borderRadius: 14,
    borderWidth: 2, borderColor: Colors.surfaceContainerHigh,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  cardTileSelected: {
    borderColor: Colors.secondary,
    backgroundColor: 'rgba(0,101,145,0.04)',
  },
  cardBrand: {
    width: 56, height: 40, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#475569',
  },
  cardBrandText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  cardTileInfo: { flex: 1 },
  cardNumber:   { fontSize: 16, fontWeight: '700', color: Colors.primary, letterSpacing: 2 },
  cardExpiry:   { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 3, borderColor: Colors.outlineVariant,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: Colors.secondary, backgroundColor: Colors.secondary },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

  noCardsText: { fontSize: 13, color: Colors.onSurfaceVariant, marginBottom: 10, fontStyle: 'italic' },

  // Add card button
  addCardBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, marginBottom: 20,
    borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.outlineVariant,
  },
  addCardBtnText: { fontSize: 13, fontWeight: '700', color: Colors.secondary },

  // Add card form
  addCardForm: {
    backgroundColor: Colors.surfaceContainerLow, borderRadius: 16,
    padding: 16, marginBottom: 20, gap: 10,
    borderWidth: 1, borderColor: Colors.surfaceContainerHigh,
  },
  addCardFormHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  addCardFormTitle: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  saveCardBtn: {
    backgroundColor: Colors.secondary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  saveCardBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Submit
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, marginTop: 10, marginBottom: 12,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16,
    elevation: 8,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  btnDisabled:   { opacity: 0.45 },

  pciRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  pciText: { fontSize: 11, color: Colors.outline },

  // Success
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  successIconWrap: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#d1fae5',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  successTitle: { fontSize: 28, fontWeight: '900', color: Colors.primary },
  successMsg: { fontSize: 15, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22 },
  successBtn: {
    backgroundColor: Colors.secondary, paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 12, marginTop: 12,
  },
  successBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
