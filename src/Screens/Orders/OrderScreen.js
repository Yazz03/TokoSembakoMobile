import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { 
  FlatList, Image, SafeAreaView, StyleSheet, Text, TextInput, 
  TouchableOpacity, View, Alert, Modal, ScrollView 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // Sensor untuk refresh otomatis
import { supabase } from '../../Services/supabase';

export default function OrderScreen({ navigation, route }) {
  const { mode } = route.params || { mode: 'Pesan' }; 
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState({}); 
  const [isCartVisible, setIsCartVisible] = useState(false);

  // 🔄 REFRESH OTOMATIS: Berjalan setiap kali halaman dibuka
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
      fetchInitialCart();
    }, [])
  );

  // 1. Ambil Data Produk dari Supabase
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      if (data) {
        setProducts(data);
        // Tetap sinkronkan dengan hasil pencarian jika user sedang mengetik
        if (search) {
          setFilteredProducts(data.filter(item => 
            item.name.toLowerCase().includes(search.toLowerCase())
          ));
        } else {
          setFilteredProducts(data);
        }
      }
    } catch (error) {
      console.error("Gagal ambil produk:", error.message);
    }
  };

  // 2. Ambil Data Keranjang User dari Supabase
  const fetchInitialCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('cart')
        .select('product_id, quantity')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const cartObj = {};
      if (data) {
        data.forEach(item => { 
          cartObj[item.product_id.toString()] = item.quantity; 
        });
      }
      setCart(cartObj); // Update state keranjang lokal
    } catch (error) {
      console.error("Gagal load keranjang:", error.message);
    }
  };

  // 3. Fungsi Tambah/Kurang Barang
  const updateCart = async (productId, delta) => {
    const pIdStr = productId.toString();
    const currentQty = cart[pIdStr] || 0;
    const newQty = Math.max(0, currentQty + delta);
    
    // Validasi Stok
    const product = products.find(p => p.id === productId);
    if (delta > 0 && product && newQty > product.stock) {
      Alert.alert("Stok Terbatas", `Stok ${product.name} hanya ada ${product.stock}.`);
      return; 
    }

    // Update UI Cepat (Optimistic)
    setCart(prev => ({ ...prev, [pIdStr]: newQty }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (newQty === 0) {
        // Hapus dari database jika qty jadi 0
        await supabase.from('cart')
          .delete()
          .match({ user_id: user.id, product_id: productId });
      } else {
        // Update atau Tambah ke database
        await supabase.from('cart').upsert(
          { user_id: user.id, product_id: productId, quantity: newQty }, 
          { onConflict: 'user_id,product_id' }
        );
      }
    } catch (error) {
      console.error("Gagal sinkronisasi keranjang:", error.message);
      setCart(prev => ({ ...prev, [pIdStr]: currentQty })); // Rollback jika gagal
    }
  };

  // 4. Fungsi Reset Keranjang (Untuk dikirim ke Checkout)
  const clearCartState = async () => {
    setCart({}); // Kosongkan tampilan lokal
  };

  const handleSearch = (text) => {
    setSearch(text);
    const filtered = products.filter(item => 
      item.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const calculateTotal = () => {
    return products.reduce((sum, item) => {
      const qty = cart[item.id.toString()] || 0;
      return sum + (item.price * qty);
    }, 0);
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  const renderItem = ({ item }) => {
    const qty = cart[item.id.toString()] || 0;
    const isMaxStock = qty >= item.stock;

    return (
      <View style={styles.productRow}>
        <View style={styles.imageBox}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.productImg} />
          ) : (
            <Ionicons name="cube-outline" size={30} color="#ccc" />
          )}
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.nameText}>{item.name}</Text>
          <Text style={styles.priceText}>Rp {item.price.toLocaleString()}</Text>
          <Text style={{ fontSize: 12, color: item.stock < 5 ? '#E74C3C' : '#7F8C8D', marginTop: 2 }}>
            Stok: {item.stock}
          </Text>
        </View>
        <View style={styles.controlBox}>
          {qty > 0 ? (
            <View style={styles.qtyContainer}>
              <TouchableOpacity onPress={() => updateCart(item.id, -1)} style={styles.qtyBtn}>
                <Ionicons name="remove" size={18} color="#002244" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
              <TouchableOpacity 
                onPress={() => updateCart(item.id, 1)} 
                style={[styles.qtyBtn, isMaxStock && { opacity: 0.3 }]}
                disabled={isMaxStock}
              >
                <Ionicons name="add" size={18} color="#002244" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={() => updateCart(item.id, 1)} 
              style={[styles.addBtn, item.stock === 0 && { backgroundColor: '#ccc' }]}
              disabled={item.stock === 0}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#000" />
          <Text style={styles.backText}>Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{mode}</Text>
        <View style={{ width: 80 }} />
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#7EB0C9" />
          <TextInput 
            placeholder="Cari barang sembako..." 
            style={styles.searchInput} 
            value={search} 
            onChangeText={handleSearch} 
          />
        </View>
      </View>

      <FlatList 
        data={filteredProducts} 
        renderItem={renderItem} 
        keyExtractor={item => item.id.toString()} 
        contentContainerStyle={{ paddingBottom: 100 }} 
      />

      {totalItems > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerLeft} onPress={() => setIsCartVisible(true)}>
            <View style={styles.cartIconBox}>
              <Ionicons name="cart-outline" size={28} color="#fff" />
              <View style={styles.badge}><Text style={styles.badgeText}>{totalItems}</Text></View>
            </View>
            <View style={{ marginLeft: 15 }}>
              <Text style={styles.footerTotal}>Rp {calculateTotal().toLocaleString()}</Text>
              <Text style={{ color: '#7EB0C9', fontSize: 10 }}>Klik untuk rincian</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.checkoutBtn} 
            onPress={() => navigation.navigate('Checkout', { 
              cart: cart, 
              products: products,
              resetCart: clearCartState // Kirim fungsi reset ke Checkout
            })}
          >
            <Text style={styles.checkoutText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal Rincian Keranjang */}
      <Modal animationType="slide" transparent={true} visible={isCartVisible} onRequestClose={() => setIsCartVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.dimmedArea} onPress={() => setIsCartVisible(false)} />
          <View style={styles.cartSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Rincian Pesanan</Text>
            <ScrollView style={{ marginBottom: 20 }}>
              {products.map(item => {
                const qty = cart[item.id.toString()] || 0;
                if (qty > 0) return (
                  <View key={item.id.toString()} style={styles.sheetRow}>
                    <Text style={{ flex: 2, fontSize: 15 }}>{item.name}</Text>
                    <Text style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>x{qty}</Text>
                    <Text style={{ flex: 1.5, textAlign: 'right', fontWeight: 'bold', color: '#002244' }}>
                      Rp {(item.price * qty).toLocaleString()}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.closeSheetBtn} onPress={() => setIsCartVisible(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eee', padding: 8, borderRadius: 20 },
  backText: { marginLeft: 5, fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#7EB0C9' },
  searchSection: { paddingHorizontal: 16, marginBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 25, paddingHorizontal: 15, height: 45 },
  searchInput: { flex: 1, marginLeft: 10 },
  productRow: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center' },
  imageBox: { width: 60, height: 60, backgroundColor: '#f9f9f9', borderRadius: 8, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  productImg: { width: '100%', height: '100%' },
  infoBox: { flex: 1, marginLeft: 15 },
  nameText: { fontSize: 15, fontWeight: 'bold' },
  priceText: { fontSize: 16, color: '#4A9CC8', fontWeight: 'bold', marginTop: 5 },
  controlBox: { alignItems: 'flex-end', width: 80 },
  addBtn: { backgroundColor: '#002244', width: 30, height: 30, borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 5 },
  qtyBtn: { padding: 5 },
  qtyText: { fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: '#002244', height: 70, borderRadius: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, elevation: 5, zIndex: 1000 },
  footerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  cartIconBox: { position: 'relative' },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: 'bold' },
  footerTotal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  checkoutBtn: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  checkoutText: { color: '#002244', fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  dimmedArea: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  cartSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  sheetHandle: { width: 40, height: 5, backgroundColor: '#ccc', alignSelf: 'center', borderRadius: 5, marginBottom: 15 },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  closeSheetBtn: { backgroundColor: '#002244', padding: 15, borderRadius: 10, alignItems: 'center' }
});