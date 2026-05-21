import React, { useState, useRef } from 'react'; // 👈 INI YANG DITAMBAHKAN: useRef
import { 
  Modal, View, Text, TextInput, TouchableOpacity, 
  StyleSheet, FlatList, SafeAreaView, ActivityIndicator, Image, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ⚠️ JANGAN LUPA: Masukkan API Key Gemini milikmu di sini ⚠️
const GEMINI_API_KEY = 'AIzaSyDe4Y5UFnnayR33Ew4Oj4r1OgpqPigLblA'; 

export default function ChatbotModal({ visible, onClose, products }) {
  const [messages, setMessages] = useState([
    { id: '1', text: 'Halo! Aku Asisten AI Warung Budhe Bintang. Mau cari sembako apa hari ini?', sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 👇 INI OBAT ERRORNYA: Menggunakan useRef untuk mengontrol scroll 👇
  const flatListRef = useRef(null);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setInputText('');
    
    setMessages(prev => [...prev, { id: Date.now().toString(), text: userMsg, sender: 'user' }]);
    setIsLoading(true);

    const lowerInput = userMsg.toLowerCase();

    // ─────────────────────────────────────────────────────────────
    // 🧠 1. PENDEKATAN RULE-BASED
    // ─────────────────────────────────────────────────────────────
    if (lowerInput.includes('katalog') || lowerInput.includes('produk') || lowerInput.includes('barang')) {
      
      const keyword = lowerInput.replace(/(tampilkan|cari|mau|beli|lihat|katalog|produk|barang|saset|dong)/gi, '').trim();
      let dataToShow = [];
      
      if (keyword) {
        dataToShow = products.filter(p => p.name.toLowerCase().includes(keyword));
      }

      if (dataToShow.length === 0) {
        dataToShow = products.slice(0, 5);
      }

      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          type: 'catalog', 
          data: dataToShow, 
          sender: 'bot' 
        }]);
        setIsLoading(false);
      }, 800);
      return; 
    }

    // ─────────────────────────────────────────────────────────────
    // 🤖 2. PENDEKATAN LLM GEMINI
    // ─────────────────────────────────────────────────────────────
    try {
      const productContext = products.map(p => `- ${p.name} (Harga: Rp${p.price}, Stok: ${p.stock || 10})`).join('\n');
      
      const prompt = `Kamu adalah asisten AI ramah dari "Warung Sembako Budhe Bintang". 
      Tugasmu membantu pelanggan mencari barang. Jawab dengan singkat, padat, dan ramah.
      Berikut adalah data produk yang kami jual saat ini:
      ${productContext}
      
      Pertanyaan pelanggan: "${userMsg}"`;

      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: responseText, sender: 'bot' }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: 'Waduh, sistem AI sedang gangguan. Coba lagi nanti ya!', sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    if (item.sender === 'user') {
      return (
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{item.text}</Text>
        </View>
      );
    }

    if (item.type === 'catalog') {
      const catalogData = item.data || []; 

      return (
        <View style={styles.botBubble}>
          <Text style={styles.botText}>Ini dia produk yang kamu cari:</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={{ marginTop: 10, flexGrow: 0 }} 
          >
            {catalogData.map(prod => (
              <View key={prod.id} style={styles.catalogCard}>
                {prod.image_url ? (
                  <Image source={{ uri: prod.image_url }} style={styles.imagePlaceholder} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="cube-outline" size={30} color="#ccc" />
                  </View>
                )}
                <Text style={styles.catalogName} numberOfLines={2}>{prod.name}</Text>
                <Text style={styles.catalogStock}>Stok: {prod.stock || 'Tersedia'}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={styles.botBubble}>
        <Ionicons name="sparkles" size={16} color="#F5A623" style={{ marginBottom: 4 }} />
        <Text style={styles.botText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
            <Ionicons name="close" size={28} color="#002244" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Asisten Warung AI</Text>
            <Text style={styles.headerSub}>Online 🟢</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        <FlatList
          ref={flatListRef} // 👈 Mendaftarkan memori ref ke FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          // 👇 Menjalankan scroll otomatis menggunakan ref yang aman 👇
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({animated: true})}
          onLayout={() => flatListRef.current?.scrollToEnd({animated: true})}
        />

        <View style={styles.inputArea}>
          <TextInput
            style={styles.textInput}
            placeholder="Ketik 'katalog' atau tanya produk..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && { backgroundColor: '#ccc' }]} 
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: '#F5F6FA', marginTop: 50, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#002244' },
  headerSub: { fontSize: 12, color: '#27AE60' },
  chatList: { padding: 15, paddingBottom: 20 },
  
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#002244', padding: 12, borderRadius: 16, borderBottomRightRadius: 4, maxWidth: '80%', marginBottom: 15 },
  userText: { color: '#fff', fontSize: 14 },
  
  botBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', padding: 15, borderRadius: 16, borderBottomLeftRadius: 4, maxWidth: '85%', marginBottom: 15, elevation: 1 },
  botText: { color: '#333', fontSize: 14, lineHeight: 20 },
  
  catalogCard: { 
    width: 110, 
    height: 145, 
    backgroundColor: '#F0F4F8', 
    borderRadius: 10, 
    padding: 10, 
    marginRight: 10, 
    alignItems: 'center',
    justifyContent: 'flex-start' 
  },
  imagePlaceholder: { 
    width: 60, 
    height: 60, 
    backgroundColor: '#fff', 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8, 
    overflow: 'hidden' 
  },
  catalogName: { fontSize: 11, fontWeight: 'bold', color: '#333', textAlign: 'center', height: 32 }, 
  catalogStock: { fontSize: 11, fontWeight: 'bold', color: '#27AE60', marginTop: 4 }, 

  inputArea: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  textInput: { flex: 1, backgroundColor: '#F0F4F8', borderRadius: 20, paddingHorizontal: 15, height: 45, fontSize: 14 },
  sendButton: { width: 45, height: 45, backgroundColor: '#4A9CC8', borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }
});