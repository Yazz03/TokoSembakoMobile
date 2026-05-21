import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { supabase } from '../../Services/supabase';

// ⚠️ HARUS SAMA dengan yang ada di Appnavigator.js
const ADMIN_EMAIL = 'diazbintang33@gmail.com';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Peringatan', 'Email dan password wajib diisi.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Login Gagal', error.message);
      return;
    }

    // Cek apakah email yang login adalah admin
    const loggedEmail = data?.user?.email?.toLowerCase().trim();
    if (loggedEmail === ADMIN_EMAIL.toLowerCase().trim()) {
      navigation.replace('AdminDashboard');
    } else {
      navigation.replace('Home');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <View style={styles.switchContainer}>
        <View style={[styles.switchBtn, styles.activeSwitch]}>
          <Text style={styles.activeText}>Login</Text>
        </View>
        <TouchableOpacity style={styles.switchBtn} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.switchText}>Register</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputSection}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          onChangeText={setPassword}
          value={password}
        />
      </View>

      <TouchableOpacity
        style={[styles.mainButton, loading && { opacity: 0.6 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.mainButtonText}>{loading ? 'Masuk...' : 'Login'}</Text>
      </TouchableOpacity>

      <View style={styles.cloudBackground} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', paddingTop: 80 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#002244', marginBottom: 30 },
  switchContainer: {
    flexDirection: 'row', width: '85%', height: 50,
    borderWidth: 1, borderColor: '#2D3E50', borderRadius: 25,
    overflow: 'hidden', marginBottom: 40,
  },
  switchBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  activeSwitch: { backgroundColor: '#2D3E50' },
  switchText: { fontSize: 16, fontWeight: 'bold', color: '#2D3E50' },
  activeText: { color: '#fff' },
  inputSection: { width: '85%' },
  input: {
    height: 55, borderWidth: 1, borderColor: '#ccc',
    borderRadius: 25, paddingHorizontal: 20,
    marginBottom: 15, fontSize: 16,
  },
  mainButton: {
    width: '85%', height: 55, backgroundColor: '#2D3E50',
    borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 10,
  },
  mainButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cloudBackground: {
    position: 'absolute', bottom: 0, width: '100%', height: 80,
    backgroundColor: '#7EB0C9', borderTopLeftRadius: 100,
    borderTopRightRadius: 100, transform: [{ scaleX: 1.5 }],
  },
});