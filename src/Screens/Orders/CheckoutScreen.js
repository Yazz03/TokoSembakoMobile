import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { 
  SafeAreaView, StyleSheet, Text, View, ScrollView, 
  TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator 
} from 'react-native';
import { WebView } from 'react-native-webview';
import { supabase } from '../../Services/supabase'; 

export default function CheckoutScreen({ navigation, route }) {
  const cartData    = route.params?.cart     || {};
  const productData = Array.isArray(route.params?.products) ? route.params.products : [];
  
  const [orderType,    setOrderType]    = useState('antar');
  const [address,      setAddress]      = useState(''); 
  const [note,         setNote]         = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUrl,   setPaymentUrl]   = useState(null);

  useEffect(() => {
    if (route.params?.selectedAddress) setAddress(route.params.selectedAddress);
  }, [route.params?.selectedAddress]);

  // ── Hitung harga ──
  const selectedProducts = productData.filter(p => (cartData[p.id?.toString()] || 0) > 0);
  const subtotal = selectedProducts.reduce(
    (sum, item) => sum + (item.price * cartData[item.id.toString()]), 0
  );

  const storeLat = -6.2833;
  const storeLon = 106.7166;
  const userLat  = route.params?.lat;
  const userLon  = route.params?.lon;

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R    = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a    = Math.sin(dLat/2)**2 +
                 Math.cos(lat1*(Math.PI/180)) * Math.cos(lat2*(Math.PI/180)) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  let ongkir = 0, distanceStr = '';
  if (orderType === 'antar' && userLat && userLon) {
    const dist = getDistance(storeLat, storeLon, userLat, userLon);
    distanceStr = dist.toFixed(1) + ' KM';
    ongkir = dist <= 2 ? 5000 : 5000 + (Math.ceil(dist - 2) * 2000);
  }

  const adminFee     = 2000;
  const totalPayment = subtotal + adminFee + ongkir;

  // ── Update stok produk ──
  const updateProductStock = async () => {
    for (const item of selectedProducts) {
      const qty = cartData[item.id.toString()];
      await supabase
        .from('products')
        .update({ stock: (item.stock || 0) - qty })
        .eq('id', item.id);
    }
  };

  // ── Kosongkan keranjang ──
  const clearUserCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('cart').delete().eq('user_id', user.id);
  };

  // ── Simpan ke order_history dengan delivery_status: 0 ──
  const saveOrderHistory = async (statusPesanan) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('order_history').insert([{
        user_id:         user.id,
        total_amount:    totalPayment,
        status:          statusPesanan,  // 'Menunggu' atau 'Selesai'
        delivery_status: 0,              // ← Selalu mulai dari 0 (Pesan Diterima)
        payment_method:  'Pembayaran Digital',
      }]);

      if (error) {
        console.error('saveOrderHistory error:', error.message);
      } else {
        console.log('Order history tersimpan ✅');
      }
    } catch (e) {
      console.error('saveOrderHistory exception:', e.message);
    }
  };

  // ── Callback setelah WebView payment ditutup ──
  const handleClosePayment = async () => {
    setPaymentUrl(null);
    setIsProcessing(true);

    await updateProductStock();
    await clearUserCart();

    // Simpan riwayat dengan status awal
    const statusAwal = orderType === 'antar' ? 'Menunggu' : 'Selesai';
    await saveOrderHistory(statusAwal);

    if (route.params?.resetCart) route.params.resetCart();
    setIsProcessing(false);

    if (orderType === 'antar') {
      navigation.navigate('Processing', {
        targetScreen: 'Tracking',
        cart: cartData, products: productData,
        selectedAddress: address,
        lat: userLat, lon: userLon,
        subtotal, ongkir, adminFee, totalPayment,
      });
    } else {
      navigation.navigate('Processing', {
        targetScreen: 'SuccessAmbil',
        cart: cartData, products: productData,
        totalPayment,
        paymentMethod: 'Pembayaran Digital',
        userEmail: (await supabase.auth.getUser()).data.user?.email || '',
      });
    }
  };

  // ── Buat token Midtrans ──
  const handleCreateOrder = async () => {
    if (orderType === 'antar' && address.trim() === '') {
      Alert.alert('Alamat Belum Dipilih', 'Pilih alamat pengantaran terlebih dahulu.');
      return;
    }
    setIsProcessing(true);
    const orderId = 'WRG-' + Date.now();

    try {
      const response = await fetch('http://10.0.2.2:8080/api/get-token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ order_id: orderId, gross_amount: totalPayment }),
      });
      const data = await response.json();
      if (data.token) {
        setPaymentUrl(`https://app.sandbox.midtrans.com/snap/v2/vtweb/${data.token}`);
      } else {
        Alert.alert('Error', 'Gagal mendapatkan izin pembayaran dari server.');
      }
    } catch {
      Alert.alert('Server Offline', 'Pastikan server Node.js sudah berjalan.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, orderType === 'antar' && styles.toggleActive]}
            onPress={() => setOrderType('antar')}
          >
            <Text style={[styles.toggleText, orderType === 'antar' && styles.toggleTextActive]}>Pesan Antar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, orderType === 'ambil' && styles.toggleActive]}
            onPress={() => setOrderType('ambil')}
          >
            <Text style={[styles.toggleText, orderType === 'ambil' && styles.toggleTextActive]}>Ambil Sendiri</Text>
          </TouchableOpacity>
        </View>

        {/* Lokasi */}
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
              {address
                ? <Text style={styles.selectedAddressText}>{address}</Text>
                : <Text style={styles.placeholderAddress}>Klik untuk pilih alamat...</Text>
              }
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
            <Text style={{ fontSize: 13, color: '#666' }}>Jl. Pendidikan No. 45, Tangerang Selatan.</Text>
          </View>
        )}

        {/* Rincian produk */}
        <View style={styles.card}>
          <Text style={styles.cardTitleBasic}>Rincian Pesanan</Text>
          <View style={styles.divider} />
          {selectedProducts.map(item => (
            <View key={item.id.toString()} style={styles.productRow}>
              <Text style={styles.productName}>{item.name} x{cartData[item.id.toString()]}</Text>
              <Text style={styles.productPrice}>
                Rp {(item.price * cartData[item.id.toString()]).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Ringkasan bayar */}
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
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Total Pembayaran</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#E74C3C' }}>
              Rp {totalPayment.toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: '#666' }}>Total Tagihan</Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#E74C3C' }}>
            Rp {totalPayment.toLocaleString()}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.orderBtn, (orderType === 'antar' && !address) && { backgroundColor: '#BDC3C7' }]}
          onPress={handleCreateOrder}
          disabled={isProcessing}
        >
          {isProcessing
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.orderBtnText}>Bayar Sekarang</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Modal Midtrans */}
      <Modal visible={paymentUrl !== null} animationType="slide" onRequestClose={handleClosePayment}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClosePayment}>
              <Ionicons name="close" size={28} />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 15 }}>Lanjutkan Pembayaran</Text>
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
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
});