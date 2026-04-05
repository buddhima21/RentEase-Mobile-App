import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Home: '',
      Listings: 'Listings',
      PropertyDetails: 'PropertyDetails',
      Login: 'Login',
      Signup: 'Signup',
      OwnerDashboard: 'OwnerDashboard',
      ManageProperty: 'ManageProperty',
      AdminLogin: 'admin/login',
    },
  },
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer linking={linking}>
        <AppNavigator />
        <StatusBar style="dark" />
      </NavigationContainer>
    </AuthProvider>
  );
}
