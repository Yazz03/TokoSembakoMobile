import React, { useState, useCallback } from 'react';
import {
  SafeAreaView, View, Text, TextInput, TouchableOpacity,
  StyleSheet, FlatList, Alert, Modal, ActivityIndicator, Image, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../Services/supabase';

const EMPTY_FORM = { name: '', category: '', price: '', stock: '', description: '', image_url: '' };

export default function AdminProductScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');

  useFocusEffect(useCallback(() => { fetchProducts(); }, []));

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts(data || []);
    setLoading(false);
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setForm({
      name: item.name || '',
      category: item.category || '',
      price: String(item.price || ''),
      stock: String(item.stock || ''),
      description: item.description || '',
      image_url: item.image_url || '',
    });
    setEditingId(item.id);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price.trim() || !form.stock.trim()) {
      Alert.alert('Peringatan', 'Nama, harga, dan stok wajib diisi!');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      description: form.description.trim(),
      image_url: form.image_url.trim(),
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('products').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('products').insert([payload]));
    }

    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setModalVisible(false);
      fetchProducts();
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Hapus Produk',
      `Yakin hapus "${item.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus', style: 'destructive',
          onPress: async () => {
            await supabase.from('products').delete().eq('id', item.id);
            fetchProducts();
          },
        },
      ]
    );
  };

  const filtered = search.trim()
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  const renderItem = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.productImageBox}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.productImg} />
        ) : (
          <Ionicons name="cube-outline" size={28} color="#ccc" />
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productPrice}>Rp {Number(item.price).toLocaleString()}</Text>
        <Text style={styles.productStock}>Stok: {item.stock}</Text>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
          <Ionicons name="pencil" size={16} color="#4A9CC8" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Ionicons name="trash" size={16} color="#E74C3C" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kelola Produk</Text>
        <TouchableOpacity style={styles.addHeaderBtn} onPress={openAdd}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari produk..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator color="#002244" style={{ marginTop: 40 }} size="large" />
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Belum ada produk</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* ── Modal Tambah / Edit ── */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingId ? 'Edit Produk' : 'Tambah Produk'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {[
                { key: 'name', placeholder: 'Nama Produk *', keyboard: 'default' },
                { key: 'category', placeholder: 'Kategori (misal: Beras, Minyak)', keyboard: 'default' },
                { key: 'price', placeholder: 'Harga (Rp) *', keyboard: 'numeric' },
                { key: 'stock', placeholder: 'Stok *', keyboard: 'numeric' },
                { key: 'image_url', placeholder: 'URL Gambar (opsional)', keyboard: 'default' },
                { key: 'description', placeholder: 'Deskripsi (opsional)', keyboard: 'default' },
              ].map(field => (
                <TextInput
                  key={field.key}
                  style={styles.formInput}
                  placeholder={field.placeholder}
                  keyboardType={field.keyboard}
                  value={form[field.key]}
                  onChangeText={val => setForm(prev => ({ ...prev, [field.key]: val }))}
                />
              ))}

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>{editingId ? 'Simpan Perubahan' : 'Tambah Produk'}</Text>
                }
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  addHeaderBtn: { padding: 4 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', margin: 16, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, elevation: 1,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#333' },
  productCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 1,
  },
  productImageBox: {
    width: 56, height: 56, borderRadius: 10,
    backgroundColor: '#F0F4F7', justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  productImg: { width: '100%', height: '100%' },
  productInfo: { flex: 1, marginLeft: 12 },
  productName: { fontSize: 14, fontWeight: 'bold', color: '#002244' },
  productPrice: { fontSize: 13, color: '#4A9CC8', marginTop: 2 },
  productStock: { fontSize: 12, color: '#888', marginTop: 1 },
  productActions: { gap: 8 },
  editBtn: {
    backgroundColor: '#E8F4FD', width: 34, height: 34, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  deleteBtn: {
    backgroundColor: '#FDEDEC', width: 34, height: 34, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    backgroundColor: '#002244', width: 58, height: 58,
    borderRadius: 29, justifyContent: 'center', alignItems: 'center', elevation: 8,
  },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#888', marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#002244' },
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