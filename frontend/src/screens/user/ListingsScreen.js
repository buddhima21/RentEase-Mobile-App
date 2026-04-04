import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import FilterChip from '../../components/ui/FilterChip';
import VerticalListingCard from '../../components/cards/VerticalListingCard';
import BentoListingCard from '../../components/cards/BentoListingCard';
import BottomNav from '../../components/navigation/BottomNav';

const FILTERS = [
  { id: 'price', label: 'Price', icon: 'tune', active: true },
  { id: 'apartment', label: 'Apartment', active: false },
  { id: 'amenities', label: 'Amenities', active: false },
  { id: 'move_in', label: 'Move-in Date', active: false },
];

const LISTINGS = [
  {
    id: '1',
    type: 'vertical',
    title: 'The Glass Pavilion',
    location: 'Tribeca, Manhattan',
    price: '$4,250',
    beds: 2,
    baths: 2,
    sqft: '1,420',
    imageUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZUKf0ju87lcKBwAMcNIrbFXmUJl7BTfKCVonbzZhRg7CKiJPnIwugMjK4vHdXO7INZenT7vd7bMH0CQN1xj_bxQFSiI9TZ3m-dpZhlbyC7KDnx1ULUMmoubFWQl8BaIHPDxyY4GHVv2r1OFHuUmILFOIY6ODxVjTymLZtOENR1SxKlNMARLupoS2KdhYi2VptZwapkZuSM_EeCLWUf05S72060eUFZfSrYzMEwbVobKa7hPF77tMbtTqrx-cQ46rxAPGnmASwXv4',
  },
  {
    id: '2',
    type: 'vertical',
    title: 'Oasis Heights',
    location: 'Williamsburg, Brooklyn',
    price: '$3,100',
    beds: 1,
    baths: 1,
    sqft: '850',
    imageUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUcuVqVVIpgkrBC96nduOg--b-2D-aedrkDlXXt-XUDbpOM8xDK3dnnylhZbirufj6UTO0uE5WeCeWRzVsCiJft9l5iWDGAup-8S9SttwvAQ30dHGIimr7vOz6ohFubrSqwL_QgunJskgRw6LtMuGZK8NSuW4vXYmagbLwUTSgv72w4S4-Np2Bp5_kTE1edQ6MVve6i87JUQ4YjWR0J5HzDd4jWw6KhXkhMCo16FV-I3bNWxhROD6ZWrQn8Nab4FWbXFqHGB5ERbg',
  },
  {
    id: '3',
    type: 'bento',
    title: 'Skygarden Residence',
    location: 'Upper West Side',
    price: '$5,800',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB9qGioxrOnHerMEpkhxV3-qnot5g7eTGPmgaOxH7VDGn2q-kKgYuOXha-o3iugG2z1VzAFixFEvbOgw_PicHmr03JKpRfqsx9crQ1fpGgF-d-0_eAGjHs2K896xBBBC45Q298hCpcTKx8aSc0KgmRmsEVdt9dN5QhVxztMPZZv5k2uJF_HNKTBdL_APYBKdTyXl_1SZK09SZo11H2D4bLuqzor_CEQyyUAfNMAZSWWpwCa5m7ZFrY6eR-w5d1OK67mbEVjSmWmlgs',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCIwK49YtK_aSXCWyUWcEXP61dIMz7d9OyGFbhv-FoFUSVNmwz9Cfxp19uQ1hthqNJUHUB7NekViLj7-Hl3CAUo2TOrhJKKTuHDUhG4vbLdmD5nqrxORTDniX_XWylFYY7S0OKItCssJLVSrf9-otYzcpo-W63UiCJTNz8Pt4KIxmoM2-hV-COTdCbU537HyuTal9Zutyz6UzkGlIFvjutq6aWuZk6VmNs2QGD_K5y3DpcCU_8liTgkfAJdGOFetY1nEyaHdPezLoQ'
    ]
  }
];

export default function ListingsScreen({ navigation }) {
  const [filters, setFilters] = useState(FILTERS);

  const toggleFilter = (id) => {
    setFilters(filters.map(f => f.id === id ? { ...f, active: !f.active } : f));
  };

  const handleTabPress = (tabKey) => {
    if (tabKey === 'home') {
      navigation.navigate('Home');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8MeiDNkifKCAG7WW6W4GJ8zPRyeoIh6algxQB_UFqAGVDWfPDbQ8N7eLFoKEN3zs_CUD4AW_jd8mQ3qGHsrOKU6KwsvpwSiYtx65FpALaZ3AFquvDg191GexA8wYoOqPOws3-IMBIE52CclAVSlfMgRR3HzTkM1lFmnMVfluzjFkuX2MzOphONouy6vtYgmAIZDN1TFZW4Hr2dsw0p3TpErFhEZbGR9Iq6oq6hdcBOFZsRLd30NAMCwJEU8EDzlD282iesgyCJAQ' }}
              style={styles.avatar}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.brand}>Listings</Text>
        </View>
        <TouchableOpacity style={styles.searchBtn} activeOpacity={0.7}>
          <MaterialIcons name="search" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.filterSection}>
          <View style={styles.locationContainer}>
            <View style={styles.locationInput}>
              <MaterialIcons name="location-on" size={20} color={Colors.onSurfaceVariant} />
              <Text style={styles.locationText}>New York, NY</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent} style={styles.filterScroll}>
            {filters.map((f) => (
              <FilterChip key={f.id} label={f.label} icon={f.icon} active={f.active} onPress={() => toggleFilter(f.id)} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.listingsSection}>
          <Text style={styles.sectionTitle}>Discover Residences</Text>
          {LISTINGS.map((item) => {
            if (item.type === 'bento') {
              return <BentoListingCard key={item.id} title={item.title} location={item.location} price={item.price} images={item.images} onPress={() => navigation.navigate('PropertyDetails', { property: item })} />;
            }
            return <VerticalListingCard key={item.id} title={item.title} location={item.location} price={item.price} beds={item.beds} baths={item.baths} sqft={item.sqft} imageUri={item.imageUri} onPress={() => navigation.navigate('PropertyDetails', { property: item })} />;
          })}
        </View>
      </ScrollView>

      <BottomNav activeTab="listings" onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'rgba(247,249,251,0.92)', borderBottomWidth: 1, borderBottomColor: 'rgba(197,198,205,0.15)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrapper: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: Colors.surfaceContainer },
  avatar: { width: '100%', height: '100%' },
  brand: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  searchBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, marginTop: 8 },
  scrollContent: { paddingBottom: 40 },
  filterSection: { marginBottom: 24 },
  locationContainer: { paddingHorizontal: 24, marginBottom: 16 },
  locationInput: { backgroundColor: Colors.surfaceContainerHighest, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  locationText: { color: Colors.onSurfaceVariant, fontSize: 16, fontWeight: '500' },
  filterScroll: { paddingHorizontal: 20 },
  filterScrollContent: { paddingHorizontal: 4 },
  listingsSection: { paddingHorizontal: 24 },
  sectionTitle: { fontSize: 28, fontFamily: 'Manrope', fontWeight: '800', letterSpacing: -0.5, color: Colors.primary, marginBottom: 24 },
});
