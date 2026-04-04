import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import BottomNav from '../../components/navigation/BottomNav';
import { useAuth } from '../../context/AuthContext';

// ── Helpers ──
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
};

const getFirstName = (name) => {
  if (!name) return '';
  return name.trim().split(' ')[0];
};

const AVATAR_COLORS = [
  '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#14b8a6',
];
const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export default function OwnerDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const handleTabPress = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === 'home') navigation.navigate('Home');
    if (tabKey === 'listings') navigation.navigate('Listings');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <MaterialIcons name="maps-home-work" size={24} color={Colors.primary} />
          <Text style={styles.brand}>RentEase</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <MaterialIcons name="notifications" size={22} color={Colors.onSurface} />
          </TouchableOpacity>
          <View style={[styles.avatarCircle, { backgroundColor: getAvatarColor(user?.name) }]}>
            <Text style={styles.avatarInitials}>{getInitials(user?.name)}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── HERO ── */}
        <View style={styles.hero}>
          <Text style={styles.heroHeading}>Owner Dashboard</Text>
          <Text style={styles.heroSubtitle}>
            Welcome back, {getFirstName(user?.name) || 'Owner'}. Here's your property portfolio performance.
          </Text>
        </View>

        {/* ── STATS GRID ── */}
        <View style={styles.statsContainer}>
          {/* Stat 1 */}
          <View style={styles.statCard}>
            <View>
              <Text style={styles.statLabel}>Total Listings</Text>
              <Text style={styles.statValue}>12</Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: 'rgba(0, 101, 145, 0.1)' }]}>
              <MaterialIcons name="trending-up" size={14} color={Colors.secondary} style={{ marginRight: 4 }} />
              <Text style={[styles.statBadgeText, { color: Colors.secondary }]}>+2 this month</Text>
            </View>
          </View>

          {/* Stat 2 */}
          <View style={styles.statCard}>
            <View>
              <Text style={styles.statLabel}>Total Views</Text>
              <Text style={styles.statValue}>2,840</Text>
            </View>
            <View style={styles.statBadgeNeutral}>
              <Text style={styles.statBadgeNeutralText}>Last 30 days</Text>
            </View>
          </View>

          {/* Stat 3 */}
          <View style={styles.statCard}>
            <View>
              <Text style={styles.statLabel}>New Inquiries</Text>
              <Text style={styles.statValue}>48</Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: 'rgba(0, 101, 145, 0.1)' }]}>
              <MaterialIcons name="bolt" size={14} color={Colors.secondary} style={{ marginRight: 4 }} />
              <Text style={[styles.statBadgeText, { color: Colors.secondary }]}>High interest</Text>
            </View>
          </View>
        </View>

        {/* ── MY LISTINGS ── */}
        <View style={styles.listingsSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>My Listings</Text>
              <Text style={styles.sectionSubtitle}>Manage and track your active properties</Text>
            </View>
            {Platform.OS !== 'ios' && Platform.OS !== 'android' && (
              /* Hide Add Property button on mobile web to rely on FAB, but show on large screens */
              <TouchableOpacity style={styles.addBtnDesktop} activeOpacity={0.85} onPress={() => navigation.navigate('ManageProperty')}>
                <LinearGradient colors={[Colors.primary, '#1e293b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.addBtnGradient}>
                  <MaterialIcons name="add" size={20} color="#fff" />
                  <Text style={styles.addBtnText}>Add Property</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.listContainer}>
            {/* Listing Item 1 */}
            <View style={styles.listingCard}>
              <View style={styles.listingImageWrapper}>
                <Image
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsyQtrnEeoARXC-IePv8KYVs_SnHhro1syvrGzpV9VTAcn07p5XhpjFSMAZg4RL27sO0ibVHYgwanAb1IYV15hehJ5QENcjfBPcK27D4m-p_NbSuavkUVw9YGRnFbnXUpP63nhcHvsQzlqA1rndvin8zoMogZhRUaiTe_8xox1whvR1_6zGB9mqRKNEWBTqTOH6G0zALMR9OUazw3QngEk_IiLBn19LUORRzVk7y8Jb0NmO3s0ewFCIEazAQxSVoMcbxtAlSeZKzY' }}
                  style={styles.listingImage}
                />
              </View>
              <View style={styles.listingContent}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.statusPill, { backgroundColor: '#dcfce7' }]}>
                      <Text style={[styles.statusText, { color: '#166534' }]}>APPROVED</Text>
                    </View>
                    <Text style={styles.listingTitle} numberOfLines={1}>Skyline Penthouse Suites</Text>
                    <View style={styles.locationRow}>
                      <MaterialIcons name="location-on" size={14} color={Colors.onSurfaceVariant} />
                      <Text style={styles.locationText} numberOfLines={1}>Downtown District, NY</Text>
                    </View>
                  </View>
                  <View style={styles.actionBtns}>
                    <TouchableOpacity style={styles.iconAction} activeOpacity={0.7} onPress={() => navigation.navigate('ManageProperty', { property: { title: 'Skyline Penthouse Suites', price: 4500, location: 'Downtown District, NY' } })}>
                      <MaterialIcons name="edit" size={18} color={Colors.onSurfaceVariant} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconAction, { backgroundColor: 'rgba(186, 26, 26, 0.08)' }]} activeOpacity={0.7}>
                      <MaterialIcons name="delete" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.detailsRow}>
                  <View style={styles.detailChip}><Text style={styles.detailText}>3 Beds</Text></View>
                  <View style={styles.detailChip}><Text style={styles.detailText}>2 Baths</Text></View>
                  <View style={styles.detailChip}><Text style={styles.detailText}>$4,500/mo</Text></View>
                </View>
              </View>
            </View>

            {/* Listing Item 2 */}
            <View style={styles.listingCard}>
              <View style={styles.listingImageWrapper}>
                <Image
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBM0chAvKkFFWvflycwanCPai8gGIc019HHx1X3-8ZsaJEimFU_BeEjVXEYP7F-8_VGPRv1koR_YqQ70qv5iEn0P45N7JZEUUOGCe-GaqeSxgtScDd70NWyGdlMKYKhXaF3duh-waO3XpnAMXUcuRsm3ZC9BMyRooyO-gnIyzDDtsc4FI65p049Y4z1U1b5xcbN4HRSYrKXv5w8upmMfSVFvWe6IPptfT0EToe5P8aRIiZJFs89FyodP_PEhV0uka1U_1ZbWme04T8' }}
                  style={styles.listingImage}
                />
              </View>
              <View style={styles.listingContent}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.statusPill, { backgroundColor: '#fef3c7' }]}>
                      <Text style={[styles.statusText, { color: '#92400e' }]}>PENDING REVIEW</Text>
                    </View>
                    <Text style={styles.listingTitle} numberOfLines={1}>Oakwood Garden Estate</Text>
                    <View style={styles.locationRow}>
                      <MaterialIcons name="location-on" size={14} color={Colors.onSurfaceVariant} />
                      <Text style={styles.locationText} numberOfLines={1}>Oakwood Suburbs, CT</Text>
                    </View>
                  </View>
                  <View style={styles.actionBtns}>
                    <TouchableOpacity style={styles.iconAction} activeOpacity={0.7} onPress={() => navigation.navigate('ManageProperty', { property: { title: 'Oakwood Garden Estate', price: 3200, location: 'Oakwood Suburbs, CT' } })}>
                      <MaterialIcons name="edit" size={18} color={Colors.onSurfaceVariant} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconAction, { backgroundColor: 'rgba(186, 26, 26, 0.08)' }]} activeOpacity={0.7}>
                      <MaterialIcons name="delete" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.detailsRow}>
                  <View style={styles.detailChip}><Text style={styles.detailText}>4 Beds</Text></View>
                  <View style={styles.detailChip}><Text style={styles.detailText}>3 Baths</Text></View>
                  <View style={styles.detailChip}><Text style={styles.detailText}>$3,200/mo</Text></View>
                </View>
              </View>
            </View>

            {/* Listing Item 3 */}
            <View style={styles.listingCard}>
              <View style={[styles.listingImageWrapper, { opacity: 0.7 }]}>
                <Image
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXqTilnlgtN4HwTxB4ZA_NGS7bghoZzPRWS7stxJwJ5jzRAc_zb37XtSJ0xTLNWK0GurJLwqLwEkCs78xGmg_nc-nPJhYkedcfxfEUEuIyZPCoo0VYCC0gncfR8dDyUYkx3cGIC0zppgni8PaFSWM7RPd017l8_mQOPcUpD2PmSR2ekJNV_eobPUvQR2T0v_67DdM1kxmJTXKgrx1wWyU0ijyN7mE7loLLw73CC0wsK8yPwi0aSE_Kit1h0YG8z7eWU-Y5W3nKFhI' }}
                  style={[styles.listingImage, { tintColor: 'gray' /* Simple approximation for grayscale */ }]}
                />
              </View>
              <View style={styles.listingContent}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.statusPill, { backgroundColor: '#fee2e2' }]}>
                      <Text style={[styles.statusText, { color: '#991b1b' }]}>REJECTED</Text>
                    </View>
                    <Text style={styles.listingTitle} numberOfLines={1}>Brickstone Industrial Loft</Text>
                    <View style={styles.locationRow}>
                      <MaterialIcons name="location-on" size={14} color={Colors.onSurfaceVariant} />
                      <Text style={styles.locationText} numberOfLines={1}>Brooklyn Arts District, NY</Text>
                    </View>
                  </View>
                  <View style={styles.actionBtns}>
                    <TouchableOpacity style={styles.iconAction} activeOpacity={0.7} onPress={() => navigation.navigate('ManageProperty', { property: { title: 'Brickstone Industrial Loft', price: 2100, location: 'Brooklyn Arts District, NY' } })}>
                      <MaterialIcons name="edit" size={18} color={Colors.onSurfaceVariant} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconAction, { backgroundColor: 'rgba(186, 26, 26, 0.08)' }]} activeOpacity={0.7}>
                      <MaterialIcons name="delete" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.rejectedNote}>
                  <MaterialIcons name="error" size={14} color={Colors.error} style={{ marginRight: 4 }} />
                  <Text style={styles.rejectedText}>Missing fire safety certification. Please re-upload.</Text>
                </View>
              </View>
            </View>

          </View>
        </View>

      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => navigation.navigate('ManageProperty')}>
        <LinearGradient colors={[Colors.primary, '#1e293b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabGradient}>
          <MaterialIcons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <BottomNav activeTab={activeTab} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(247,249,251,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197,198,205,0.15)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40, paddingHorizontal: 20 },

  // ── Hero ──
  hero: {
    marginTop: 24,
    marginBottom: 28,
  },
  heroHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.onSurfaceVariant,
    lineHeight: 22,
  },

  // ── Stats ──
  statsContainer: {
    gap: 16,
    marginBottom: 40,
    ...(Platform.OS === 'web' && { flexDirection: 'row', flexWrap: 'wrap' })
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#191C1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 140,
    ...(Platform.OS === 'web' && { flex: 1, minWidth: 200 })
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 4,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 16,
  },
  statBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statBadgeNeutral: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 16,
    backgroundColor: Colors.surfaceContainerLow,
  },
  statBadgeNeutralText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },

  // ── My Listings ──
  listingsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
  addBtnDesktop: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  addBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  listContainer: {
    gap: 16,
  },
  listingCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 16,
  },
  listingImageWrapper: {
    width: Platform.OS === 'web' ? 180 : '100%',
    height: Platform.OS === 'web' ? 130 : 180,
    borderRadius: 12,
    overflow: 'hidden',
  },
  listingImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  listingContent: {
    flex: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  listingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  iconAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  detailChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  rejectedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  rejectedText: {
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '600',
    color: Colors.error,
  },

  // ── FAB ──
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
