import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ScrollView, Image, Linking, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

export default function TrackingScreen({ navigation, route }) {
  // Data yang dibawa dari Checkout
  const { cart, products, selectedAddress, lat, lon, totalPayment, subtotal, ongkir, adminFee } = route.params || {};

  // Status Pengiriman: 0 = Pesan Diterima, 1 = Dalam Perjalanan, 2 = Sampai Tujuan
  // Nanti nilai ini akan diambil dari Supabase (Admin Side)
  const [deliveryStatus, setDeliveryStatus] = useState(1); 

  // Koordinat Peta
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.005},${lat - 0.005},${lon + 0.005},${lat + 0.005}&layer=mapnik&marker=${lat},${lon}`;

  const handleFinish = () => {
    alert("Terima kasih sudah berbelanja di Warung Budhe Bintang!");
    navigation.navigate('Home'); // Kembali ke Beranda
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Header & Maps */}
      <View style={styles.mapSection}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <WebView 
          source={{ uri: mapUrl }} 
          style={styles.map}
        />
        
        <TouchableOpacity style={styles.expandButton}>
          <Text style={styles.expandText}>Lihat lebih lengkap</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        
        {/* 2. Status Pengiriman (Stepper) */}
        <View style={styles.statusContainer}>
          <View style={styles.stepper}>
            <View style={[styles.stepLine, deliveryStatus >= 1 && styles.lineActive]} />
            <View style={[styles.stepLine, deliveryStatus >= 2 && styles.lineActive]} />
            
            <View style={styles.dotsRow}>
              <View style={[styles.dot, deliveryStatus >= 0 && styles.dotActive]} />
              <View style={[styles.dot, deliveryStatus >= 1 && styles.dotActive]} />
              <View style={[styles.dot, deliveryStatus >= 2 && styles.dotActive]} />
            </View>
          </View>
          
          <View style={styles.statusLabels}>
            <Text style={[styles.statusLabel, deliveryStatus >= 0 && styles.labelActive]}>Pesan diterima</Text>
            <Text style={[styles.statusLabel, deliveryStatus >= 1 && styles.labelActive]}>Dalam perjalanan</Text>
            <Text style={[styles.statusLabel, deliveryStatus >= 2 && styles.labelActive]}>Sampai tujuan</Text>
          </View>
          <Text style={styles.timeLabel}>14:12</Text>
        </View>

        {/* 3. Driver Info & Action Buttons */}
        <View style={styles.driverCard}>
          <View style={styles.driverInfo}>
            <Image 
              source={{ uri: 'https://ui-avatars.com/api/?name=Driver+Warung&background=002244&color=fff' }} 
              style={styles.driverPhoto} 
            />
            <View>
              <Text style={styles.driverName}>Driver Warung Budhe Bintang</Text>
              <Text style={styles.driverSub}>Sedang mengantar pesananmu</Text>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => Linking.openURL('sms:08123456789')}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#3498DB" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => Linking.openURL('tel:08123456789')}>
              <Ionicons name="call-outline" size={22} color="#3498DB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Alamat Tujuan */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-sharp" size={20} color="#E74C3C" />
            <Text style={styles.sectionTitle}>Alamat Tujuan</Text>
          </View>
          <Text style={styles.addressText}>{selectedAddress}</Text>
        </View>

        {/* 5. Ringkasan Pesanan (Cart Data) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Pesanan</Text>
          <View style={styles.divider} />
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal Pesanan</Text>
            <Text style={styles.priceValue}>Rp {subtotal?.toLocaleString()}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Biaya Layanan</Text>
            <Text style={styles.priceValue}>Rp {adminFee?.toLocaleString()}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Biaya Tambahan (Ongkir)</Text>
            <Text style={styles.priceValue}>Rp {ongkir?.toLocaleString()}</Text>
          </View>
          
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>Rp {totalPayment?.toLocaleString()}</Text>
          </View>
          <Text style={styles.paymentMethod}>Sudah dibayar via Midtrans</Text>
        </View>

        {/* 6. Tombol Selesai (Hanya aktif jika status = 2) */}
        <TouchableOpacity 
          style={[styles.finishBtn, deliveryStatus < 2 && styles.finishBtnDisabled]} 
          onPress={handleFinish}
          disabled={deliveryStatus < 2}
        >
          <Text style={styles.finishBtnText}>Sampai</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mapSection: { height: 300, position: 'relative' },
  map: { flex: 1 },
  backButton: { position: 'absolute', top: 40, left: 20, zIndex: 10, backgroundColor: '#fff', padding: 8, borderRadius: 20, elevation: 5 },
  expandButton: { position: 'absolute', bottom: 10, right: 20, backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15, elevation: 3 },
  expandText: { fontSize: 12, color: '#666' },

  content: { flex: 1, padding: 20 },

  statusContainer: { alignItems: 'center', marginBottom: 25 },
  stepper: { width: '80%', height: 30, justifyContent: 'center', position: 'relative' },
  dotsRow: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 2 },
  dot: { width: 15, height: 15, borderRadius: 10, backgroundColor: '#E0E0E0' },
  dotActive: { backgroundColor: '#3498DB' },
  stepLine: { position: 'absolute', height: 3, backgroundColor: '#E0E0E0', width: '50%', top: 6 },
  lineActive: { backgroundColor: '#3498DB' },
  statusLabels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 },
  statusLabel: { fontSize: 10, color: '#999', textAlign: 'center', width: '33%' },
  labelActive: { color: '#333', fontWeight: 'bold' },
  timeLabel: { fontSize: 10, color: '#999', marginTop: 5 },

  driverCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 15, borderRadius: 15, marginBottom: 20 },
  driverInfo: { flexDirection: 'row', alignItems: 'center' },
  driverPhoto: { width: 45, height: 45, borderRadius: 25, marginRight: 12 },
  driverName: { fontSize: 14, fontWeight: 'bold' },
  driverSub: { fontSize: 11, color: '#666' },
  actionButtons: { flexDirection: 'row' },
  iconBtn: { padding: 8, backgroundColor: '#fff', borderRadius: 20, marginLeft: 10, elevation: 2 },

  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', marginLeft: 5 },
  addressText: { fontSize: 13, color: '#666', lineHeight: 20 },

  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontSize: 13, color: '#999' },
  priceValue: { fontSize: 13, color: '#333' },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#002244' },
  paymentMethod: { fontSize: 11, color: '#27AE60', textAlign: 'right', marginTop: 5, fontStyle: 'italic' },

  finishBtn: { backgroundColor: '#3498DB', padding: 16, borderRadius: 15, alignItems: 'center', marginBottom: 40 },
  finishBtnDisabled: { backgroundColor: '#BDC3C7' },
  finishBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});