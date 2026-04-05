import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, Modal, TouchableWithoutFeedback } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';

export default function AdminHeader() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignOut = async () => {
    setShowDropdown(false);
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };



  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <MaterialIcons name="maps-home-work" size={24} color="#091426" />
        <Text style={styles.title}>RentEase</Text>
      </View>
      <View style={styles.rightSection}>
        <View style={styles.navLinks}>
          <TouchableOpacity onPress={() => navigation.navigate('AdminDashboard')}>
            <View style={styles.activeNavLink}>
              <Text style={styles.activeNavLinkText}>Dashboard</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => alert('Users management coming soon!')}>
            <Text style={styles.navLink}>Users</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AdminDashboard')}>
            <Text style={styles.navLink}>Approvals</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
          <MaterialIcons name="home" size={20} color="#006591" />
          <Text style={styles.homeBtnText}>Home</Text>
        </TouchableOpacity>
        <View style={styles.profileContainer}>
          <TouchableOpacity style={styles.profilePicContainer} onPress={() => setShowDropdown(!showDropdown)}>
            {user?.profileImage ? (
              <Image 
                source={{ uri: user.profileImage }}
                style={styles.profilePic}
              />
            ) : (
              <View style={styles.adminIconWrapper}>
                <MaterialIcons name="admin-panel-settings" size={24} color="#006591" />
              </View>
            )}
          </TouchableOpacity>

          {showDropdown && (
          <Modal visible={showDropdown} transparent={true} animationType="fade">
            <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
              <View style={styles.modalOverlay}>
                <View style={styles.dropdownModal}>
                  <View style={styles.dropdownHeader}>
                    <Text style={styles.dropdownName}>{user?.name || 'Administrator'}</Text>
                    <Text style={styles.dropdownEmail}>{user?.email || 'admin@rentease.com'}</Text>
                  </View>
                  <View style={styles.dropdownDivider} />
                  <TouchableOpacity style={styles.dropdownItem} onPress={handleSignOut}>
                    <MaterialIcons name="logout" size={18} color="#ba1a1a" />
                    <Text style={styles.dropdownItemText}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    paddingBottom: 16,
    backgroundColor: 'rgba(247, 249, 251, 0.9)',
    zIndex: 50,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#091426',
    letterSpacing: -0.5,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    display: Platform.OS === 'ios' || Platform.OS === 'android' ? 'none' : 'flex', // Hidden on mobile, but keep it structured
  },
  navLink: {
    color: '#45474c',
    fontSize: 14,
    fontWeight: '600',
  },
  activeNavLink: {
    backgroundColor: 'rgba(0, 101, 145, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeNavLinkText: {
    color: '#006591',
    fontWeight: '600',
    fontSize: 14,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 101, 145, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  homeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006591',
    display: Platform.OS === 'ios' || Platform.OS === 'android' ? 'none' : 'flex',
  },
  profilePicContainer: {
    height: 40,
    width: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  profilePic: {
    height: '100%',
    width: '100%',
  },
  adminIconWrapper: {
    height: '100%',
    width: '100%',
    backgroundColor: '#e6e8ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContainer: {
    position: 'relative',
    zIndex: 100,
  },
  modalOverlay: {
    flex: 1,
  },
  dropdownModal: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 95 : 70,
    right: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: 220,
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(197, 198, 205, 0.2)',
    paddingVertical: 8,
  },
  dropdownHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#091426',
    marginBottom: 2,
  },
  dropdownEmail: {
    fontSize: 12,
    color: '#45474c',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: 'rgba(197, 198, 205, 0.2)',
    marginVertical: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ba1a1a',
  },
});
