import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Platform,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

import NativeDatePicker from '../../components/NativeDatePicker';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import {
  getWallet,
  getWalletTransactions,
  getAllInvoices,
  updateInvoiceStatus,
  sendInvoice,
  getBankCards,
  saveBankCard,
  deleteBankCard,
  withdrawFromWallet,
  getOwnerTenants,
  updateExternalPaymentStatus
} from '../../services/paymentService';
import { getMyProperties } from '../../services/propertyService';

export default function OwnerFinanceScreen({ navigation }) {
  const { user } = useAuth();
  
  // Navigation Tabs
  const [activeSegment, setActiveSegment] = useState('bills'); // 'bills' | 'cards' | 'wallet' | 'external'
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data State
  const [invoices, setInvoices] = useState([]);
  const [walletInfo, setWalletInfo] = useState({ balance: 0, currency: 'USD' });
  const [transactions, setTransactions] = useState([]);
  const [cards, setCards] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [externalPayments, setExternalPayments] = useState([]);
  
  // Modal states
  const [showGenerateBill, setShowGenerateBill] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [viewSlip, setViewSlip] = useState(null);
  
  // Form states
  const [newBill, setNewBill] = useState({ 
    tenantId: '', tenantName: '', tenantEmail: '', unit: '',
    baseRent: '', electricity: '', water: '', other: '',
    dueDate: null
  });
  const [billError, setBillError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [newCard, setNewCard] = useState({ cardHolderName: '', cardNumber: '', expiryDate: '', cvv: '' });
  const [cardError, setCardError] = useState('');

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      if (!user?._id) return;
      const ownerId = user._id;

      const [invRes, walRes, txnRes, crdRes, tenRes, propRes] = await Promise.all([
        getAllInvoices(),
        getWallet(ownerId).catch(() => ({ data: { balance: 0, currency: 'USD' } })),
        getWalletTransactions(ownerId).catch(() => ({ data: [] })),
        getBankCards(ownerId).catch(() => ({ data: [] })),
        getOwnerTenants(ownerId).catch(() => ({ data: [] })),
        getMyProperties().catch(() => [])
      ]);

      const rawTenantsBody = tenRes.data || {};
      const rawTenants = Array.isArray(rawTenantsBody.data) ? rawTenantsBody.data : (Array.isArray(rawTenantsBody) ? rawTenantsBody : []);
      setTenants(rawTenants);

      const allInvoices = Array.isArray(invRes.data) ? invRes.data : [];
      const myInvoices = allInvoices.filter(i => {
        const invOwner = i.ownerId?._id?.toString() || i.ownerId?.toString() || i.ownerId;
        return invOwner === ownerId;
      });
      setInvoices(myInvoices);

      const pendingExternal = allInvoices.filter(i => {
        const invOwner = i.ownerId?._id?.toString() || i.ownerId?.toString() || i.ownerId;
        return invOwner === ownerId && i.externalPaymentStatus === 'PENDING';
      });
      setExternalPayments(pendingExternal);

      setWalletInfo(walRes.data || { balance: 0, currency: 'USD' });
      setTransactions(Array.isArray(txnRes.data) ? txnRes.data : []);
      setCards(Array.isArray(crdRes.data) ? crdRes.data : []);
      setProperties(propRes || []);
      
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?._id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData])
  );

  // === CARDS ===
  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : cleaned;
  };

  const formatExpiryDate = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleAddCard = async () => {
    setCardError('');
    const name = newCard.cardHolderName.trim();
    const number = newCard.cardNumber.replace(/\s/g, '');
    const expiry = newCard.expiryDate.trim();
    const cvv = newCard.cvv.trim();

    if (!name || !number || !expiry || !cvv) {
      return setCardError('All fields are required.');
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return setCardError('Name must only contain characters.');
    }
    if (number.length !== 16) {
      return setCardError('Card number must be exactly 16 digits.');
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      return setCardError('Expiry must be in valid MM/YY format.');
    }
    if (cvv.length < 3) {
      return setCardError('CVV must be at least 3 digits.');
    }
    const [month, year] = expiry.split('/');
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      return setCardError('This card has expired.');
    }

    try {
      await saveBankCard({ ownerId: user._id, cardHolderName: name, cardNumber: number, expiryDate: expiry, cvv });
      setShowAddCardModal(false);
      setNewCard({ cardHolderName: '', cardNumber: '', expiryDate: '', cvv: '' });
      fetchData();
    } catch (error) {
      setCardError(error.response?.data?.message || 'Could not save card.');
    }
  };

  const handleDeleteCard = (cardId) => {
    if (!cardId) return Alert.alert('Error', 'Invalid card ID.');
    Alert.alert('Delete Card', 'Are you sure you want to delete this card?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteBankCard(cardId);
          await fetchData();
        } catch (error) {
          Alert.alert('Error', error.response?.data?.message || 'Could not delete card.');
        }
      }}
    ]);
  };

  // === WITHDRAW ===
  const handleWithdraw = async () => {
    setWithdrawError('');
    if (!selectedCardId) return setWithdrawError('Please select a card.');
    const amount = parseFloat(withdrawAmount);
    if (!amount || isNaN(amount) || amount <= 0) return setWithdrawError('Please enter a valid amount.');
    if (amount > walletInfo.balance) return setWithdrawError('Insufficient funds.');

    try {
      await withdrawFromWallet(user._id, amount, selectedCardId);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setSelectedCardId('');
      Alert.alert('Success', 'Funds have been withdrawn successfully.');
      fetchData();
    } catch (error) {
      setWithdrawError(error.response?.data?.message || 'Withdrawal failed.');
    }
  };

  // === BILLS ===
  const handleSelectTenant = (tenant) => {
    // Backend returns flat structure: { tenantId, tenantName, tenantEmail, propertyTitle, rentalFee }
    setNewBill({
      ...newBill,
      tenantId: tenant.tenantId || '',
      tenantName: tenant.tenantName || '',
      tenantEmail: tenant.tenantEmail || '',
      unit: tenant.propertyTitle || 'Unknown Property',
      baseRent: (tenant.rentalFee || '').toString()
    });
  };

  const handleSelectProperty = (property) => {
    if (!property) return;
    const pId = String(property._id || property.id || '').trim();
    const pTitle = String(property.title || '').trim().toLowerCase();

    // Find if there's an active tenant/agreement for this property
    const t = (tenants || []).find(ten => {
      const tenPropId = String(ten.propertyId || '').trim();
      const tenPropTitle = String(ten.propertyTitle || '').trim().toLowerCase();
      
      const idMatch = pId && tenPropId && tenPropId === pId;
      const titleMatch = pTitle && tenPropTitle && tenPropTitle === pTitle;
      
      return idMatch || titleMatch;
    });

    if (t) {
      setNewBill({
        ...newBill,
        tenantId: t.tenantId || '',
        tenantName: t.tenantName || '',
        tenantEmail: t.tenantEmail || '',
        unit: property.title,
        baseRent: (t.rentalFee || property.priceRaw || property.price || '').toString()
      });
    } else {
      setNewBill({
        ...newBill,
        tenantId: '',
        tenantName: '',
        tenantEmail: '',
        unit: property.title,
        baseRent: (property.priceRaw || property.price || property.priceRaw || '').toString()
      });
    }
  };

  const handleGenerateBill = async () => {
    setBillError('');
    if (!newBill.tenantId) return setBillError('Please select a tenant.');
    if (!newBill.dueDate) return setBillError('Due date is required.');
    
    const bRent = parseFloat(newBill.baseRent) || 0;
    const elec = parseFloat(newBill.electricity) || 0;
    const water = parseFloat(newBill.water) || 0;
    const other = parseFloat(newBill.other) || 0;
    const amount = bRent + elec + water + other;
    
    if (amount <= 0) return setBillError('Total bill amount must be greater than 0.');

    try {
      // Build items array matching backend Invoice model
      const items = [
        { description: 'Base Rent', amount: bRent },
        ...(elec > 0 ? [{ description: 'Electricity', amount: elec }] : []),
        ...(water > 0 ? [{ description: 'Water', amount: water }] : []),
        ...(other > 0 ? [{ description: 'Other Charges', amount: other }] : []),
      ];
      const invoiceDTO = {
        invoiceNo: `INV-${Date.now()}`,
        ownerId: user._id,
        tenantId: newBill.tenantId,
        tenantName: newBill.tenantName,
        tenantEmail: newBill.tenantEmail,
        unit: newBill.unit,
        total: amount,
        dueDate: newBill.dueDate.toISOString(),
        items,
        status: 'SENT'
      };
      await sendInvoice(invoiceDTO);
      setShowGenerateBill(false);
      setNewBill({ 
        tenantId: '', tenantName: '', tenantEmail: '', unit: '',
        baseRent: '', electricity: '', water: '', other: '',
        dueDate: null
      });
      Alert.alert('Success', 'Bill generated and sent to tenant.');
      fetchData();
    } catch (error) {
      setBillError(error.response?.data?.message || 'Failed to generate bill.');
    }
  };

  const handleExternalStatus = async (invoiceId, status) => {
    try {
      setLoading(true);
      await updateExternalPaymentStatus(invoiceId, status);
      Alert.alert('Success', `Payment ${status.toLowerCase()} successfully.`);
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update status.');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: 10 }}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finance Hub</Text>
      </View>

      <View style={styles.segmentContainer}>
        <TouchableOpacity style={[styles.segmentBtn, activeSegment === 'bills' && styles.segmentBtnActive]} onPress={() => setActiveSegment('bills')}>
          <Text style={[styles.segmentText, activeSegment === 'bills' && styles.segmentTextActive]}>Bills</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.segmentBtn, activeSegment === 'wallet' && styles.segmentBtnActive]} onPress={() => setActiveSegment('wallet')}>
          <Text style={[styles.segmentText, activeSegment === 'wallet' && styles.segmentTextActive]}>Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.segmentBtn, activeSegment === 'cards' && styles.segmentBtnActive]} onPress={() => setActiveSegment('cards')}>
          <Text style={[styles.segmentText, activeSegment === 'cards' && styles.segmentTextActive]}>Cards</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.segmentBtn, activeSegment === 'external' && styles.segmentBtnActive]} onPress={() => setActiveSegment('external')}>
          <Text style={[styles.segmentText, activeSegment === 'external' && styles.segmentTextActive]}>Slips</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* === BILLS TAB === */}
        {activeSegment === 'bills' && (
          <View>
            <TouchableOpacity style={styles.generateBtn} onPress={() => setShowGenerateBill(true)}>
              <MaterialIcons name="receipt" size={24} color="#fff" />
              <Text style={styles.generateBtnText}>Generate New Bill</Text>
            </TouchableOpacity>
            
            <Text style={styles.sectionTitle}>Generated Bills</Text>
            {invoices.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="receipt-long" size={48} color={Colors.outlineVariant} />
                <Text style={styles.emptyText}>No bills generated yet.</Text>
              </View>
            ) : (
              invoices.map((inv, index) => (
                <View key={inv._id || `inv-${index}`} style={styles.cardItem}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Bill to: {inv.tenantName || inv.tenantId?.name || 'Tenant'}</Text>
                    <Text style={styles.cardAmount}>${(inv.total || 0).toFixed(2)}</Text>
                  </View>
                  <Text style={styles.cardSub}>Due: {new Date(inv.dueDate).toLocaleDateString()}</Text>
                  <Text style={styles.cardSub}>Status: {(inv.status || '').toUpperCase()}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* === WALLET TAB === */}
        {activeSegment === 'wallet' && (
          <View>
            <LinearGradient colors={['#0ea5e9', '#0284c7']} style={styles.walletBalanceCard}>
              <Text style={styles.walletLabel}>Available Balance</Text>
              <Text style={styles.walletBalance}>${(walletInfo?.balance || 0).toFixed(2)}</Text>
              <TouchableOpacity style={styles.withdrawBtn} onPress={() => setShowWithdrawModal(true)}>
                <Text style={styles.withdrawBtnText}>Withdraw Funds</Text>
              </TouchableOpacity>
            </LinearGradient>
            
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="history" size={48} color={Colors.outlineVariant} />
                <Text style={styles.emptyText}>No recent transactions.</Text>
              </View>
            ) : (
              transactions.map((txn, index) => (
                <View key={txn._id || `txn-${index}`} style={styles.cardItem}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{txn.type.toUpperCase()} - {txn.status}</Text>
                    <Text style={[styles.cardAmount, { color: txn.type === 'DEPOSIT' ? '#10b981' : '#ef4444' }]}>
                      {txn.type === 'DEPOSIT' ? '+' : '-'}${(txn.amount || 0).toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.cardSub}>{new Date(txn.timestamp || txn.createdAt).toLocaleDateString()}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* === CARDS TAB === */}
        {activeSegment === 'cards' && (
          <View>
            <TouchableOpacity style={styles.generateBtn} onPress={() => setShowAddCardModal(true)}>
              <MaterialIcons name="add-card" size={24} color="#fff" />
              <Text style={styles.generateBtnText}>Add New Card</Text>
            </TouchableOpacity>
            
            <Text style={styles.sectionTitle}>Saved Cards</Text>
            {cards.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="credit-card" size={48} color={Colors.outlineVariant} />
                <Text style={styles.emptyText}>No cards added yet.</Text>
              </View>
            ) : (
              cards.map((card, index) => {
                const cId = card._id || card.id || `card-${index}`;
                return (
                  <View key={cId} style={styles.bankCardItem}>
                    <View style={styles.bankCardLeft}>
                      <MaterialIcons name="credit-card" size={28} color={Colors.primary} />
                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.cardTitle}>**** **** **** {card.cardNumber?.slice(-4)}</Text>
                        <Text style={styles.cardSub}>{card.cardHolderName}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteCard(cId)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                      <MaterialIcons name="delete" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* === EXTERNAL SLIPS TAB === */}
        {activeSegment === 'external' && (
          <View>
            <Text style={styles.sectionTitle}>Pending Payment Slips</Text>
            {externalPayments.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="fact-check" size={48} color={Colors.outlineVariant} />
                <Text style={styles.emptyText}>No pending slips to review.</Text>
              </View>
            ) : (
              externalPayments.map((inv, index) => (
                <View key={inv.id || inv._id || `ext-${index}`} style={styles.cardItem}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{inv.tenantName || 'Tenant'}</Text>
                    <Text style={styles.cardAmount}>${(inv.total || 0).toFixed(2)}</Text>
                  </View>
                  <Text style={styles.cardSub}>Invoice: {inv.invoiceNo}</Text>
                  
                  <TouchableOpacity 
                    style={styles.viewSlipBtn} 
                    onPress={() => setViewSlip(inv)}
                  >
                    <MaterialIcons name="image" size={18} color={Colors.secondary} />
                    <Text style={styles.viewSlipText}>View Payment Slip</Text>
                  </TouchableOpacity>

                  <View style={styles.externalActions}>
                    <TouchableOpacity 
                      style={[styles.externalActionBtn, styles.rejectBtn]} 
                      onPress={() => handleExternalStatus(inv.id || inv._id, 'REJECTED')}
                    >
                      <Text style={styles.externalActionText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.externalActionBtn, styles.acceptBtn]} 
                      onPress={() => handleExternalStatus(inv.id || inv._id, 'ACCEPTED')}
                    >
                      <Text style={styles.externalActionText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* GENERATE BILL MODAL */}
      <Modal visible={showGenerateBill} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generate New Bill</Text>
              <TouchableOpacity onPress={() => setShowGenerateBill(false)}>
                <MaterialIcons name="close" size={24} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{maxHeight: '85%'}} contentContainerStyle={{paddingBottom: 40}}>
              {billError ? <Text style={styles.errorText}>{billError}</Text> : null}
              
              <Text style={styles.inputLabel}>Select Property</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16}}>
                {(properties || []).map((p, index) => {
                  const pId = p._id || p.id || `prop-${index}`;
                  const isSelected = newBill.unit === p.title;
                  return (
                    <TouchableOpacity 
                      key={pId} 
                      style={[styles.tenantChip, isSelected && styles.tenantChipActive]}
                      onPress={() => handleSelectProperty(p)}
                    >
                      <Text style={[styles.tenantChipText, isSelected && styles.tenantChipTextActive]}>
                        {p.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>{newBill.unit && !newBill.tenantId ? (
                <View style={[styles.errorText, {backgroundColor: '#fffbeb', borderColor: '#fef3c7', borderWidth: 1}]}>
                  <Text style={{color: '#92400e', fontWeight: '700'}}>No active tenant found for this property.</Text>
                  <Text style={{color: '#92400e', fontSize: 11, marginTop: 4}}>
                    Ensure the tenant has an APPROVED booking or an ACTIVE agreement.
                  </Text>
                </View>
              ) : null}{newBill.tenantName ? (
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.inputLabel}>Selected Tenant</Text>
                  <View style={styles.tenantDisplayBox}>
                    <MaterialIcons name="person" size={20} color={Colors.primary} />
                    <Text style={styles.tenantNameValue}>{newBill.tenantName}</Text>
                  </View>
                </View>
              ) : null}
              
              <Text style={styles.inputLabel}>Base Rent ($)</Text>
              <TextInput style={styles.inputField} keyboardType="numeric" value={newBill.baseRent} onChangeText={(v) => setNewBill({...newBill, baseRent: v.replace(/[^0-9.]/g, '')})} placeholder="e.g. 1000" />
              
              <Text style={styles.inputLabel}>Electricity ($) - Optional</Text>
              <TextInput style={styles.inputField} keyboardType="numeric" value={newBill.electricity} onChangeText={(v) => setNewBill({...newBill, electricity: v.replace(/[^0-9.]/g, '')})} placeholder="e.g. 50" />
              
              <Text style={styles.inputLabel}>Water ($) - Optional</Text>
              <TextInput style={styles.inputField} keyboardType="numeric" value={newBill.water} onChangeText={(v) => setNewBill({...newBill, water: v.replace(/[^0-9.]/g, '')})} placeholder="e.g. 30" />
              
              <Text style={styles.inputLabel}>Other Charges ($) - Optional</Text>
              <TextInput style={styles.inputField} keyboardType="numeric" value={newBill.other} onChangeText={(v) => setNewBill({...newBill, other: v.replace(/[^0-9.]/g, '')})} placeholder="e.g. 20" />
              
              <Text style={styles.inputLabel}>Due Date</Text>
              {Platform.OS === 'web' ? (
                <input 
                  type="date" 
                  style={styles.webDateInput}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    if(!isNaN(date)) setNewBill({...newBill, dueDate: date});
                  }}
                />
              ) : (
                <TouchableOpacity style={styles.inputField} onPress={() => setShowDatePicker(true)}>
                  <Text>{newBill.dueDate ? newBill.dueDate.toLocaleDateString() : 'Select a due date'}</Text>
                </TouchableOpacity>
              )}
              
              {showDatePicker && Platform.OS !== 'web' && (
                <NativeDatePicker 
                  value={newBill.dueDate || new Date()} 
                  mode="date" 
                  display="spinner"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if(selectedDate) setNewBill({...newBill, dueDate: selectedDate});
                  }} 
                />
              )}
              
              <TouchableOpacity style={styles.submitModalBtn} onPress={handleGenerateBill}>
                <Text style={styles.submitModalBtnText}>Send Bill</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ADD CARD MODAL */}
      <Modal visible={showAddCardModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Card</Text>
              <TouchableOpacity onPress={() => setShowAddCardModal(false)}>
                <MaterialIcons name="close" size={24} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{paddingBottom: 20}}>
              {cardError ? <Text style={styles.errorText}>{cardError}</Text> : null}
              
              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <TextInput style={styles.inputField} value={newCard.cardHolderName} onChangeText={(v) => setNewCard({...newCard, cardHolderName: v.replace(/[^a-zA-Z\s]/g, '')})} placeholder="John Doe" />
              
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput style={styles.inputField} keyboardType="numeric" maxLength={19} value={newCard.cardNumber} onChangeText={(v) => setNewCard({...newCard, cardNumber: formatCardNumber(v)})} placeholder="1234 5678 9012 3456" />
              
              <View style={{flexDirection: 'row', gap: 16}}>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>Expiry (MM/YY)</Text>
                  <TextInput style={styles.inputField} keyboardType="numeric" maxLength={5} value={newCard.expiryDate} onChangeText={(v) => setNewCard({...newCard, expiryDate: formatExpiryDate(v)})} placeholder="12/25" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput style={styles.inputField} keyboardType="numeric" maxLength={4} value={newCard.cvv} onChangeText={(v) => setNewCard({...newCard, cvv: v.replace(/\D/g, '')})} placeholder="123" secureTextEntry />
                </View>
              </View>
              
              <TouchableOpacity style={styles.submitModalBtn} onPress={handleAddCard}>
                <Text style={styles.submitModalBtnText}>Save Card</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* WITHDRAW MODAL */}
      <Modal visible={showWithdrawModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw Funds</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <MaterialIcons name="close" size={24} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>
            
            {withdrawError ? <Text style={styles.errorText}>{withdrawError}</Text> : null}
            
            <Text style={styles.inputLabel}>Select Destination Card</Text>
            {cards.length === 0 ? (
              <Text style={{color: '#ef4444', marginBottom: 16}}>Please add a bank card first.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16}}>
                {cards.map(c => {
                  const cId = c._id || c.id;
                  return (
                    <TouchableOpacity 
                      key={cId} 
                      style={[styles.tenantChip, selectedCardId === cId && styles.tenantChipActive]}
                      onPress={() => setSelectedCardId(cId)}
                    >
                      <Text style={[styles.tenantChipText, selectedCardId === cId && styles.tenantChipTextActive]}>
                        **** {c.cardNumber?.slice(-4)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <Text style={styles.inputLabel}>Amount to Withdraw ($)</Text>
            <TextInput style={styles.inputField} keyboardType="numeric" value={withdrawAmount} onChangeText={setWithdrawAmount} placeholder="e.g. 500" />
            
            <TouchableOpacity style={styles.submitModalBtn} onPress={handleWithdraw} disabled={cards.length === 0}>
              <Text style={styles.submitModalBtnText}>Withdraw Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* VIEW SLIP MODAL */}
      <Modal visible={!!viewSlip} transparent animationType="fade">
        <View style={styles.slipOverlay}>
          <View style={styles.slipContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Verification</Text>
              <TouchableOpacity onPress={() => setViewSlip(null)}>
                <MaterialIcons name="close" size={28} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>
            {viewSlip?.externalPaymentSlip ? (
              <Image 
                source={{ uri: viewSlip.externalPaymentSlip }} 
                style={styles.fullSlipImage}
              />
            ) : (
              <Text style={{ textAlign: 'center', padding: 40 }}>No slip image found.</Text>
            )}
            <View style={{ marginTop: 20 }}>
               <Text style={styles.cardTitle}>{viewSlip?.tenantName}</Text>
               <Text style={styles.cardSub}>Total Amount: ${(viewSlip?.total || 0).toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  
  segmentContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  segmentBtnActive: { borderBottomColor: Colors.primary },
  segmentText: { fontSize: 14, fontWeight: '600', color: Colors.onSurfaceVariant },
  segmentTextActive: { color: Colors.primary, fontWeight: '800' },
  
  content: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary, marginBottom: 12, marginTop: 12 },
  
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, padding: 16, borderRadius: 12, marginBottom: 16, gap: 8 },
  generateBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: '#f8fafc', borderRadius: 12 },
  emptyText: { marginTop: 10, color: Colors.onSurfaceVariant, fontSize: 14 },
  
  cardItem: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  cardAmount: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  cardSub: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 2 },
  
  walletBalanceCard: { padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  walletLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  walletBalance: { color: '#fff', fontSize: 40, fontWeight: '800', marginVertical: 8 },
  withdrawBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 8 },
  withdrawBtnText: { color: '#fff', fontWeight: '700' },

  bankCardItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  bankCardLeft: { flexDirection: 'row', alignItems: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  
  inputLabel: { fontSize: 14, fontWeight: '600', color: Colors.onSurface, marginBottom: 8, marginTop: 12 },
  inputField: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 16, backgroundColor: '#f8fafc' },
  webDateInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 16, backgroundColor: '#f8fafc', width: '100%', outlineStyle: 'none' },
  
  submitModalBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  submitModalBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  errorText: { color: '#ef4444', backgroundColor: '#fef2f2', padding: 10, borderRadius: 8, marginBottom: 12, fontWeight: '600', overflow: 'hidden' },
  
  tenantChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 10 },
  tenantChipActive: { backgroundColor: Colors.primary },
  tenantChipText: { color: Colors.onSurfaceVariant, fontWeight: '600' },
  tenantChipTextActive: { color: '#fff' },

  viewSlipBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: 'rgba(0,101,145,0.05)', padding: 10, borderRadius: 8 },
  viewSlipText: { fontSize: 13, fontWeight: '700', color: Colors.secondary },
  
  externalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  externalActionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  acceptBtn: { backgroundColor: '#10b981' },
  rejectBtn: { backgroundColor: '#ef4444' },
  externalActionText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  slipOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  slipContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  fullSlipImage: { width: '100%', height: 400, borderRadius: 12, resizeMode: 'contain' },
  tenantDisplayBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', padding: 12, borderRadius: 12, gap: 8 },
  tenantNameValue: { fontSize: 16, fontWeight: '700', color: Colors.primary },
});
