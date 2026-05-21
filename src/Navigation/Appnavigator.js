import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from '../Services/supabase';

// ─── Auth & Home ───────────────────────────────────────────
import LoginScreen from '../Screens/Auth/Loginscreen';
import RegisterScreen from '../Screens/Auth/Registerscreen';
import HomeScreen from '../Screens/Home/HomeScreen';
import HistoryScreen from '../Screens/Home/HistoryScreen';
import OrderDetailsScreen from '../Screens/Orders/OrderDetailsScreen';

// ─── Orders ───────────────────────────────────────────────
import CartScreen from '../Screens/Orders/CartScreen';
import OrderScreen from '../Screens/Orders/OrderScreen';
import CheckoutScreen from '../Screens/Orders/CheckoutScreen';
import AddressScreen from '../Screens/Orders/AddressScreen';
import TrackingScreen from '../Screens/Orders/TrackingScreen';
import SuccessAmbilScreen from '../Screens/Orders/SuccessAmbilScreen';
import ProcessingScreen from '../Screens/Orders/ProcessingScreen';

// ─── Admin ────────────────────────────────────────────────
import AdminDashboardScreen from '../Screens/Admins/AdminDashboardScreen';
import AdminProductScreen from '../Screens/Admins/AdminProductScreen';
import AdminOrderScreen from '../Screens/Admins/AdminOrderScreen';
import AdminUserScreen from '../Screens/Admins/AdminUserScreen';

// ⚠️ GANTI dengan email admin kamu
const ADMIN_EMAIL = 'diazbintang33@gmail.com';

const Stack = createStackNavigator();

export default function AppNavigator() {
  // 'loading' | 'admin' | 'user' | 'guest'
  const [authState, setAuthState] = useState('loading');

  useEffect(() => {
    // Cek session yang sudah ada (saat app baru dibuka)
    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveState(session);
    });

    // Pantau perubahan login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      resolveState(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const resolveState = (session) => {
    if (!session) {
      setAuthState('guest');
      return;
    }
    const email = session?.user?.email?.toLowerCase().trim();
    const adminEmail = ADMIN_EMAIL.toLowerCase().trim();
    console.log('Email login:', email, '| Admin email:', adminEmail, '| Match:', email === adminEmail);

    if (email === adminEmail) {
      setAuthState('admin');
    } else {
      setAuthState('user');
    }
  };

  if (authState === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6FA' }}>
        <ActivityIndicator size="large" color="#002244" />
      </View>
    );
  }

  const initialRoute =
    authState === 'admin' ? 'AdminDashboard' :
    authState === 'user'  ? 'Home' :
    'Login';

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        // Nonaktifkan animasi agar tidak ada flicker saat redirect
        screenOptions={{ animationEnabled: true }}
      >
        {/* ── Auth ── */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />

        {/* ── User ── */}
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Order" component={OrderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="HistoryScreen"
          component={HistoryScreen}
          options={{ headerShown: true, headerTitle: 'Riwayat Pesanan', headerTintColor: '#002244' }}
        />
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Address" component={AddressScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Tracking" component={TrackingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SuccessAmbil" component={SuccessAmbilScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Processing" component={ProcessingScreen} options={{ headerShown: false }} />

        {/* ── Admin ── */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AdminProduct" component={AdminProductScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AdminOrder" component={AdminOrderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AdminUser" component={AdminUserScreen} options={{ headerShown: false }} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}