import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import LottieView from 'lottie-react-native'; 

export default function ProcessingScreen({ navigation, route }) {
  useEffect(() => {
    // 1. Tangkap nama halaman tujuan (Tracking / SuccessAmbil) dan data pesanannya
    const { targetScreen, ...dataPesanan } = route.params;

    // 2. Set timer mundur selama 3 detik (3000 milidetik)
    const timer = setTimeout(() => {
      // 3. Pindah ke halaman tujuan.
      // Kita pakai .replace() BUKAN .navigate() supaya user TIDAK BISA menekan tombol 'Back' ke halaman loading ini lagi.
      navigation.replace(targetScreen, dataPesanan);
    }, 3000);

    // Bersihkan timer jika komponen ditutup tiba-tiba
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.animationContainer}>
        <LottieView
          // Ini adalah link animasi motor pengantar (seperti di referensi kamu)
          // Kamu bisa cari animasi lain berformat .json di lottiefiles.com
          source={{ uri: 'https://assets3.lottiefiles.com/packages/lf20_xwmj0hsk.json' }} 
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>
      <Text style={styles.title}>Memproses Pembayaran...</Text>
      <Text style={styles.subtitle}>Mohon tunggu sebentar, kami sedang menyiapkan pesananmu.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  animationContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#002244',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});