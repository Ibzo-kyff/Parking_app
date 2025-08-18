// screens/ResetPasswordScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { resetPassword } from '../../components/services/api';
import { useLocalSearchParams, router } from 'expo-router';

const ResetPasswordScreen = () => {
  const params = useLocalSearchParams();
  // Assurez-vous que email et otp sont des strings
  const email = Array.isArray(params.email) ? params.email[0] : params.email ?? '';
  const otp = Array.isArray(params.otp) ? params.otp[0] : params.otp ?? '';
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (!email || !otp) {
      Alert.alert('Erreur', 'Données de réinitialisation manquantes');
      return;
    }

    try {
      await resetPassword(email, otp, newPassword);
      Alert.alert('Succès', 'Votre mot de passe a été réinitialisé');
      router.push('(auth)/LoginScreen'); // Redirige vers la page de connexion
    } catch (error) {
      // Gestion type-safe de l'erreur
      let errorMessage = 'Échec de la réinitialisation';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      Alert.alert('Erreur', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      
      <TextInput
        style={styles.input}
        placeholder="New Password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleResetPassword}
        disabled={!newPassword || !confirmPassword}
      >
        <Text style={styles.buttonText}>Reset Password</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FD6A00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ResetPasswordScreen;  