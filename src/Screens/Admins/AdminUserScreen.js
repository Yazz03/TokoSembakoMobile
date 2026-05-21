import React, { useState, useCallback } from 'react';
import {
  SafeAreaView, View, Text, TextInput, TouchableOpacity,
  StyleSheet, FlatList, Alert, ActivityIndicator, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../Services/supabase';

export default function AdminUserScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  // Modal ganti password
  const [pwModal, setPwModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  useFocusEffect(useCallback(() => { fetchOrders(); }, []));

  const fetchOrders = async () => {
    setLoading(true);
    // Ambil semua riwayat, dikelompokkan berdasarkan user_id
    const { data, error } = await supabase
      .from('order_history')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setOrders(data || []);
    setLoading(false);
  };

  const handleDeleteHistory = (item) => {
    Alert.alert(
      'Hapus Riwayat',
      `Hapus riwayat Order #${item.id}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus', style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('order_history')
              .delete()
              .eq('id', item.id);
            if (error) Alert.alert('Error', error.message);
            else fetchOrders();
          },
        },
      ]
    );
  };

  const handleDeleteAllHistory = () => {
    Alert.alert(
      'Hapus SEMUA Riwayat',
      'Yakin hapus SEMUA data riwayat pesanan dari seluruh pengguna? Tindakan ini tidak bisa dibatalkan!',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Semua', style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('order_history')
              .delete()
              .neq('id', 0); // Kondisi agar semua baris dihapus
            if (error) Alert.alert('Error', error.message);
            else {
              Alert.alert('Selesai', 'Semua riwayat pesanan telah dihapus.');
              fetchOrders();
            }
          },
        },
      ]
    );
  };

  // Ganti password akun admin sendiri (hanya bisa ganti akun yang sedang login)
  const handleChangePassword = async () => {
    if (newPassword.trim().length < 6) {
      Alert.alert('Peringatan', 'Password minimal 6 karakter.');
      return;
    }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });
    setSavingPw(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Berhasil', 'Password admin berhasil diperbarui!');
      setPwModal(false);
      setNewPassword('');
    }
  };

  const formatDate = (str) =>
    new Date(str).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <View style={styles.iconBox}>
            <Ionicons name="receipt-outline" size={20} color="#4A9CC8" />
          </View>
          <View>
            <Text style={styles.orderId}>Order #{item.id}</Text>
            <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
            <Text style={styles.orderTotal}>Rp {item.total_amount?.toLocaleString()}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge,
          item.status === 'Selesai' ? styles.bgSuccess : styles.bgWarning
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteHistBtn}
        onPress={() => handleDeleteHistory(item)}
      >
        <Ionicons name="trash-outline" size={14} color="#E74C3C" />
        <Text style={styles.deleteHistText}>Hapus Riwayat Ini</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kelola Pengguna</Text>
        <TouchableOpacity onPress={fetchOrders}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionCard} onPress={handleDeleteAllHistory}>
          <View style={[styles.actionIcon, { backgroundColor: '#FDEDEC' }]}>
            <Ionicons name="trash" size={22} color="#E74C3C" />
          </View>
          <Text style={styles.actionLabel}>Hapus Semua{'\n'}Riwayat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => setPwModal(true)}>
          <View style={[styles.actionIcon, { backgroundColor: '#E8F4FD' }]}>
            <Ionicons name="key" size={22} color="#4A9CC8" />
          </View>
          <Text style={styles.actionLabel}>Ubah Password{'\n'}Admin</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>
        Semua Riwayat Pesanan ({orders.length})
      </Text>

      {loading ? (
        <ActivityIndicator color="#002244" size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Tidak ada riwayat pesanan</Text>
            </View>
          }
        />
      )}

      {/* Modal Ganti Password */}
      <Modal visible={pwModal} animationType="slide" transparent onRequestClose={() => setPwModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ubah Password Admin</Text>
              <TouchableOpacity onPress={() => setPwModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalNote}>
              Ini akan mengubah password untuk akun admin yang sedang aktif.
            </Text>
            <TextInput
              style={styles.formInput}
              placeholder="Password Baru (min. 6 karakter)"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity
              style={[styles.saveBtn, savingPw && { opacity: 0.6 }]}
              onPress={handleChangePassword}
              disabled={savingPw}
            >
              {savingPw
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>Simpan Password</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  actionRow: { flexDirection: 'row', padding: 16, gap: 12 },
  actionCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    padding: 14, alignItems: 'center', elevation: 1,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: 'bold', color: '#002244', textAlign: 'center', lineHeight: 18 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#002244', paddingHorizontal: 16, marginBottom: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 10, elevation: 1,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#E8F4FD', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  orderId: { fontSize: 13, fontWeight: 'bold', color: '#002244' },
  orderDate: { fontSize: 11, color: '#888' },
  orderTotal: { fontSize: 13, fontWeight: 'bold', color: '#E74C3C', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  bgSuccess: { backgroundColor: '#E8F5E9' },
  bgWarning: { backgroundColor: '#FFF3E0' },
  statusText: { fontSize: 11, fontWeight: 'bold', color: '#2E7D32' },
  deleteHistBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#FDEDEC',
    paddingVertical: 7, borderRadius: 8,
    justifyContent: 'center', backgroundColor: '#FFF5F5',
  },
  deleteHistText: { color: '#E74C3C', fontSize: 12, fontWeight: 'bold', marginLeft: 5 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#888', marginTop: 10 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 50,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#002244' },
  modalNote: { fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 20 },
  formInput: {
    backgroundColor: '#F5F7FA', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 10, fontSize: 14, color: '#333',
  },
  saveBtn: {
    backgroundColor: '#002244', borderRadius: 12,
    padding: 15, alignItems: 'center', marginTop: 6,
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});