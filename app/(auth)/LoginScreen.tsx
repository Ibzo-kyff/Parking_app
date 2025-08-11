import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { login } from '../../components/services/api';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      const role = await AsyncStorage.getItem('role');
      redirectBasedOnRole(role);
    }
  };

  const handleNext = () => {
    router.push('/(auth)/RegisterScreen');
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/ForgotPasswordScreen');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const { accessToken, role, emailVerified } = await login({ email, password });

      // Stocker les données
      await AsyncStorage.setItem('token', accessToken || '');
      await AsyncStorage.setItem('role', role || '');
      await AsyncStorage.setItem('emailVerified', emailVerified ? 'true' : 'false');

      if (!emailVerified) {
        Alert.alert('Vérification requise', 'Veuillez vérifier votre email avant de continuer.');
        router.push('/(auth)/VerifyEmailScreen');
        return;
      }

      redirectBasedOnRole(role);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Échec de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const redirectBasedOnRole = (role: string | null) => {
    switch (role) {
      case 'CLIENT':
        router.push('/tabs/accueil');
        break;
      case 'PARKING':
        router.push('/tabs/parking');
        break;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Chargement...' : 'Se connecter'}</Text>
      </TouchableOpacity>
      <View style={styles.footer}>
        <Text>Pas encore de compte ? </Text>
        <TouchableOpacity onPress={handleNext}>
          <Text style={styles.link}>S'inscrire</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.link}>Mot de passe oublié ?</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  link: {
    color: '#007bff',
    fontWeight: 'bold',
  },
});

export default LoginScreen;