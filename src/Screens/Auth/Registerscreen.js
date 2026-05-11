import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { supabase } from '../../Services/supabase';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleRegister = async () => {
    // 1. Register di Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      // 2. Simpan data ke tabel public.users
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id, // Menggunakan ID dari Auth
            email: email,
            name: username,
          }
        ]);

      if (insertError) {
        Alert.alert('Database Error', insertError.message);
      } else {
        Alert.alert('Sukses', 'Registrasi berhasil, silakan login.');
        navigation.navigate('Login');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      {/* Tab Switcher */}
      <View style={styles.switchContainer}>
        <TouchableOpacity 
          style={styles.switchBtn} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.switchText}>Login</Text>
        </TouchableOpacity>
        <View style={[styles.switchBtn, styles.activeSwitch]}>
          <Text style={styles.activeText}>Register</Text>
        </View>
      </View>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <TextInput 
          style={styles.input} 
          placeholder="Username" 
          onChangeText={setUsername}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Email" 
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput 
          style={styles.input} 
          placeholder="Password" 
          secureTextEntry 
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity style={styles.mainButton} onPress={handleRegister}>
        <Text style={styles.mainButtonText}>Register</Text>
      </TouchableOpacity>

      <View style={styles.cloudBackground} />
    </View>
  );
}

// Gunakan StyleSheet yang sama dengan LoginScreen untuk konsistensi desain
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', paddingTop: 80 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#002244', marginBottom: 30 },
  switchContainer: {
    flexDirection: 'row',
    width: '85%',
    height: 50,
    borderWidth: 1,
    borderColor: '#2D3E50',
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 40
  },
  switchBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  activeSwitch: { backgroundColor: '#2D3E50' },
  switchText: { fontSize: 16, fontWeight: 'bold', color: '#2D3E50' },
  activeText: { color: '#fff' },
  inputSection: { width: '85%' },
  input: {
    height: 55,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontSize: 16
  },
  mainButton: {
    width: '85%',
    height: 55,
    backgroundColor: '#2D3E50',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  mainButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cloudBackground: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 80,
    backgroundColor: '#7EB0C9',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    transform: [{ scaleX: 1.5 }]
  }
});