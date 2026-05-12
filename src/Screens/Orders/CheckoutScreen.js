import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { 
  SafeAreaView, StyleSheet, Text, View, ScrollView, 
  TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator 
} from 'react-native';
import { WebView } from 'react-native-webview';

// ⚠️ PASTIKAN PATH INI SESUAI DENGAN LETAK FILE KONFIGURASI SUPABASE KAMU ⚠️
import { supabase } from '../../Services/supabase'; 

export default function CheckoutScreen({ navigation, route }) {
  // 1. DATA KERANJANG & PRODUK (Safety check)
  const cartData = route.params?.cart || {};
  const productData = Array.isArray(route.params?.products) ? route.params.products : [];
  
  // 2. STATE UTAMA
  const [orderType, setOrderType] = useState('antar'); // Default: 'antar' atau 'ambil'
  const [address, setAddress] = useState(''); 
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);

  // 3. TANGKAP DATA DARI ADDRESS SCREEN
  useEffect(() => {
    if (route.params?.selectedAddress) {
      setAddress(route.params.selectedAddress);
    }
  }, [route.params?.selectedAddress]);

  // 4. LOGIKA HARGA & JARAK (Haversine Formula)
  const selectedProducts = productData.filter(p => (cartData[p.id?.toString()] || 0) > 0);
  const subtotal = selectedProducts.reduce((sum, item) => 
    sum + (item.price * cartData[item.id.toString()]), 0
  );

  const storeLat = -6.2833; 
  const storeLon = 106.7166; 
  const userLat = route.params?.lat;
  const userLon = route.params?.lon;

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))); 
  };

  let ongkir = 0;
  let distanceStr = "";

  if (orderType === 'antar' && userLat && userLon) {
    const distance = getDistance(storeLat, storeLon, userLat, userLon);
    distanceStr = distance.toFixed(1) + " KM"; 
    ongkir = distance <= 2 ? 5000 : 5000 + (Math.ceil(distance - 2) * 2000);
  }

  const adminFee = 2000;
  const totalPayment = subtotal + adminFee + ongkir;

  // 5. FUNGSI UPDATE STOK KE SUPABASE
  const updateProductStock = async () => {
    try {
      for (const item of selectedProducts) {
        const productId = item.id;
        const quantityPurchased = cartData[productId.toString()];
        const currentStock = item.stock || 0; 

        const { error } = await supabase
          .from('products')
          .update({ stock: currentStock - quantityPurchased })
          .eq('id', productId);

        if (error) throw error;
      }
      console.log("Stok berhasil diperbarui di Supabase.");
    } catch (error) {
      console.error("Gagal update stok:", error.message);
    }
  };

  // 6. FUNGSI SAPU BERSIH KERANJANG (Mencegah Ghost Cart)
  const clearUserCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('cart').delete().eq('user_id', user.id);
        if (error) throw error;
        console.log("Keranjang berhasil dikosongkan!");
      }
    } catch (error) {
      console.error("Gagal hapus cart:", error.message);
    }
  };

  // 7. LOGIKA NAVIGASI SETELAH PEMBAYARAN (Diupdate ke ProcessingScreen)
  const handleClosePayment = async () => {
    setPaymentUrl(null); // Tutup WebView
    
    setIsProcessing(true); // Tampilkan loading sebentar saat proses update
    await updateProductStock(); // Jalankan potong stok
    await clearUserCart(); // Bersihkan keranjang di database
    
    if (route.params?.resetCart) {
      route.params.resetCart(); // Reset tampilan UI
    }
    setIsProcessing(false);

    // 👇 DI SINI PERUBAHANNYA: Lempar ke Processing dulu 👇
    if (orderType === 'antar') {
      navigation.navigate('Processing', {
        targetScreen: 'Tracking', // Rute tujuan akhir
        cart: cartData,
        products: productData,
        selectedAddress: address,
        lat: userLat,
        lon: userLon,
        subtotal: subtotal,
        ongkir: ongkir,
        adminFee: adminFee,
        totalPayment: totalPayment
      });
    } else {
      navigation.navigate('Processing', {
        targetScreen: 'SuccessAmbil', // Rute tujuan akhir
        cart: cartData,
        products: productData,
        totalPayment: totalPayment,
        paymentMethod: "Pembayaran Digital",
        userEmail: "bintang@student.ac.id" 
      });
    }
  };

  // 8. HIT BACKEND NODE.JS UNTUK TOKEN MIDTRANS
  const handleCreateOrder = async () => {
    if (orderType === 'antar' && address.trim() === '') {
      Alert.alert("Alamat Belum Dipilih", "Pilih alamat pengantaran di peta terlebih dahulu.");
      return;
    }

    setIsProcessing(true);
    const orderId = "WRG-" + new Date().getTime();

    try {
      const response = await fetch('http://10.0.2.2:8080/api/get-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          gross_amount: totalPayment
        })
      });

      const data = await response.json();
      if (data.token) {
        setPaymentUrl(`https://app.sandbox.midtrans.com/snap/v2/vtweb/${data.token}`);
      } else {
        Alert.alert("Error", "Gagal mendapatkan izin pembayaran dari server.");
      }
    } catch (error) {
      Alert.alert("Server Offline", "Pastikan server Node.js Anda sudah berjalan.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Toggle Navigasi */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity style={[styles.toggleBtn, orderType === 'antar' && styles.toggleActive]} onPress={() => setOrderType('antar')}>
            <Text style={[styles.toggleText, orderType === 'antar' && styles.toggleTextActive]}>Pesan Antar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, orderType === 'ambil' && styles.toggleActive]} onPress={() => setOrderType('ambil')}>
            <Text style={[styles.toggleText, orderType === 'ambil' && styles.toggleTextActive]}>Ambil Sendiri</Text>
          </TouchableOpacity>
        </View>

        {/* Info Lokasi */}
        {orderType === 'antar' ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="location" size={20} color="#E74C3C" />
              <Text style={styles.cardTitle}>Alamat Pengantaran</Text>
            </View>
            <TouchableOpacity 
              style={[styles.addressSelector, !address && styles.addressSelectorEmpty]}
              onPress={() => navigation.navigate('Address', { cart: cartData, products: productData })}
            >
              {address ? <Text style={styles.selectedAddressText}>{address}</Text> : <Text style={styles.placeholderAddress}>Klik untuk pilih alamat...</Text>}
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="storefront" size={20} color="#002244" />
              <Text style={styles.cardTitle}>Lokasi Pengambilan</Text>
            </View>
            <Text style={styles.storeName}>Toko Budhe Bintang</Text>
            <Text style={{fontSize: 13, color: '#666'}}>Jl. Pendidikan No. 45, Tangerang Selatan.</Text>
          </View>
        )}

        {/* Rincian Pesanan */}
        <View style={styles.card}>
          <Text style={styles.cardTitleBasic}>Rincian Pesanan</Text>
          <View style={styles.divider} />
          {selectedProducts.map(item => (
            <View key={item.id.toString()} style={styles.productRow}>
              <Text style={styles.productName}>{item.name} x{cartData[item.id.toString()]}</Text>
              <Text style={styles.productPrice}>Rp {(item.price * cartData[item.id.toString()]).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Ringkasan Pembayaran */}
        <View style={styles.card}>
          <Text style={styles.cardTitleBasic}>Ringkasan Pembayaran</Text>
          <View style={styles.payRow}><Text style={styles.payLabel}>Subtotal</Text><Text>Rp {subtotal.toLocaleString()}</Text></View>
          {orderType === 'antar' && (
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Ongkos Kirim {distanceStr ? `(${distanceStr})` : ''}</Text>
              <Text>Rp {ongkir.toLocaleString()}</Text>
            </View>
          )}
          <View style={styles.payRow}><Text style={styles.payLabel}>Biaya Layanan</Text><Text>Rp {adminFee.toLocaleString()}</Text></View>
          <View style={styles.divider} />
          <View style={styles.payRow}>
            <Text style={{fontWeight: 'bold', fontSize: 16}}>Total Pembayaran</Text>
            <Text style={{fontWeight: 'bold', fontSize: 16, color: '#E74C3C'}}>Rp {totalPayment.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <View style={{flex: 1}}>
          <Text style={{fontSize: 12, color: '#666'}}>Total Tagihan</Text>
          <Text style={{fontSize: 18, fontWeight: 'bold', color: '#E74C3C'}}>Rp {totalPayment.toLocaleString()}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.orderBtn, (orderType === 'antar' && !address) && { backgroundColor: '#BDC3C7' }]} 
          onPress={handleCreateOrder}
          disabled={isProcessing}
        >
          {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.orderBtnText}>Bayar Sekarang</Text>}
        </TouchableOpacity>
      </View>

      {/* MODAL MIDTRANS */}
      <Modal visible={paymentUrl !== null} animationType="slide" onRequestClose={handleClosePayment}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClosePayment}><Ionicons name="close" size={28} /></TouchableOpacity>
            <Text style={{fontSize: 18, fontWeight: 'bold', marginLeft: 15}}>Lanjutkan Pembayaran</Text>
          </View>
          {paymentUrl && <WebView source={{ uri: paymentUrl }} style={{ flex: 1 }} />}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#fff', elevation: 2 },
  backBtn: { position: 'absolute', left: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 16, paddingBottom: 120 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#E9ECEF', borderRadius: 10, padding: 4, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  toggleActive: { backgroundColor: '#fff', elevation: 1 },
  toggleText: { color: '#666', fontWeight: 'bold' },
  toggleTextActive: { color: '#002244' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', marginLeft: 8 },
  cardTitleBasic: { fontSize: 15, fontWeight: 'bold', marginBottom: 5 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  addressSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9F9F9', borderRadius: 8, padding: 15, borderWidth: 1, borderColor: '#eee' },
  selectedAddressText: { flex: 1, fontSize: 14, color: '#333' },
  placeholderAddress: { flex: 1, fontSize: 14, color: '#999', fontStyle: 'italic' },
  storeName: { fontWeight: 'bold', color: '#002244', marginBottom: 4 },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  productName: { fontSize: 14, color: '#333', flex: 1 },
  productPrice: { fontWeight: 'bold' },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  payLabel: { color: '#777' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, elevation: 10, flexDirection: 'row', alignItems: 'center' },
  orderBtn: { backgroundColor: '#002244', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
  orderBtnText: { color: '#fff', fontWeight: 'bold' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }
});