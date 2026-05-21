import React, { useEffect, useState } from 'react';
import {
  SafeAreaView, View, Text, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../Services/supabase';

// ⚠️ EMAIL ADMIN YANG DIIZINKAN
export const ADMIN_EMAIL = 'diazbintang33@gmail.com';

export default function AdminDashboardScreen({ navigation }) {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [{ count: prodCount }, { count: orderCount }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('order_history').select('*', { count: 'exact', head: true }),
      ]);
      setStats({ products: prodCount || 0, orders: orderCount || 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace('Login');
  };

  const menuItems = [
    {
      icon: 'cube-outline',
      label: 'Kelola Produk',
      desc: 'Tambah, edit, hapus produk',
      color: '#4A9CC8',
      bg: '#E8F4FD',
      screen: 'AdminProduct',
    },
    {
      icon: 'bicycle-outline',
      label: 'Status Pengiriman',
      desc: 'Update status tracking pesanan',
      color: '#27AE60',
      bg: '#E8F8F0',
      screen: 'AdminOrder',
    },
    {
      icon: 'people-outline',
      label: 'Kelola Pengguna',
      desc: 'Hapus akun & riwayat pesanan',
      color: '#E67E22',
      bg: '#FEF5E7',
      screen: 'AdminUser',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Selamat datang,</Text>
          <Text style={styles.headerTitle}>Admin Panel 🛒</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#E74C3C" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Row */}
        {loading ? (
          <ActivityIndicator color="#002244" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#E8F4FD' }]}>
              <Ionicons name="cube" size={28} color="#4A9CC8" />
              <Text style={styles.statNumber}>{stats.products}</Text>
              <Text style={styles.statLabel}>Produk</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#E8F8F0' }]}>
              <Ionicons name="receipt" size={28} color="#27AE60" />
              <Text style={styles.statNumber}>{stats.orders}</Text>
              <Text style={styles.statLabel}>Pesanan</Text>
            </View>
          </View>
        )}

        {/* Menu Cards */}
        <Text style={styles.sectionTitle}>Menu Pengelolaan</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuCard}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon} size={28} color={item.color} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#002244', paddingHorizontal: 20, paddingVertical: 20,
  },
  headerSub: { color: '#7EB0C9', fontSize: 13 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 2 },
  logoutBtn: {
    backgroundColor: '#fff', width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  content: { padding: 16, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, borderRadius: 14, padding: 16,
    alignItems: 'center', elevation: 1,
  },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#002244', marginTop: 6 },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#002244', marginBottom: 12 },
  menuCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 1,
  },
  menuIcon: {
    width: 54, height: 54, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: 'bold', color: '#002244' },
  menuDesc: { fontSize: 12, color: '#888', marginTop: 3 },
});