import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { 
  SafeAreaView, StyleSheet, Text, View, FlatList, 
  TouchableOpacity, ActivityIndicator 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../Services/supabase'; // Sesuaikan path-nya

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ambil data setiap kali halaman Riwayat dibuka
  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Ambil riwayat dari database, urutkan dari yang paling baru (descending)
      const { data, error } = await supabase
        .from('order_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Gagal mengambil riwayat:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi merapikan format tanggal bawaan database
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Ionicons name="receipt-outline" size={20} color="#4A9CC8" />
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={[styles.statusBadge, item.status === 'Selesai' ? styles.bgSuccess : styles.bgWarning]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.cardBody}>
        <Text style={styles.totalLabel}>Total Belanja</Text>
        <Text style={styles.totalAmount}>Rp {item.total_amount?.toLocaleString()}</Text>
      </View>
      
      {/* Tombol Rincian (Disiapkan untuk fitur selanjutnya) */}
      <TouchableOpacity onPress={() => navigation.navigate('OrderDetails', { order: item })}>
      <Text>Lihat Rincian</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Pesanan</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#002244" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Belum ada riwayat pesanan.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { padding: 20, backgroundColor: '#fff', alignItems: 'center', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#002244' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  dateText: { marginLeft: 8, fontSize: 13, color: '#666' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  bgSuccess: { backgroundColor: '#E8F5E9' },
  bgWarning: { backgroundColor: '#FFF3E0' },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#2E7D32' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalLabel: { fontSize: 14, color: '#333' },
  totalAmount: { fontSize: 16, fontWeight: 'bold', color: '#E74C3C' },
  detailBtn: { borderWidth: 1, borderColor: '#4A9CC8', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  detailBtnText: { color: '#4A9CC8', fontWeight: 'bold', fontSize: 13 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#888', marginTop: 10 }
});