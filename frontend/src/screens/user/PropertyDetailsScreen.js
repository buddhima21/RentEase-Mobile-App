import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import DetailHeader from '../../components/navigation/DetailHeader';
import StatsGrid from '../../components/ui/StatsGrid';
import AmenityItem from '../../components/ui/AmenityItem';
import OwnerCard from '../../components/cards/OwnerCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GALLERY_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCJ9zTQCFovoCevxro_t2l5JucjcEyshlvyCK8bnKjaoOlsZ2J4TXywF9wSlR_aeftYmTbPAowaxkjHXcY1T4LRD-AdfbSoQ9R4Dpn_tgCxh7l-qXzaLclhGKSAEd3Cws-11jAfsn1vg3TcCASbg8lZw-wAYmOZJE-X5983t1J1OZoqaXvcrjSxw-1Zbym9H9gEjtVqIwWOJ7C4xqABK_LFk-rjfo6yIqbNMeUnuSlNmrz_GV-_y3ocexqpDK4KqRimC3-p7D0iQ_s',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCDnK_1err-E5fB_Vsrhh1nzHlktxe1GkG3oRYfCl30rR_AmnX5mAR9kBJj0jo_3l_7OcdQww8TdArYrzDq0nD5cXNyTZpEPedxYIebdaOS_ysdl_pS7cHwjfObUL_epVLIx0-_d1xiKK253NOoagkRIc6GoUXlNWWGSBqplesZO_xgPtwlXs9ZVY8DueCPsE2hBwaa2A6qYHvmUBaRuTXQQoCXd2vL0N6a3kxyAj2lrVVGxZzq5Rtz_8nk3j8hoGqrHYw13JgVkyE',
];

const AMENITIES = [
  { icon: 'wifi', label: 'High-speed WiFi' },
  { icon: 'ac-unit', label: 'Central AC' },
  { icon: 'local-parking', label: 'Private Parking' },
  { icon: 'fitness-center', label: 'Gym Access' },
];

export default function PropertyDetailsScreen({ navigation, route }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef(null);

  // Use route params if available, otherwise use defaults
  const property = route?.params?.property || {
    title: 'The Obsidian Loft',
    location: 'Chelsea Quarter, New York, NY',
    price: '$4,250',
    beds: 2,
    baths: 2,
    sqft: '1,150',
    description:
      'Experience industrial luxury in this meticulously designed loft. Featuring double-height ceilings and bespoke steel-framed windows, this space captures the true essence of Chelsea\'s architectural heritage. Every detail has been curated for the modern professional seeking both comfort and character.',
  };

  const handleScroll = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveSlide(slideIndex);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Hero Gallery ── */}
        <View style={styles.gallery}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {GALLERY_IMAGES.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.galleryImage} resizeMode="cover" />
            ))}
          </ScrollView>

          {/* Gradient overlay at bottom for smooth transition */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.15)']}
            style={styles.galleryGradient}
          />

          {/* Slide Indicators */}
          <View style={styles.indicators}>
            {GALLERY_IMAGES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  activeSlide === index ? styles.indicatorActive : styles.indicatorInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* ── Property Details Blade ── */}
        <View style={styles.detailsBlade}>
          {/* Verified + Title + Location + Price */}
          <View style={styles.titleSection}>
            <View style={styles.verifiedRow}>
              <MaterialIcons name="verified" size={16} color={Colors.secondary} />
              <Text style={styles.verifiedText}>VERIFIED LISTING</Text>
            </View>

            <Text style={styles.propertyTitle}>{property.title}</Text>

            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={18} color={Colors.onSurfaceVariant} />
              <Text style={styles.locationText}>{property.location}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.price}>{property.price}</Text>
              <Text style={styles.priceUnit}>/month</Text>
            </View>
          </View>

          {/* Stats Grid */}
          <StatsGrid beds={property.beds} baths={property.baths} sqft={property.sqft} />

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{property.description}</Text>
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {AMENITIES.map((amenity, index) => (
                <AmenityItem key={index} icon={amenity.icon} label={amenity.label} />
              ))}
            </View>
          </View>

          {/* Location / Map */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.mapContainer}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdpbrd3cDOLF3Lx7eRYpnFqkfvyxfgfPdYn4g-aMc56O8rO3T1lttJtmqnO0j5EaERW6GqFWXLgxPh3CdyZ-xkBQ5I52ZtTKMGpzjIVeUYjSVEGQBwldjU3YzZtOU9KrE8Tqgv4NCYPZlM_Ku6zyL2ijfH8ABLM5RvUyGnNOqIaD0stLx5TUNcnF82dMFDqnHjzxdFK0pd3G8Xs7sIom6fKARCziIXq-K7Eeqj9XtIbLG1UPuvwdeNgoPSm0lrSRUSaKUazwrfMsA' }}
                style={styles.mapImage}
                resizeMode="cover"
              />
              <View style={styles.mapPin}>
                <View style={styles.mapPinCircle}>
                  <MaterialIcons name="location-on" size={22} color="#fff" />
                </View>
              </View>
            </View>
          </View>

          {/* Owner Card */}
          <OwnerCard
            name="Julian Sterling"
            rating="4.9"
            reviews="124"
            imageUri="https://lh3.googleusercontent.com/aida-public/AB6AXuBLGeR57kZ7CNTd7JOUh_Pz-sHJzqtngYmLx9e7TcBJYE0_Q8TQtSL75vC6kDcvhiO94ArdhqzWj_870NXjfj7-Z8JidD0HqwALIifsllqk9sQjSSsu3tkgPyFdu77L1qPbxABzTwldAKrRUhI6KkqheuZzZkLrtx3vybXH9z1JwyOdA-cnxZoczg4dpjgkTWs0vxQ3DHmUlL0En3-AvmTTdVaMzUZdBO1YGghyyM2UdXoCP11TIQl4CNlyCsYt7iKXPmyBJyX_J-o"
            onChat={() => {}}
          />
        </View>
      </ScrollView>

      {/* ── Floating Detail Header ── */}
      <DetailHeader onBack={() => navigation.goBack()} onShare={() => {}} />

      {/* ── Fixed Action Bar ── */}
      <View style={styles.actionBar}>
        <View style={styles.actionPriceBlock}>
          <Text style={styles.actionLabel}>TOTAL PACKAGE</Text>
          <View style={styles.actionPriceRow}>
            <Text style={styles.actionPrice}>{property.price}</Text>
            <Text style={styles.actionPriceUnit}>/mo</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.bookBtn} activeOpacity={0.85}>
            <LinearGradient
              colors={[Colors.primary, '#1e293b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bookGradient}
            >
              <Text style={styles.bookText}>Book Now</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.calendarBtn} activeOpacity={0.7}>
            <MaterialIcons name="calendar-today" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // ── Gallery ──
  gallery: {
    width: '100%',
    height: 480,
    position: 'relative',
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 480,
  },
  galleryGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  indicators: {
    position: 'absolute',
    bottom: 56,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  indicator: {
    height: 5,
    borderRadius: 99,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#fff',
  },
  indicatorInactive: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },

  // ── Details Blade ──
  detailsBlade: {
    marginTop: -40,
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
  },

  // ── Title Section ──
  titleSection: {
    marginBottom: 28,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  verifiedText: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  propertyTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 15,
    color: Colors.onSurfaceVariant,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
  },
  priceUnit: {
    fontSize: 15,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
    marginLeft: 2,
  },

  // ── Sections ──
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 26,
    color: Colors.onSurfaceVariant,
  },

  // ── Amenities ──
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  // ── Map ──
  mapContainer: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPin: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinCircle: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },

  // ── Fixed Action Bar ──
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(230,232,234,0.4)',
    // Blur effect fallback
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 8,
  },
  actionPriceBlock: {
    flexShrink: 1,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: 2,
  },
  actionPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  actionPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  actionPriceUnit: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
    marginLeft: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  bookBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  bookGradient: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  calendarBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
