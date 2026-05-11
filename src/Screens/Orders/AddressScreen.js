import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { 
  SafeAreaView, StyleSheet, Text, View, TextInput, 
  TouchableOpacity, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';

export default function AddressScreen({ navigation, route }) {
  const { cart, products } = route.params || {};

  const [newAddress, setNewAddress] = useState('');
  const [selectedLat, setSelectedLat] = useState(null);
  const [selectedLon, setSelectedLon] = useState(null);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  
  const [mapUrl, setMapUrl] = useState('https://www.openstreetmap.org/export/embed.html?bbox=106.65,-6.35,106.75,-6.25&layer=mapnik');

  // Riwayat alamat sekarang dilengkapi koordinat dummy untuk demo perhitungan ongkir
  const [savedAddresses] = useState([
    { text: "Pamulang Square, Tangerang Selatan", lat: -6.3475, lon: 106.7418 },
    { text: "Bintaro Plaza, Tangerang Selatan", lat: -6.2758, lon: 106.7358 }
  ]);

  const handleSelectAddress = (addressText, lat, lon) => {
    navigation.navigate({
      name: 'Checkout',
      params: { 
        selectedAddress: addressText, 
        lat: lat, 
        lon: lon, 
        cart: cart, 
        products: products 
      },
      merge: true, 
    });
  };

  const handleConfirm = () => {
    if (newAddress.trim() === '') return;
    handleSelectAddress(newAddress, selectedLat, selectedLon);
  };

  const searchLocationOnMap = async () => {
    if (newAddress.trim() === '') return;
    setIsLoadingMap(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newAddress)}`,
        { headers: { 'User-Agent': 'AplikasiSkripsiWarungBintang/1.0', 'Accept-Language': 'id-ID' } }
      );
      
      const textResponse = await response.text();
      let data;
      
      try {
        data = JSON.parse(textResponse);
      } catch (parseError) {
        Alert.alert("Server Sibuk", "Gagal memuat peta, silakan coba beberapa saat lagi.");
        setIsLoadingMap(false);
        return; 
      }

      if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        
        if (!isNaN(lat) && !isNaN(lon)) {
          const bbox = `${lon - 0.01},${lat - 0.01},${lon + 0.01},${lat + 0.01}`;
          setMapUrl(`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`);
          
          // Simpan koordinat yang didapat dari pencarian
          setSelectedLat(lat);
          setSelectedLon(lon);
        }
      } else {
        Alert.alert("Lokasi tidak ditemukan", "Coba gunakan kata kunci yang lebih spesifik.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error Jaringan", "Pastikan koneksi internet aktif.");
    } finally {
      setIsLoadingMap(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pilih Alamat</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.promoCard}>
          <Ionicons name="star" size={24} color="#fff" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.promoTitle}>Jangan lupa!</Text>
            <Text style={styles.promoDesc}>Gunakan voucher mu agar lebih hemat</Text>
          </View>
        </View>

        <View style={styles.mapContainer}>
          {isLoadingMap && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#002244" />
              <Text style={{marginTop: 5, color: '#002244', fontWeight: 'bold'}}>Mencari lokasi...</Text>
            </View>
          )}
          <WebView source={{ uri: mapUrl }} style={{ flex: 1 }} scrollEnabled={true} />
          <View style={styles.markerOverlay}><Ionicons name="location" size={40} color="#E74C3C" /></View>
        </View>

        <View style={styles.inputSection}>
          <Text style={{fontSize: 12, color: '#7F8C8D', marginBottom: 5, marginLeft: 5}}>*Ketik nama kota/daerah lalu tekan Enter/Search di keyboard</Text>
          <View style={styles.inputBox}>
            <Ionicons name="search-outline" size={20} color="#3498DB" />
            <TextInput 
              style={styles.input} 
              placeholder="Cari lokasi di peta..." 
              value={newAddress} 
              onChangeText={setNewAddress} 
              onSubmitEditing={searchLocationOnMap} 
              returnKeyType="search" 
            />
          </View>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Riwayat anda</Text>
          {savedAddresses.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.historyCard} 
              onPress={() => handleSelectAddress(item.text, item.lat, item.lon)}
            >
              <Ionicons name="time-outline" size={20} color="#555" />
              <Text style={styles.historyText}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerHelp}>Sudah Menentukan?</Text>
        <TouchableOpacity style={[styles.confirmBtn, !newAddress && { opacity: 0.5 }]} onPress={handleConfirm} disabled={!newAddress}>
          <Text style={styles.confirmBtnText}>Selanjutnya</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 16, paddingBottom: 30 },
  promoCard: { flexDirection: 'row', backgroundColor: '#5D8AA8', padding: 15, borderTopLeftRadius: 15, borderTopRightRadius: 15, alignItems: 'center' },
  promoTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  promoDesc: { color: '#eee', fontSize: 12 },
  mapContainer: { height: 250, width: '100%', position: 'relative', backgroundColor: '#EAEDED', borderWidth: 1, borderColor: '#D5D8DC', overflow: 'hidden' },
  markerOverlay: { position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -35, zIndex: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 5 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 20, justifyContent: 'center', alignItems: 'center' },
  inputSection: { backgroundColor: '#fff', padding: 15, borderBottomLeftRadius: 15, borderBottomRightRadius: 15, elevation: 2 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F3F4', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 5 },
  input: { flex: 1, marginLeft: 10, height: 45 },
  historySection: { marginTop: 20 },
  sectionTitle: { fontSize: 14, color: '#333', marginBottom: 10, fontWeight: 'bold' },
  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5E8E8', padding: 15, borderRadius: 10, marginBottom: 10 },
  historyText: { marginLeft: 10, color: '#333', flex: 1 },
  footer: { backgroundColor: '#2C3E50', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerHelp: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  confirmBtn: { backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  confirmBtnText: { color: '#2C3E50', fontWeight: 'bold' }
});