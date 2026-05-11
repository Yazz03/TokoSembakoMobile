import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { supabase } from '../../Services/supabase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      navigation.replace('Home');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {/* Tab Switcher */}
      <View style={styles.switchContainer}>
        <View style={[styles.switchBtn, styles.activeSwitch]}>
          <Text style={styles.activeText}>Login</Text>
        </View>
        <TouchableOpacity 
          style={styles.switchBtn} 
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.switchText}>Register</Text>
        </TouchableOpacity>
      </View>

      {/* Input Section */}
      <View style={styles.inputSection}>
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

      <TouchableOpacity style={styles.mainButton} onPress={handleLogin}>
        <Text style={styles.mainButtonText}>Login</Text>
      </TouchableOpacity>


      <View style={styles.cloudBackground} />
    </View>
  );
}

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
  socialContainer: { flexDirection: 'row', marginTop: 40, gap: 20 },
  iconCircle: { width: 50, height: 50, borderRadius: 25 },
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