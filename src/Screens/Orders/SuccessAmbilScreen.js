import React from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ScrollView, Alert, Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SuccessAmbilScreen({ navigation, route }) {
  // Data dikirim dari CheckoutScreen
  const { cart, products, totalPayment, paymentMethod, userEmail } = route.params || {};

  // Mengambil daftar nama produk yang dibeli
  const purchasedItems = products
    .filter(p => cart[p.id.toString()] > 0)
    .map(p => p.name)
    .join(', ');

  const handleSaveToGallery = () => {
    // Logika untuk simpan gambar (Memerlukan library view-shot)
    Alert.alert("Sukses", "Nota pesanan telah disimpan ke galeri foto Anda.");
  };

  const handleDone = () => {
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleDone}>
          <Ionicons name="arrow-back" size={20} color="#333" />
          <Text style={styles.backText}>Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.timeHeader}>12:30</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Icon Sukses */}
        <View style={styles.iconContainer}>
          <View style={styles.circleOuter}>
            <View style={styles.circleInner}>
              <Ionicons name="checkmark" size={60} color="#27AE60" />
            </View>
          </View>
        </View>

        {/* Card Nota */}
        <View style={styles.receiptCard}>
          <Text style={styles.mainTitle}>Pesanan anda sudah disiapkan!</Text>
          
          <View style={styles.whiteBox}>
            <View style={styles.infoSection}>
              <Text style={styles.label}>Detail Pesanan:</Text>
              <Text style={styles.valueText}>{purchasedItems || 'Produk Sembako'}</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.label}>Email Pelanggan:</Text>
              <Text style={styles.valueText}>{userEmail || 'User@mail.com'}</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.label}>Jenis Pembayaran:</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.valueText}>{paymentMethod || 'Pembayaran Digital'}</Text>
                <Text style={styles.priceText}>Rp {totalPayment?.toLocaleString()}</Text>
              </View>
              <View style={styles.divider} />
            </View>

            <Text style={styles.footerNote}>Harap Tunjukan Kepada Kasir</Text>
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveToGallery}>
              <Ionicons name="download-outline" size={18} color="#3498DB" />
              <Text style={styles.saveBtnText}>Simpan ke Galeri</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Tombol Selesai Fixed di Bawah */}
      <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
        <Text style={styles.doneBtnText}>Selesai</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 10 
  },
  timeHeader: { fontWeight: 'bold', fontSize: 16 },
  backBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#E0E0E0', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 15 
  },
  backText: { marginLeft: 5, fontSize: 14, fontWeight: '500' },

  content: { alignItems: 'center', paddingBottom: 100 },
  
  iconContainer: { marginTop: 40, marginBottom: 30 },
  circleOuter: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: '#3498DB', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  circleInner: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  receiptCard: { 
    backgroundColor: '#8AB6D6', 
    width: '90%', 
    borderRadius: 25, 
    padding: 20, 
    elevation: 5 
  },
  mainTitle: { 
    color: '#fff', 
    fontSize: 22, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 20,
    lineHeight: 30
  },
  whiteBox: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20 
  },
  infoSection: { marginBottom: 15 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  valueText: { fontSize: 14, color: '#777', lineHeight: 20 },
  priceText: { fontSize: 14, color: '#3498DB', fontWeight: 'bold' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#DDD', marginTop: 10 },
  footerNote: { 
    textAlign: 'center', 
    color: '#999', 
    fontSize: 13, 
    marginTop: 10, 
    marginBottom: 15 
  },

  saveBtn: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3498DB',
    padding: 8,
    borderRadius: 10
  },
  saveBtnText: { color: '#3498DB', marginLeft: 8, fontWeight: 'bold' },

  doneBtn: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: '#2C3E50', 
    padding: 20, 
    alignItems: 'center' 
  },
  doneBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});