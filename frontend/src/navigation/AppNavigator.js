import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/user/HomeScreen';
import ListingsScreen from '../screens/user/ListingsScreen';
import PropertyDetailsScreen from '../screens/user/PropertyDetailsScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen';
import ManagePropertyScreen from '../screens/owner/ManagePropertyScreen';
import AdminLoginScreen from '../screens/admin/AdminLoginScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import ReviewScreen from '../screens/user/ReviewScreen';
import AnalyticsScreen from '../screens/shared/AnalyticsScreen';
import InboxScreen from '../screens/user/InboxScreen';
// ── Agreement screens (new) ──────────────────────────────────────────────────
import AgreementsScreen from '../screens/agreements/AgreementsScreen';
import AgreementDetailsScreen from '../screens/agreements/AgreementDetailsScreen';

// ── Maintenance screens ──
import MaintenanceHubScreen from '../screens/maintenance/MaintenanceHubScreen';
import CreateRequestScreen from '../screens/maintenance/CreateRequestScreen';
import RequestDetailScreen from '../screens/maintenance/RequestDetailScreen';
import AdminMaintenanceHubScreen from '../screens/maintenance/AdminMaintenanceHubScreen';
import AdminRequestDetailScreen from '../screens/maintenance/AdminRequestDetailScreen';

// ── Rent Payment & Tracking screens ──
import TenantBillsScreen from '../screens/user/TenantBillsScreen';
import RentPaymentScreen from '../screens/user/RentPaymentScreen';
import TenantWalletScreen from '../screens/user/TenantWalletScreen';

// ── Tenant Booking & Allocation screens ──
import TenantBookingDashboard from '../screens/user/TenantBookingDashboard';
import OwnerBookingRequestsScreen from '../screens/owner/OwnerBookingRequestsScreen';
import OwnerAllocationHistoryScreen from '../screens/owner/OwnerAllocationHistoryScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Listings" component={ListingsScreen} />
      <Stack.Screen name="PropertyDetails" component={PropertyDetailsScreen} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="OwnerDashboard" component={OwnerDashboardScreen} />
      <Stack.Screen name="ManageProperty" component={ManagePropertyScreen} />
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />

      {/* ── Rent Payment & Tracking ── */}
      <Stack.Screen name="TenantBills"   component={TenantBillsScreen} />
      <Stack.Screen name="RentPayment"   component={RentPaymentScreen} />
      <Stack.Screen name="TenantWallet"  component={TenantWalletScreen} />

      {/* ── Tenant Booking & Allocation ── */}
      <Stack.Screen name="TenantBookingDashboard" component={TenantBookingDashboard} />
      <Stack.Screen name="OwnerBookingRequests" component={OwnerBookingRequestsScreen} />
      <Stack.Screen name="OwnerAllocationHistory" component={OwnerAllocationHistoryScreen} />

      <Stack.Screen name="Reviews" component={ReviewScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Inbox" component={InboxScreen} />
      
      {/* Agreement & Contract Management */}
      <Stack.Screen name="Agreements" component={AgreementsScreen} />
      <Stack.Screen name="AgreementDetails" component={AgreementDetailsScreen} />

      {/* Maintenance */}
      <Stack.Screen name="MaintenanceHub" component={MaintenanceHubScreen} />
      <Stack.Screen name="CreateRequest" component={CreateRequestScreen} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
      <Stack.Screen name="AdminMaintenanceHub" component={AdminMaintenanceHubScreen} />
      <Stack.Screen name="AdminRequestDetail" component={AdminRequestDetailScreen} />
    </Stack.Navigator>
  );
}
