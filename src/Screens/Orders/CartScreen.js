import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Image, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../Services/supabase'; // Sesuaikan path jika berbeda
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; // Untuk refresh data saat halaman dibuka

export default function CartScreen({ navigation }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gunakan useFocusEffect agar keranjang selalu ter-refresh otomatis setiap kali halaman dibuka
  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [])
  );

  const fetchCart = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // PENTING: Tambahkan 'stock' agar CheckoutScreen tahu jumlah stok asli
      const { data, error } = await supabase
        .from('cart')
        .select(`
          id,
          quantity,
          products (id, name, price, image_url, stock)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.products?.price * item.quantity), 0);
  };

  const removeItem = async (cartId) => {
    const { error } = await supabase.from('cart').delete().eq('id', cartId);
    if (!error) {
      setCartItems(prev => prev.filter(item => item.id !== cartId));
    } else {
      Alert.alert("Error", "Gagal menghapus produk dari keranjang.");
    }
  };

  // 👇 FUNGSI BARU: Untuk menghapus semua isi keranjang di database Supabase
  const clearCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Hapus semua data di tabel 'cart' yang milik user ini
      const { error } = await supabase.from('cart').delete().eq('user_id', user.id);
      
      if (error) throw error;
      
      // Kosongkan tampilan layar
      setCartItems([]);
    } catch (error) {
      console.error("Gagal mengosongkan keranjang di database:", error.message);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert("Keranjang Kosong", "Silakan pilih produk terlebih dahulu.");
      return;
    }

    // 1. Format data agar cocok dibaca oleh CheckoutScreen
    const cartData = {};
    const productData = [];

    cartItems.forEach(item => {
      if(item.products) {
        cartData[item.products.id.toString()] = item.quantity;
        productData.push({
          id: item.products.id,
          name: item.products.name,
          price: item.products.price,
          image_url: item.products.image_url,
          stock: item.products.stock // Dioper untuk logika pemotongan stok
        });
      }
    });

    // 2. Navigasi ke CheckoutScreen dengan membawa data dan fungsi clearCart
    navigation.navigate('Checkout', {
      cart: cartData,
      products: productData,
      resetCart: clearCart // <--- Fungsi dikirim ke sini!
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartCard}>
      <View style={styles.imageBox}>
        {item.products?.image_url ? (
          <Image source={{ uri: item.products.image_url }} style={styles.itemImg} />
        ) : (
          <Ionicons name="cube-outline" size={30} color="#ccc" />
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.products?.name}</Text>
        <Text style={styles.itemPrice}>Rp {item.products?.price.toLocaleString()} x {item.quantity}</Text>
      </View>
      <View style={styles.actionBox}>
        <Text style={styles.subTotal}>Rp {(item.products?.price * item.quantity).toLocaleString()}</Text>
        <TouchableOpacity onPress={() => removeItem(item.id)}>
          <Ionicons name="trash-outline" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Keranjang Saya</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4A9CC8" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={cartItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={80} color="#ccc" />
              <Text style={styles.emptyText}>Keranjang Anda kosong</Text>
            </View>
          }
        />
      )}

      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>Rp {calculateTotal().toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <Text style={styles.checkoutText}>Bayar Sekarang</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', backgroundColor: '#fff', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  cartCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 1, alignItems: 'center' },
  imageBox: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  itemImg: { width: '100%', height: '100%' },
  itemInfo: { flex: 1, marginLeft: 15 },
  itemName: { fontSize: 16, fontWeight: 'bold' },
  itemPrice: { color: '#888', marginTop: 5 },
  actionBox: { alignItems: 'flex-end', justifyContent: 'space-between', height: 50 },
  subTotal: { fontWeight: 'bold', color: '#4A9CC8' },
  footer: { padding: 20, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  totalLabel: { fontSize: 16, color: '#888' },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: '#002244' },
  checkoutBtn: { backgroundColor: '#002244', padding: 15, borderRadius: 10, alignItems: 'center' },
  checkoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#888', marginTop: 10, fontSize: 16 }
});