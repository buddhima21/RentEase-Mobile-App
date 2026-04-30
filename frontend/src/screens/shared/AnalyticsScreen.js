import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Stat Card Component ──────────────────────────────────────────────────────
function StatCard({ title, value, trend, icon, color = '#10b981' }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statCardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
          <MaterialIcons name={icon} size={20} color={color} />
        </View>
        {trend && (
          <View style={[styles.trendBadge, { backgroundColor: `${color}15` }]}>
            <MaterialIcons name="trending-up" size={12} color={color} />
            <Text style={[styles.trendText, { color }]}>{trend}</Text>
          </View>
        )}
      </View>
      <Text style={styles.statLabel}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

// ─── Custom Bar Chart (Safety Version - No SVG needed) ───────────────────────
function RevenueBarChart() {
  const data = [40, 70, 45, 90, 65, 85];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>Revenue Overview</Text>
          <Text style={styles.chartSubtitle}>Monthly revenue for active properties</Text>
        </View>
      </View>
      
      <View style={styles.barWrapper}>
        {data.map((h, i) => (
          <View key={i} style={styles.barColumn}>
            <View style={[styles.barBackground]}>
              <LinearGradient 
                colors={[Colors.secondary, Colors.secondaryContainer]} 
                style={[styles.barFill, { height: `${h}%` }]} 
              />
            </View>
            <Text style={styles.chartLabelText}>{months[i]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Custom Occupancy Card (Safety Version) ──────────────────────────────────
function OccupancyCard({ percentage = 72 }) {
  return (
    <View style={styles.donutCard}>
      <Text style={styles.chartTitle}>Occupancy</Text>
      <Text style={styles.chartSubtitle}>Current platform status</Text>
      
      <View style={styles.progressWrapper}>
        <View style={styles.progressBarBg}>
          <LinearGradient 
            colors={[Colors.secondary, Colors.secondaryContainer]} 
            start={{x:0, y:0}} end={{x:1, y:0}}
            style={[styles.progressBarFill, { width: `${percentage}%` }]} 
          />
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressValue}>{percentage}%</Text>
          <Text style={styles.progressLabel}>Occupied</Text>
        </View>
      </View>
    </View>
  );
}

export default function AnalyticsScreen({ navigation, route }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentView, setCurrentView] = useState(route?.params?.view || 'all');
  const [timeframe, setTimeframe] = useState('last_month'); // 'last_month', 'last_6_months', 'last_year'
  const [showTimeframeModal, setShowTimeframeModal] = useState(false);
  const [replyText, setReplyText] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const endpoint = isAdmin ? '/analytics/admin' : '/analytics/owner';
      const res = await API.get(`${endpoint}?timeframe=${timeframe}`);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useFocusEffect(useCallback(() => { fetchAnalytics(); }, [fetchAnalytics, timeframe]));

  const handleModerate = async (reviewId, newStatus) => {
    try {
      await API.put(`/reviews/owner/${reviewId}/status`, { status: newStatus });
      fetchAnalytics();
    } catch (err) {
      alert('Error updating review status');
    }
  };

  const handleReplySubmit = async (reviewId) => {
    if (!replyText[reviewId]?.trim()) return;
    try {
      await API.put(`/reviews/owner/${reviewId}/reply`, { reply: replyText[reviewId] });
      setReplyingTo(null);
      fetchAnalytics();
    } catch (err) {
      alert('Error submitting reply');
    }
  };

  const handleDeleteReview = (reviewId) => {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to permanently delete this review? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await API.delete(`/reviews/owner/${reviewId}`);
              fetchAnalytics();
            } catch (err) {
              alert('Error deleting review');
            }
          }
        }
      ]
    );
  };

  const generatePDF = async () => {
    const stats = data?.stats;
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #091426; }
            h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
            .date { color: #8590a6; margin-bottom: 30px; }
            .grid { display: flex; flex-wrap: wrap; gap: 20px; }
            .card { background: #f7f9fb; padding: 20px; border-radius: 10px; width: 45%; border: 1px solid #eceef0; }
            .label { font-size: 12px; color: #8590a6; text-transform: uppercase; font-weight: bold; }
            .value { font-size: 24px; font-weight: bold; margin-top: 5px; color: #091426; }
            .footer { margin-top: 50px; font-size: 12px; color: #c5c6cd; text-align: center; }
          </style>
        </head>
        <body>
          <h1>RentEase System Analytics</h1>
          <p class="date">Generated on: ${new Date().toLocaleDateString()}</p>
          <div class="grid">
            <div class="card"><div class="label">Total Revenue</div><div class="value">Rs. ${(stats?.revenue || stats?.estimatedRevenue)?.toLocaleString()}</div></div>
            <div class="card"><div class="label">Bookings</div><div class="value">${stats?.totalBookings || stats?.systemTotalBookings || 0}</div></div>
            <div class="card"><div class="label">Avg Rating</div><div class="value">${stats?.avgRating || 4.8} / 5.0</div></div>
            <div class="card"><div class="label">Properties</div><div class="value">${stats?.totalProperties || 0}</div></div>
          </div>
        </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (e) { console.log(e); }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.secondary} />
      </View>
    );
  }

  const stats = data?.stats || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back-ios" size={18} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerMainTitle}>System <Text style={{ color: Colors.secondary }}>Analytics</Text></Text>
          <Text style={styles.headerSubtitle}>Platform performance and growth.</Text>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAnalytics(true)} tintColor={Colors.secondary} />}
      >
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowTimeframeModal(true)}>
            <Text style={styles.filterText}>
              {timeframe === 'last_month' ? 'Last Month' : timeframe === 'last_6_months' ? 'Last 6 Months' : 'Last Year'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={18} color="#475569" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportBtn} onPress={generatePDF}>
            <LinearGradient colors={[Colors.secondary, '#00486b']} style={styles.exportGradient}>
              <Text style={styles.exportLabel}>Export Report</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {(currentView === 'all' || currentView === 'stats') && (
          <>
            <View style={styles.statsGrid}>
              <StatCard title="Total Revenue" value={`Rs. ${(stats.revenue || stats.estimatedRevenue || 0) / 1000}k`} trend="+12.5%" icon="payments" color={Colors.secondary} />
              <StatCard title="Active Bookings" value={stats.totalBookings || stats.systemTotalBookings || 0} trend="+8.2%" icon="calendar-today" color={Colors.secondary} />
              <StatCard title="Avg. Rating" value={stats.avgRating || 0} trend="+0.3" icon="star" color="#f59e0b" />
              <StatCard title="Total Properties" value={stats.totalProperties || 0} icon="home-work" color={Colors.primary} />
            </View>

            <RevenueBarChart />
            
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <OccupancyCard percentage={stats.occupancyRate || 0} />
              <View style={[styles.donutCard, { flex: 1, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                <MaterialIcons name="check-circle" size={32} color={Colors.secondaryContainer} />
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 8 }}>ALL SYSTEMS OK</Text>
              </View>
            </View>
          </>
        )}

        {(currentView === 'all' || currentView === 'reviews') && (
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>{isAdmin ? 'Recent Moderation' : 'Manage Reviews'}</Text>
            {data?.reviews?.map((review) => (
              <View key={review._id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewerName}>{review.user?.name}</Text>
                    <Text style={styles.propertyTitle}>{review.property?.title}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={styles.ratingBox}>
                      <MaterialIcons name="star" size={14} color="#f59e0b" />
                      <Text style={styles.ratingText}>{review.rating}</Text>
                    </View>
                    {!isAdmin && (
                      <TouchableOpacity onPress={() => handleDeleteReview(review._id)}>
                        <MaterialIcons name="delete-outline" size={20} color={Colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                
                <Text style={styles.reviewComment}>{review.comment}</Text>
                
                {review.status === 'pending' && !isAdmin && (
                  <View style={styles.moderationBtns}>
                    <TouchableOpacity 
                      style={[styles.modBtn, { backgroundColor: Colors.secondary }]} 
                      onPress={() => handleModerate(review._id, 'accepted')}
                    >
                      <Text style={styles.modBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modBtn, { backgroundColor: Colors.error }]} 
                      onPress={() => handleModerate(review._id, 'rejected')}
                    >
                      <Text style={styles.modBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {review.status === 'accepted' && !isAdmin && (
                  <View style={styles.replySection}>
                    {review.ownerReply ? (
                      <View style={styles.ownerReplyBox}>
                        <Text style={styles.replyLabel}>My Reply:</Text>
                        <Text style={styles.replyText}>{review.ownerReply}</Text>
                      </View>
                    ) : (
                      replyingTo === review._id ? (
                        <View style={styles.replyInputRow}>
                          <TextInput
                            style={styles.replyInput}
                            placeholder="Write a reply..."
                            value={replyText[review._id] || ''}
                            onChangeText={(text) => setReplyText(prev => ({ ...prev, [review._id]: text }))}
                          />
                          <TouchableOpacity style={styles.sendReplyBtn} onPress={() => handleReplySubmit(review._id)}>
                            <MaterialIcons name="send" size={20} color={Colors.secondary} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity onPress={() => setReplyingTo(review._id)}>
                          <Text style={[styles.addReplyText, { color: Colors.secondary }]}>+ Add Reply</Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                )}

                <View style={[styles.statusBadge, { backgroundColor: review.status === 'accepted' ? '#dcfce7' : review.status === 'rejected' ? '#fee2e2' : '#fef3c7' }]}>
                  <Text style={[styles.statusBadgeText, { color: review.status === 'accepted' ? '#166534' : review.status === 'rejected' ? '#991b1b' : '#92400e' }]}>
                    {review.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
            {(!data?.reviews || data.reviews.length === 0) && (
              <Text style={styles.emptyText}>No reviews found.</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Timeframe Selection Modal */}
      <Modal visible={showTimeframeModal} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowTimeframeModal(false)}
        >
          <View style={styles.timeframeModal}>
            <Text style={styles.modalTitle}>Select Timeframe</Text>
            {[
              { label: 'Last Month', value: 'last_month' },
              { label: 'Last 6 Months', value: 'last_6_months' },
              { label: 'Last Year', value: 'last_year' }
            ].map((opt) => (
              <TouchableOpacity 
                key={opt.value} 
                style={[styles.timeframeOption, timeframe === opt.value && styles.activeOption]}
                onPress={() => {
                  setTimeframe(opt.value);
                  setShowTimeframeModal(false);
                }}
              >
                <Text style={[styles.optionText, timeframe === opt.value && styles.activeOptionText]}>
                  {opt.label}
                </Text>
                {timeframe === opt.value && (
                  <MaterialIcons name="check" size={20} color={Colors.secondary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  headerTitleContainer: { flex: 1, marginLeft: 16 },
  headerMainTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  headerSubtitle: { fontSize: 11, color: '#64748b' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  timeframeModal: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '80%', elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginBottom: 16 },
  timeframeOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  activeOption: { borderBottomColor: Colors.secondary },
  optionText: { fontSize: 15, color: '#475569', fontWeight: '500' },
  activeOptionText: { color: Colors.secondary, fontWeight: '700' },

  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  exportBtn: { borderRadius: 10, overflow: 'hidden' },
  exportGradient: { paddingHorizontal: 16, paddingVertical: 8 },
  exportLabel: { color: '#fff', fontWeight: '800', fontSize: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { width: (SCREEN_WIDTH - 52) / 2, backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2 },
  statCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconCircle: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20 },
  trendText: { fontSize: 9, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  chartContainer: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 2 },
  chartHeader: { marginBottom: 16 },
  chartTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  chartSubtitle: { fontSize: 10, color: '#94a3b8' },
  barWrapper: { height: 100, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 },
  barColumn: { alignItems: 'center', gap: 8 },
  barBackground: { height: 80, width: 24, backgroundColor: '#f1f5f9', borderRadius: 12, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 12 },
  chartLabelText: { fontSize: 9, color: '#94a3b8', fontWeight: '700' },
  donutCard: { flex: 1.5, backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 2 },
  progressWrapper: { marginTop: 16 },
  progressBarBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressValue: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  progressLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  activitySection: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8, gap: 10 },
  activityText: { fontSize: 12, color: '#334155' },

  reviewCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, elevation: 2 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  reviewerName: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  propertyTitle: { fontSize: 11, color: '#64748b', marginTop: 2 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 12, fontWeight: '800', color: '#f59e0b' },
  reviewComment: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 16 },
  moderationBtns: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  modBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  modBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 20, fontStyle: 'italic' },
  
  replySection: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  ownerReplyBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12 },
  replyLabel: { fontSize: 10, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
  replyText: { fontSize: 13, color: '#334155', fontStyle: 'italic' },
  addReplyText: { fontSize: 13, fontWeight: '700', color: '#10b981' },
  replyInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  replyInput: { flex: 1, backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, fontSize: 13 },
  sendReplyBtn: { padding: 8 }
});
