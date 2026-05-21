import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Image, Linking, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { supabase } from '../../Services/supabase';

export default function TrackingScreen({ navigation, route }) {
  const { selectedAddress, lat, lon, totalPayment, subtotal, ongkir, adminFee } = route.params || {};

  const [deliveryStatus, setDeliveryStatus] = useState(0);
  const [orderId, setOrderId]               = useState(null);

  const mapUrl = lat && lon
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.005},${lat - 0.005},${lon + 0.005},${lat + 0.005}&layer=mapnik&marker=${lat},${lon}`
    : 'https://www.openstreetmap.org/export/embed.html?bbox=106.69,-6.29,106.74,-6.25&layer=mapnik';

  // ── Ambil order terbaru milik user & simpan ke DB saat pertama buka ──
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Ambil order terbaru user ini
        const { data, error } = await supabase
          .from('order_history')
          .select('id, delivery_status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          setOrderId(data.id);
          setDeliveryStatus(data.delivery_status ?? 0);
        }
      } catch (e) {
        console.error('TrackingScreen init error:', e.message);
      }
    };
    init();
  }, []);

  // ── Polling setiap 5 detik untuk update status real-time ──
  useEffect(() => {
    if (!orderId) return;

    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from('order_history')
        .select('delivery_status')
        .eq('id', orderId)
        .single();

      if (!error && data) {
        setDeliveryStatus(data.delivery_status ?? 0);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId]);

  const handleFinish = async () => {
    // Update status order menjadi Selesai
    if (orderId) {
      await supabase
        .from('order_history')
        .update({ status: 'Selesai' })
        .eq('id', orderId);
    }
    Alert.alert('Pesanan Selesai', 'Terima kasih sudah berbelanja di Warung Budhe Bintang!');
    navigation.navigate('Home');
  };

  const statusLabels = ['Pesan diterima', 'Dalam perjalanan', 'Sampai tujuan'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapSection}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <WebView source={{ uri: mapUrl }} style={styles.map} />
        <TouchableOpacity style={styles.expandButton}>
          <Text style={styles.expandText}>Lihat lebih lengkap</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* ── Stepper ── */}
        <View style={styles.statusContainer}>
          <View style={styles.stepper}>
            <View style={styles.trackLine}>
              <View style={[
                styles.trackProgress,
                { width: deliveryStatus === 0 ? '0%' : deliveryStatus === 1 ? '50%' : '100%' }
              ]} />
            </View>
            <View style={styles.dotsRow}>
              {[0, 1, 2].map(i => (
                <View key={i} style={[styles.dot, deliveryStatus >= i && styles.dotActive]}>
                  {deliveryStatus >= i && <Ionicons name="checkmark" size={10} color="#fff" />}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.statusLabels}>
            {statusLabels.map((label, i) => (
              <Text key={i} style={[styles.statusLabel, deliveryStatus >= i && styles.labelActive]}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.activeBadge}>
            <Ionicons name="radio-button-on" size={12} color="#27AE60" style={{ marginRight: 5 }} />
            <Text style={styles.activeBadgeText}>{statusLabels[deliveryStatus]}</Text>
          </View>
        </View>

        {/* ── Driver Card ── */}
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

        {/* ── Alamat ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-sharp" size={20} color="#E74C3C" />
            <Text style={styles.sectionTitle}>Alamat Tujuan</Text>
          </View>
          <Text style={styles.addressText}>{selectedAddress}</Text>
        </View>

        {/* ── Ringkasan Bayar ── */}
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

        {/* ── Tombol Selesai ── */}
        <TouchableOpacity
          style={[styles.finishBtn, deliveryStatus < 2 && styles.finishBtnDisabled]}
          onPress={handleFinish}
          disabled={deliveryStatus < 2}
        >
          <Ionicons
            name={deliveryStatus < 2 ? 'time-outline' : 'checkmark-circle'}
            size={20} color="#fff" style={{ marginRight: 6 }}
          />
          <Text style={styles.finishBtnText}>
            {deliveryStatus < 2 ? 'Menunggu konfirmasi sampai...' : 'Pesanan Sudah Sampai!'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mapSection: { height: 300, position: 'relative' },
  map: { flex: 1 },
  backButton: {
    position: 'absolute', top: 40, left: 20, zIndex: 10,
    backgroundColor: '#fff', padding: 8, borderRadius: 20, elevation: 5,
  },
  expandButton: {
    position: 'absolute', bottom: 10, right: 20,
    backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15, elevation: 3,
  },
  expandText: { fontSize: 12, color: '#666' },
  content: { flex: 1, padding: 20 },
  statusContainer: { alignItems: 'center', marginBottom: 25 },
  stepper: { width: '80%', height: 36, justifyContent: 'center', position: 'relative', marginBottom: 10 },
  trackLine: {
    position: 'absolute', left: 0, right: 0, top: 13,
    height: 4, backgroundColor: '#E0E0E0', borderRadius: 2,
  },
  trackProgress: { height: '100%', backgroundColor: '#3498DB', borderRadius: 2 },
  dotsRow: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 2 },
  dot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff', elevation: 2,
  },
  dotActive: { backgroundColor: '#3498DB' },
  statusLabels: { flexDirection: 'row', justifyContent: 'space-between', width: '90%' },
  statusLabel: { fontSize: 10, color: '#999', textAlign: 'center', width: '33%' },
  labelActive: { color: '#333', fontWeight: 'bold' },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F8F0', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, marginTop: 10,
  },
  activeBadgeText: { fontSize: 12, color: '#27AE60', fontWeight: 'bold' },
  driverCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F8F9FA', padding: 15, borderRadius: 15, marginBottom: 20,
  },
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
  finishBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#3498DB', padding: 16, borderRadius: 15, marginBottom: 40,
  },
  finishBtnDisabled: { backgroundColor: '#BDC3C7' },
  finishBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});