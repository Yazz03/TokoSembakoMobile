import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function OrderDetailsScreen({ route, navigation }) {
  // Menangkap data pesanan yang dikirim dari halaman Riwayat
  const { order } = route.params || {};

  // ⚠️ FALLBACK DATA: Jika data lama di database belum lengkap, kita pakai nilai cadangan
  const items = order?.items || [{ id: '1', name: 'Barang pesanan (Data lama)', qty: 1, price: order?.total_amount || 0 }];
  const serviceType = order?.service_type || 'Pesan dan antar';
  const paymentMethod = order?.payment_method || 'Tunai (Cash)';
  const userName = order?.user_name || 'Pelanggan Setia';
  const totalAmount = order?.total_amount || 0;
  const orderDate = order?.created_at 
    ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Waktu tidak diketahui';

  return (
    <SafeAreaView style={styles.container}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#002244" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rincian Pesanan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 1 & 5. INFO USER & STATUS */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Pemesan</Text>
            <Text style={styles.valueBold}>{userName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Tanggal</Text>
            <Text style={styles.value}>{orderDate}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{order?.status || 'Selesai'}</Text>
            </View>
          </View>
        </View>

        {/* 2 & 4. JENIS JASA & PEMBAYARAN */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.iconRow}>
              <Ionicons name="car-outline" size={20} color="#4A9CC8" />
              <Text style={styles.labelIcon}>Jenis Jasa</Text>
            </View>
            <Text style={styles.valueBold}>{serviceType}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <View style={styles.iconRow}>
              <Ionicons name="wallet-outline" size={20} color="#4A9CC8" />
              <Text style={styles.labelIcon}>Metode Pembayaran</Text>
            </View>
            <Text style={styles.valueBold}>{paymentMethod}</Text>
          </View>
        </View>

        {/* 1. PRODUK YANG DIORDER */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Daftar Produk</Text>
          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>{item.qty} x Rp {item.price}</Text>
              </View>
              <Text style={styles.itemTotal}>Rp {item.qty * item.price}</Text>
            </View>
          ))}
        </View>

        {/* 3. RINCIAN BIAYA */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Subtotal Produk</Text>
            <Text style={styles.value}>Rp {totalAmount}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Biaya Layanan/Ongkir</Text>
            <Text style={styles.value}>Rp 0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalValue}>Rp {totalAmount}</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', elevation: 2 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#002244' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  divider: { height: 1, backgroundColor: '#EEEEEE', marginVertical: 10 },
  
  label: { fontSize: 13, color: '#666' },
  value: { fontSize: 13, color: '#333' },
  valueBold: { fontSize: 14, fontWeight: 'bold', color: '#002244' },
  
  statusBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#27AE60', fontSize: 12, fontWeight: 'bold' },
  
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  labelIcon: { fontSize: 14, color: '#4A9CC8', fontWeight: '600' },
  
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#002244', marginBottom: 12 },
  
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemLeft: { flex: 1 },
  itemName: { fontSize: 14, color: '#333', fontWeight: '500' },
  itemQty: { fontSize: 12, color: '#888', marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  
  totalLabel: { fontSize: 15, fontWeight: 'bold', color: '#002244' },
  totalValue: { fontSize: 18, fontWeight: '900', color: '#E74C3C' }
});