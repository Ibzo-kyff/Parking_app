import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { login } from '../../components/services/api';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const emailVerified = await AsyncStorage.getItem('emailVerified');
      if (token && emailVerified === 'true') {
        const role = await AsyncStorage.getItem('role');
        redirectBasedOnRole(role);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut auth:', error);
    }
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
      const { accessToken, role, emailVerified, nom, prenom, id, parkingId } = await login({ email, password });


      if (!emailVerified) {
        // Stocker temporairement l'email pour la vérification
        await AsyncStorage.setItem('tempEmail', email);
        Alert.alert('Vérification requise', 'Veuillez vérifier votre email avant de continuer.');
        router.push('/(auth)/VerifyEmailScreen');
        return;
      }

      // Stocker les données uniquement si l'email est vérifié
      await AsyncStorage.setItem('accessToken', accessToken || '');
      await AsyncStorage.setItem('role', role || '');
      await AsyncStorage.setItem('emailVerified', 'true');
      await AsyncStorage.setItem('nom', nom || 'Inconnu');
      await AsyncStorage.setItem('prenom', prenom || 'Inconnu');

      if (id) await AsyncStorage.setItem("userId", String(id));
      if (parkingId) await AsyncStorage.setItem("parkingId", String(parkingId));
      redirectBasedOnRole(role || null);
    } catch (error) {
      const err = error as Error;
      Alert.alert('Erreur', err.message || 'Échec de la connexion');
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
        router.push('/(Parking)/accueil');
        break;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.mainContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.headerBackground}>
        <ExpoImage
          source={require('../../assets/images/login.gif')}
          style={styles.headerImage}
          contentFit="cover"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Connexion</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#777" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#777" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#777"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Connexion...' : 'Se connecter'}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/RegisterScreen')}>
              <Text style={styles.footerLink}>S'inscrire</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={[styles.footerLink, { textAlign: 'center', marginTop: 10 }]}>
              Mot de passe oublié ?
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    height: 460,
    width: '100%',
    overflow: 'hidden',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  formContainer: {
    marginTop: 390,
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FD6A00',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 5,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#333',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    backgroundColor: '#FD6A00',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  footerLink: {
    color: '#FD6A00',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 10,
  },
});

export default LoginScreen;