import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Animated,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import CategoryChip from '../../components/ui/CategoryChip';
import FeaturedCard from '../../components/cards/FeaturedCard';
import ListingRow from '../../components/cards/ListingRow';
import BottomNav from '../../components/navigation/BottomNav';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['House', 'Apartment', 'Villa', 'Loft'];

const FEATURED = [
  {
    id: '1',
    title: 'The Glass Pavilion',
    location: 'Oslo, Norway',
    price: '$4,500',
    imageUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCmbpUDGaOnN5z49eoWHS8OeMxMhIKs26NU6MKUkgvSCRPMuPFGL-8b_P61RyYGYhQBN9LT8uSZKQKNmYgNQAJ0LUF93QlSK1ud4tJZLHk1EUl_6EJM2M90tH-ixbTr2_RrcYAKpU4pY_YwLegULx3I0B_hxUr8jJmCGMSqV5ukW8fdY9EbkCcHu5jvNH5vgQhCtrAF5zpm23ggVluVxIFg_Pg2mYiTil5XbMiYshRLCX23Wfx6vmhV5a3TWTEbudsShxNeZxkrxYs',
  },
  {
    id: '2',
    title: 'Industrial Skyloft',
    location: 'Berlin, Germany',
    price: '$3,200',
    imageUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD6TKAXyb3kRjF182EoJjWvWsaB6jgm0EViRDCxdnub-omdvRUIDvV2OWb57QXspHrVBtMSyeZZQe5uIrRHurdzdUtCKw5pCF2FB7M8UDDiMh5P4D6WJlGuXw577zXHZzvPiVS2cum0XpzmQRKmClEXCD72-41h1Bp7r6bTJPOIATxrwxx5S7kHpPKRyKCT6aIEbZIHz3T90aQhN9mgRfdj48Cjl7z5FFxNeTXxLRPw2TvxbFhoHHsxmgLuKljR7drR66aLDwUE8LA',
  },
];

const RECENT = [
  {
    id: '1',
    title: 'Nordic Retreat',
    location: 'Copenhagen, Denmark',
    price: '$2,100',
    beds: 2,
    baths: 1,
    imageUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAbCoCxNnwliHrdO1qy3Lj3TZJnbzbom01vZw040QmP1lAgE-mYdIO6mNAxPezvZgZppcRaYruAPavf1mJKenT4z_bDsveD69ld5BxwSaFJSd0Wej7Zvy0yCPgvEGO7_60pn4kIie_biRJogRKfRRwZBI6Qm5_8CjsQdrt4IpwNPO9tlOXQEiCYAJ8RITTRoaPivhfQa_DdlSaFMQB85QXXf6FD0vXhIMMbuy5xMoZFtIOnQQBxLifil5mr_JZdRruKho3OF5kdygo',
  },
  {
    id: '2',
    title: 'Metropolis View',
    location: 'London, UK',
    price: '$3,800',
    beds: 3,
    baths: 2,
    imageUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCGGTfW1AxKR_Q6wD25-h9HP1XhcLwl-Nw3ZZKKrXRlkbVbcfEKJFXo9XVKCo-NzkHpclU2e8vXv-mD7PtqONi5cVDjrkc7_S2kR5Dt--uT8u_ecAJ9a4SgarppWR9q1U2sf9QNk6n-KhxpzYrVV3S8hQEIRX2bbALa1kJO3XUPaG7nAI3W-D0fcIbbyjL-6tQuKAaEPA1BHq-pt9fbUE93myVB8m2N-KHnhcFfm7f05sCG_l9-ea_mAKT8FAO7Nr1SIh6Zz5mAIHQ',
  },
  {
    id: '3',
    title: 'Forest Oasis',
    location: 'Portland, USA',
    price: '$2,550',
    beds: 1,
    baths: 1,
    imageUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDoprJwxhtLu3Q_6RHZE2Vuesk7hVFsQz7W8mG70xKs55RBr0TQllVkYYol4TUX6jQzxtT-MOhDYTd3rQekj3swSuxIU8NRSWsaCPu7Os_IXZSFxaFMFzNn7eCFqJv_Q_guWJK4FHhE2SzUhre0IQVSWNhirsS8s76LPpQcH2NEgbBRhFEyX71dhaKFHd5cKuwcR8i46eIUAtzuMKl4slyzx_amrNbPq7V7VPXV5rqKxcSkDgZxnCYkAWeaqAOiYJ3Yl2indn4gspI',
  },
];

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

// Deterministic avatar color based on name
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

const getRoleBadge = (role) => {
  switch (role) {
    case 'owner': return { label: 'Owner', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' };
    case 'admin': return { label: 'Admin', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
    default:      return { label: 'Tenant', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)' };
  }
};

export default function HomeScreen({ navigation }) {
  const { user, logout, isLoading } = useAuth();
  const [activeCategory, setActiveCategory] = useState('House');
  const [activeTab, setActiveTab] = useState('home');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Fade-in animation for header area
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [user]);

  const handleTabPress = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === 'listings') {
      navigation.navigate('Listings');
    } else if (tabKey === 'login') {
      navigation.navigate('Login');
    } else if (tabKey === 'profile') {
      setShowProfileMenu(true);
    }
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
  };

  const roleBadge = user ? getRoleBadge(user.role) : null;

  // ── Profile Dropdown Menu (Modal) ──
  const renderProfileMenu = () => (
    <Modal
      visible={showProfileMenu}
      transparent
      animationType="fade"
      onRequestClose={() => setShowProfileMenu(false)}
    >
      <Pressable style={styles.modalOverlay} onPress={() => setShowProfileMenu(false)}>
        <View style={styles.dropdownMenu}>
          {/* User Info */}
          <View style={styles.dropdownUserSection}>
            <View style={[styles.dropdownAvatar, { backgroundColor: getAvatarColor(user?.name) }]}>
              <Text style={styles.dropdownAvatarText}>{getInitials(user?.name)}</Text>
            </View>
            <View style={styles.dropdownUserInfo}>
              <Text style={styles.dropdownUserName}>{user?.name}</Text>
              <Text style={styles.dropdownUserEmail}>{user?.email}</Text>
              <View style={[styles.dropdownRoleBadge, { backgroundColor: roleBadge?.bg }]}>
                <Text style={[styles.dropdownRoleText, { color: roleBadge?.color }]}>
                  {roleBadge?.label}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.dropdownDivider} />

          {/* Menu Items */}
          <TouchableOpacity style={styles.dropdownItem} activeOpacity={0.7}>
            <MaterialIcons name="person-outline" size={20} color={Colors.onSurfaceVariant} />
            <Text style={styles.dropdownItemText}>My Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dropdownItem} activeOpacity={0.7}>
            <MaterialIcons name="settings" size={20} color={Colors.onSurfaceVariant} />
            <Text style={styles.dropdownItemText}>Settings</Text>
          </TouchableOpacity>

          {user?.role === 'owner' && (
            <TouchableOpacity 
              style={styles.dropdownItem} 
              activeOpacity={0.7}
              onPress={() => {
                setShowProfileMenu(false);
                navigation.navigate('OwnerDashboard');
              }}
            >
              <MaterialIcons name="business" size={20} color={Colors.onSurfaceVariant} />
              <Text style={styles.dropdownItemText}>My Properties</Text>
            </TouchableOpacity>
          )}

          <View style={styles.dropdownDivider} />

          <TouchableOpacity style={styles.dropdownItemLogout} activeOpacity={0.7} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color={Colors.error} />
            <Text style={styles.dropdownItemLogoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Animated.View style={[styles.headerLeft, { opacity: fadeAnim }]}>
          {user ? (
            /* ── LOGGED IN: Avatar + Name ── */
            <TouchableOpacity
              style={styles.profileArea}
              activeOpacity={0.7}
              onPress={() => setShowProfileMenu(true)}
            >
              <View style={[styles.avatarCircle, { backgroundColor: getAvatarColor(user.name) }]}>
                <Text style={styles.avatarInitials}>{getInitials(user.name)}</Text>
              </View>
              <View style={styles.profileTextArea}>
                <Text style={styles.greetingText}>
                  Hi, <Text style={styles.userName}>{getFirstName(user.name)}</Text>
                </Text>
                <View style={[styles.rolePill, { backgroundColor: roleBadge.bg }]}>
                  <View style={[styles.roleDot, { backgroundColor: roleBadge.color }]} />
                  <Text style={[styles.roleLabel, { color: roleBadge.color }]}>
                    {roleBadge.label}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          ) : (
            /* ── NOT LOGGED IN: Sign In Button ── */
            <TouchableOpacity
              style={styles.signInBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Login')}
            >
              <MaterialIcons name="person-outline" size={20} color="#fff" />
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <View style={styles.headerRight}>
          <Text style={styles.brand}>RentEase</Text>
          <TouchableOpacity
            style={styles.searchBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Listings')}
          >
            <MaterialIcons name="search" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroHeading}>
            Find your next{'\n'}
            <Text style={styles.heroAccent}>architectural masterpiece.</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Curated living spaces designed for the modern connoisseur.
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow} style={styles.categoriesScroll}>
          {CATEGORIES.map((cat) => (
            <CategoryChip key={cat} label={cat} active={activeCategory === cat} onPress={() => setActiveCategory(cat)} />
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Featured Selection</Text>
            <View style={styles.sectionAccent} />
          </View>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
          {FEATURED.map((item) => (
            <FeaturedCard key={item.id} price={item.price} title={item.title} location={item.location} imageUri={item.imageUri} onPress={() => navigation.navigate('PropertyDetails', { property: item })} />
          ))}
        </ScrollView>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Listings</Text>
          <View style={styles.sectionAccentWide} />
          {RECENT.map((item) => (
            <ListingRow key={item.id} title={item.title} location={item.location} price={item.price} beds={item.beds} baths={item.baths} imageUri={item.imageUri} onPress={() => navigation.navigate('PropertyDetails', { property: item })} />
          ))}
        </View>
      </ScrollView>

      <BottomNav activeTab={activeTab} onTabPress={handleTabPress} />

      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <MaterialIcons name="tune" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Profile dropdown modal */}
      {user && renderProfileMenu()}
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(247,249,251,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197,198,205,0.15)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brand: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Sign In Button (not logged in) ──
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  signInText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Profile Area (logged in) ──
  profileArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 4,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileTextArea: {
    gap: 2,
  },
  greetingText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  userName: {
    fontWeight: '800',
    color: Colors.primary,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  roleLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── Dropdown Menu ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 100 : 70,
    paddingHorizontal: 16,
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  dropdownUserSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  dropdownAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  dropdownUserInfo: {
    flex: 1,
    gap: 2,
  },
  dropdownUserName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  dropdownUserEmail: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  dropdownRoleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  dropdownRoleText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: 'rgba(197, 198, 205, 0.2)',
    marginHorizontal: 16,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.onSurface,
  },
  dropdownItemLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  dropdownItemLogoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.error,
  },

  // ── Rest of the page ──
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  hero: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 8 },
  heroHeading: { fontSize: 30, fontWeight: '800', color: Colors.primary, lineHeight: 38, letterSpacing: -0.5 },
  heroAccent: { color: Colors.secondary },
  heroSubtitle: { marginTop: 10, fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 20, maxWidth: 270 },
  categoriesScroll: { marginTop: 20 },
  categoriesRow: { paddingHorizontal: 22, paddingVertical: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 22, marginTop: 36, marginBottom: 18 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  sectionAccent: { height: 3, width: 28, backgroundColor: Colors.secondary, borderRadius: 99, marginTop: 4 },
  sectionAccentWide: { height: 3, width: 28, backgroundColor: Colors.secondary, borderRadius: 99, marginTop: 4, marginBottom: 20 },
  viewAll: { fontSize: 13, fontWeight: '700', color: Colors.secondary, letterSpacing: 0.3 },
  featuredRow: { paddingHorizontal: 22, paddingBottom: 8 },
  recentSection: { paddingHorizontal: 22, marginTop: 36 },
  fab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 110 : 90, right: 22, width: 54, height: 54, borderRadius: 27, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 12 },
});
