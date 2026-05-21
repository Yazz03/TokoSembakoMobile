import ChatbotModal from './ChatbotModel'; // Pastikan nama file Chatbot-nya benar
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput
} from 'react-native';
import { supabase } from '../../Services/supabase';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [namaUser, setNamaUser] = useState('User'); // 👈 Typo huruf 'a' sudah dibersihkan
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // 👇 TAMBAHAN CHATBOT: State untuk mengontrol buka/tutup chat 👇
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchUserData(); 
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*');
    if (data) setProducts(data);
  };

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      if (user.user_metadata && user.user_metadata.username) {
        setNamaUser(user.user_metadata.username);
      } else if (user.email) {
        const namaDariEmail = user.email.split('@')[0];
        setNamaUser(namaDariEmail);
      }
    }
  };

  const dummyProducts = [
    { id: '1', name: 'Beras Premium 5kg', price: '75000' },
    { id: '2', name: 'Minyak Goreng 2L', price: '34000' },
    { id: '3', name: 'Telur Ayam 1kg', price: '28000' },
    { id: '4', name: 'Gula Pasir 1kg', price: '16000' },
  ];

  const displayData = products.length > 0 ? products : dummyProducts;

  const filteredProducts = searchQuery.trim() !== '' 
    ? displayData.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : displayData;

  const categories = [
    { id: '1', label: 'Ambil Di tempat', image: { uri: 'https://placehold.co/400x400/FF9800/FFF?text=Ambil+Di+Tempat' } },
    { id: '2', label: 'Pesan dan antar', image: { uri: 'https://placehold.co/400x400/4CAF50/FFF?text=Pesan+Antar' } },
  ];
  
  const promoItems = [
    { id: '1', title: 'Dikerjain Cepat!', desc: 'Layanan ekspres siap melayani', bg: '#FFF3E0', image: { uri: 'https://placehold.co/400x400/FFC107/FFF?text=Promo+1' } },
    { id: '2', title: 'Harga Terjangkau', desc: 'Bandingkan harga terbaik', bg: '#E3F2FD', image: { uri: 'https://placehold.co/400x400/2196F3/FFF?text=Promo+2' } },
    { id: '3', title: 'Terpercaya', desc: 'Ribuan ulasan bintang 5', bg: '#F3E5F5', image: { uri: 'https://placehold.co/400x400/9C27B0/FFF?text=Promo+3' } },
  ];

  const renderHeader = () => {
    if (searchQuery.trim() !== '') {
      return (
        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Hasil Pencarian "{searchQuery}"</Text>
        </View>
      );
    }

    return (
      <View>
        <View style={styles.bannerCard}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerTitle}>Nikmati Diskon{'\n'}Hingga</Text>
            <Text style={styles.bannerSub}>Pesan Jasa Kami Sekarang</Text>
          </View>
          <Image
            source={{ uri: 'https://placehold.co/400x400/002244/FFF?text=Banner' }}
            style={styles.bannerImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.dotsRow}>
          {[0, 1].map((i) => (
            <View key={i} style={[styles.dot, activeBanner === i && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.welcomeCard}>
          <Ionicons name="happy-outline" size={18} color="#7EB0C9" style={{ marginRight: 8 }} />
          <Text style={styles.welcomeText}>Selamat Datang, {namaUser}!</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kategori Jasa</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Lihat Selengkapnya</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoryRow}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat.id} 
              style={styles.categoryCard}
              onPress={() => navigation.navigate('Order', { mode: cat.label })}
            >
              <Image
                source={cat.image}
                style={styles.categoryImageBox}
                resizeMode="cover"
              />
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cek yang menarik dari kami</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promoScroll}
        >
          {promoItems.map((item) => (
            <View key={item.id} style={[styles.promoCard, { backgroundColor: item.bg }]}>
              <Image
                source={item.image}
                style={styles.promoImageBox}
                resizeMode="cover"
              />
              <View style={styles.promoInfo}>
                <Text style={styles.promoTitle}>{item.title}</Text>
                <Text style={styles.promoDesc}>{item.desc}</Text>
                <TouchableOpacity>
                  <Text style={styles.promoLink}>Cek selengkapnya</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Jangan lupakan kesempatanmu</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Gunakan voucher untuk mendapatkan{'\n'}biaya gratis dalam pengiriman
        </Text>

        <View style={styles.voucherCard}>
          <View style={styles.voucherLeft}>
            <Text style={styles.voucherTitle}>Diskon gratis ongkir{'\n'}dengan{'\n'}min belanja</Text>
            <View style={styles.voucherPriceRow}>
              <Text style={styles.voucherRp}>Rp</Text>
              <Text style={styles.voucherAmount}>25.000</Text>
            </View>
          </View>
          <View style={styles.voucherRight}>
            <View style={styles.voucherImageBox}>
              <Ionicons name="pricetag" size={50} color="#fff" />
            </View>
            <View style={styles.timerBadge}>
              <Ionicons name="time-outline" size={12} color="#fff" />
              <Text style={styles.timerText}>Sisa waktu 20:23:04</Text>
            </View>
          </View>
        </View>

        <View style={styles.gopehCard}>
          <View style={styles.gopehImageBox}>
            <Ionicons name="cart" size={50} color="#fff" />
          </View>
          <View style={styles.gopehInfo}>
            <Text style={styles.gopehTitle}>Beli dengan GoPeh{'\n'}dapatkan diskon</Text>
          </View>
        </View>

        <View style={[styles.sectionHeader, { marginTop: 10 }]}>
          <Text style={styles.sectionTitle}>Produk Pilihan</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderProduct = ({ item }) => (
    <View style={styles.card}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={styles.cardImage}>
          <Ionicons name="image-outline" size={40} color="#ccc" />
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productPrice}>Rp {item.price}</Text>
      </View>
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          navigation.navigate('Order', { mode: 'Pesan dan antar' });
        }}
      >
        <Ionicons name="add" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.topBar}>
        <View style={styles.topSearchBar}>
          <Ionicons name="search" size={18} color="#7EB0C9" style={{ marginRight: 8 }} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Cari sembako..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery} 
          />
        </View>
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={() => navigation.replace('Login')}
        >
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      <FlatList
        ListHeaderComponent={renderHeader}
        data={filteredProducts} 
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={ 
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Ionicons name="sad-outline" size={50} color="#ccc" />
            <Text style={{ color: '#888', marginTop: 10 }}>Produk tidak ditemukan.</Text>
          </View>
        }
      />

      {/* ── Bottom Navigation ── */}
      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="home" size={24} color="#F5A623" />
          <View style={styles.activeIndicator} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => navigation.navigate('Cart')}
        >
          <Ionicons name="cart-outline" size={24} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.fabButton}>
          <Ionicons name="apps" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => navigation.navigate('HistoryScreen')}
        >
          <Ionicons name="time-outline" size={24} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#888" />
        </TouchableOpacity>
      </View>

      {/* 👇 TAMBAHAN CHATBOT: Tombol Melayang AI 👇 */}
      <TouchableOpacity 
        style={styles.aiFloatingButton} 
        onPress={() => setIsChatOpen(true)}
      >
        <Ionicons name="chatbubbles" size={28} color="#fff" />
        <View style={styles.aiBadge}>
          <Text style={{fontSize: 9, color: '#fff', fontWeight: 'bold'}}>AI</Text>
        </View>
      </TouchableOpacity>

      {/* 👇 TAMBAHAN CHATBOT: Memanggil Komponen Modal 👇 */}
      <ChatbotModal 
        visible={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        products={displayData} 
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  listContainer: { paddingBottom: 80 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    elevation: 2, 
  },
  topSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: 25,
    paddingHorizontal: 14,
    height: 40,
    marginRight: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },
  
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#002244',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#E53935',
    borderWidth: 2,
    borderColor: '#fff',
  },

  bannerCard: {
    backgroundColor: '#C8DFF0',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  bannerLeft: { flex: 1 },
  bannerTitle: { fontSize: 18, fontWeight: '700', color: '#002244', lineHeight: 26 },
  bannerSub: { fontSize: 12, color: '#4A7A9B', marginTop: 6 },
  bannerImage: { width: 120, height: 120 },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C8DFF0', marginHorizontal: 3 },
  dotActive: { backgroundColor: '#4A9CC8', width: 18 },

  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  welcomeText: { fontSize: 14, color: '#444', fontWeight: 'bold' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  seeAll: { fontSize: 13, color: '#4A9CC8', fontWeight: '600' },
  sectionDesc: { fontSize: 13, color: '#888', marginHorizontal: 16, marginTop: -6, marginBottom: 12, lineHeight: 20 },

  categoryRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  categoryImageBox: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: 8,
  },

  promoScroll: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  promoCard: {
    width: width * 0.65,
    borderRadius: 14,
    overflow: 'hidden',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  promoImageBox: {
    width: 90,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoInfo: { flex: 1, padding: 14 },
  promoTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  promoDesc: { fontSize: 12, color: '#666', marginBottom: 8 },
  promoLink: { fontSize: 12, color: '#E53935', fontWeight: '600' },

  voucherCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#F5A623',
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  voucherLeft: { flex: 1, padding: 16 },
  voucherTitle: { fontSize: 13, fontWeight: '700', color: '#fff', lineHeight: 20 },
  voucherPriceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 },
  voucherRp: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 4, marginRight: 2 },
  voucherAmount: { fontSize: 36, fontWeight: '900', color: '#fff', lineHeight: 40 },
  voucherRight: {
    width: 130,
    backgroundColor: 'rgba(0,0,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  voucherImageBox: { marginBottom: 8 },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  timerText: { fontSize: 10, color: '#fff', fontWeight: '600' },

  gopehCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#4A7A9B',
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    height: 90,
  },
  gopehImageBox: {
    width: 100,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gopehInfo: { flex: 1, justifyContent: 'center', padding: 16 },
  gopehTitle: { fontSize: 15, fontWeight: '700', color: '#fff', lineHeight: 22 },

  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 16 },
  card: {
    backgroundColor: '#fff',
    width: '47%',
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    position: 'relative',
  },
  cardImage: {
    height: 115,
    backgroundColor: '#F0F4F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { padding: 10, paddingBottom: 22 },
  productName: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 3 },
  productPrice: { fontSize: 14, fontWeight: '700', color: '#4A9CC8' },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4A9CC8',
    width: 34,
    height: 34,
    borderTopLeftRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bottomTab: {
    flexDirection: 'row',
    height: 64,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F5A623',
    marginTop: 3,
  },
  fabButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#002244',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    elevation: 6,
    shadowColor: '#002244',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  
  // 👇 TAMBAHAN CHATBOT: Style untuk tombol AI 👇
  aiFloatingButton: {
    position: 'absolute',
    bottom: 85, // Berada persis di atas bottom tab
    right: 20,
    backgroundColor: '#002244',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  aiBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#E74C3C',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#F5F6FA'
  },
});