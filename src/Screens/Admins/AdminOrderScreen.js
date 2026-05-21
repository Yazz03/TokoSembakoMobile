import React, { useState, useCallback } from 'react';
import {
  SafeAreaView, View, Text, TouchableOpacity,
  StyleSheet, FlatList, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../Services/supabase';

const STATUS_OPTIONS = [
  { value: 0, label: 'Pesan Diterima',    color: '#888',    bg: '#F0F0F0' },
  { value: 1, label: 'Dalam Perjalanan',  color: '#E67E22', bg: '#FEF5E7' },
  { value: 2, label: 'Sampai Tujuan',     color: '#27AE60', bg: '#E8F8F0' },
];

export default function AdminOrderScreen({ navigation }) {
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedStatus, setSelectedStatus] = useState({});
  const [openDropdown, setOpenDropdown]   = useState(null);
  const [updating, setUpdating]           = useState(null);
  const [error, setError]                 = useState(null);

  useFocusEffect(useCallback(() => { fetchOrders(); }, []));

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('order_history')
        .select('id, created_at, total_amount, status, delivery_status, user_id')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const list = data || [];
      setOrders(list);

      // Inisialisasi pilihan dropdown dari nilai DB (fallback ke 0 jika null)
      const initStatus = {};
      list.forEach(o => {
        initStatus[o.id] = o.delivery_status ?? 0;
      });
      setSelectedStatus(initStatus);

    } catch (err) {
      console.error('fetchOrders error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (orderId) => {
    const newStatus = selectedStatus[orderId] ?? 0;
    setUpdating(orderId);
    setOpenDropdown(null);

    const { error: updateError } = await supabase
      .from('order_history')
      .update({ delivery_status: newStatus })
      .eq('id', orderId);

    setUpdating(null);

    if (updateError) {
      // Jika kolom delivery_status belum ada, tampilkan pesan khusus
      if (updateError.message.includes('delivery_status')) {
        Alert.alert(
          'Kolom Belum Ada',
          'Kolom "delivery_status" belum ada di tabel order_history.\n\n' +
          'Buka Supabase → Table Editor → order_history → Add Column:\n' +
          '• Name: delivery_status\n• Type: int4\n• Default: 0',
        );
      } else {
        Alert.alert('Error', 'Gagal update: ' + updateError.message);
      }
      return;
    }

    Alert.alert('Berhasil ✅', 'Status pengiriman diperbarui!');
    // Update state lokal agar UI langsung berubah tanpa refetch
    setOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, delivery_status: newStatus } : o)
    );
  };

  const formatDate = (str) =>
    new Date(str).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const getStatusInfo = (val) =>
    STATUS_OPTIONS.find(s => s.value === (val ?? 0)) ?? STATUS_OPTIONS[0];

  const renderItem = ({ item }) => {
    const currentInfo = getStatusInfo(item.delivery_status);
    const chosenVal   = selectedStatus[item.id] ?? 0;
    const chosenInfo  = getStatusInfo(chosenVal);
    const isOpen      = openDropdown === item.id;
    const unchanged   = chosenVal === (item.delivery_status ?? 0);

    return (
      <View style={styles.card}>
        {/* Header kartu */}
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.orderId}>Order #{item.id}</Text>
            <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: currentInfo.bg }]}>
            <Text style={[styles.statusBadgeText, { color: currentInfo.color }]}>
              {currentInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.totalText}>
          Total:{' '}
          <Text style={styles.totalAmount}>
            Rp {item.total_amount?.toLocaleString() ?? '-'}
          </Text>
        </Text>

        {/* Dropdown pilih status */}
        <Text style={styles.dropdownLabel}>Ubah Status Pengiriman:</Text>
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={() => setOpenDropdown(isOpen ? null : item.id)}
        >
          <View style={[styles.dot, { backgroundColor: chosenInfo.color }]} />
          <Text style={styles.dropdownTriggerText}>{chosenInfo.label}</Text>
          <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#888" />
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.dropdownMenu}>
            {STATUS_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.dropdownOption,
                  chosenVal === opt.value && { backgroundColor: opt.bg },
                ]}
                onPress={() => {
                  setSelectedStatus(prev => ({ ...prev, [item.id]: opt.value }));
                  setOpenDropdown(null);
                }}
              >
                <View style={[styles.dot, { backgroundColor: opt.color }]} />
                <Text style={[styles.dropdownOptionText, { color: opt.color }]}>
                  {opt.label}
                </Text>
                {chosenVal === opt.value && (
                  <Ionicons name="checkmark" size={16} color={opt.color} style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tombol Update */}
        <TouchableOpacity
          style={[styles.updateBtn, unchanged && styles.updateBtnDisabled]}
          onPress={() => handleUpdate(item.id)}
          disabled={unchanged || updating === item.id}
        >
          {updating === item.id
            ? <ActivityIndicator color="#fff" size="small" />
            : (
              <>
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.updateBtnText}>
                  {unchanged ? 'Tidak Ada Perubahan' : 'Update Status'}
                </Text>
              </>
            )
          }
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Status Pengiriman</Text>
        <TouchableOpacity onPress={fetchOrders}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#002244" size="large" style={{ marginTop: 50 }} />
      ) : error ? (
        /* Tampilkan pesan error jika ada */
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={50} color="#E74C3C" />
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Belum ada pesanan masuk</Text>
              <Text style={styles.emptySubText}>
                Data akan muncul setelah ada user yang checkout
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#002244', paddingHorizontal: 16, paddingVertical: 16,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, elevation: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 14, fontWeight: 'bold', color: '#002244' },
  orderDate: { fontSize: 12, color: '#888', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  totalText: { fontSize: 13, color: '#555', marginBottom: 14 },
  totalAmount: { fontWeight: 'bold', color: '#002244' },
  dropdownLabel: { fontSize: 12, color: '#888', marginBottom: 6 },
  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 12, backgroundColor: '#F9F9F9',
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  dropdownTriggerText: { flex: 1, fontSize: 14, color: '#333', fontWeight: '600' },
  dropdownMenu: { borderWidth: 1, borderColor: '#eee', borderRadius: 10, marginTop: 4, overflow: 'hidden' },
  dropdownOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff',
  },
  dropdownOptionText: { fontSize: 14, fontWeight: '600' },
  updateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#002244', borderRadius: 10,
    padding: 13, marginTop: 12,
  },
  updateBtnDisabled: { backgroundColor: '#BDC3C7' },
  updateBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#555', marginTop: 10, fontWeight: 'bold', fontSize: 15 },
  emptySubText: { color: '#aaa', marginTop: 6, fontSize: 12, textAlign: 'center', paddingHorizontal: 40 },
  errorContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 30 },
  errorText: { color: '#E74C3C', marginTop: 10, textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 16, backgroundColor: '#002244', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: 'bold' },
});