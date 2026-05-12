import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// 👇 1. IMPORT SUPABASE (Pastikan path-nya sesuai dengan folder kamu)
import { supabase } from '../Services/supabase'; 

// Import Screen Auth & Home
import LoginScreen from '../Screens/Auth/Loginscreen';
import RegisterScreen from '../Screens/Auth/Registerscreen';
import HomeScreen from '../Screens/Home/HomeScreen';
import HistoryScreen from '../Screens/Home/HistoryScreen';

// Import Screen Orders
import CartScreen from '../Screens/Orders/CartScreen';
import OrderScreen from '../Screens/Orders/OrderScreen';

// checkout 
import CheckoutScreen from '../Screens/Orders/CheckoutScreen'; 
import AddressScreen from '../Screens/Orders/AddressScreen';
import TrackingScreen from '../Screens/Orders/TrackingScreen';
import SuccessAmbilScreen from '../Screens/Orders/SuccessAmbilScreen';
import ProcessingScreen from '../Screens/Orders/ProcessingScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  // 👇 2. STATE UNTUK AUTO-LOGIN
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Cek memori HP saat aplikasi pertama kali dibuka
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsReady(true); // Matikan loading setelah selesai mengecek
    });

    // Pantau terus jika user melakukan Login atau Logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Bersihkan pemantau saat komponen ditutup
    return () => subscription.unsubscribe();
  }, []);

  // 👇 3. TAMPILAN LOADING AWAL (Saat aplikasi sedang mengecek memori)
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6FA' }}>
        <ActivityIndicator size="large" color="#002244" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* 👇 4. LOGIKA CERDAS: Jika ada session masuk Home, jika kosong masuk Login */}
      <Stack.Navigator initialRouteName={session ? "Home" : "Login"}>
        
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Order" component={OrderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
        
        <Stack.Screen 
          name="HistoryScreen" 
          component={HistoryScreen} 
          options={{ 
            headerShown: true, 
            headerTitle: 'Riwayat Pesanan',
            headerTintColor: '#002244'
          }} 
        />

        {/* DAFTAR RUTE CHECKOUT */}
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Address" component={AddressScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Tracking" component={TrackingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SuccessAmbil" component={SuccessAmbilScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Processing" component={ProcessingScreen} options={{ headerShown: false }} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}