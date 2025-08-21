import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { verifyEmailWithOTP, sendVerificationEmail } from '../../components/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const VerifyEmailScreen = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [email, setEmail] = useState('');
  const [chargementVerification, setChargementVerification] = useState(false);
  const [chargementRenvoyer, setChargementRenvoyer] = useState(false);

  const refOtp1 = useRef<TextInput>(null);
  const refOtp2 = useRef<TextInput>(null);
  const refOtp3 = useRef<TextInput>(null);
  const refOtp4 = useRef<TextInput>(null);
  const refsOtp = [refOtp1, refOtp2, refOtp3, refOtp4];

  useEffect(() => {
    const loadEmail = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('tempEmail');
        if (storedEmail) {
          setEmail(storedEmail);
          refsOtp[0].current?.focus();
        } else {
          Alert.alert('Erreur', 'Aucun email trouvé. Veuillez vous reconnecter.');
          router.replace('/(auth)/LoginScreen');
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'email:', error);
        router.replace('/(auth)/LoginScreen');
      }
    };
    loadEmail();

    // Nettoyer tempEmail si l'utilisateur quitte sans vérifier
    return () => {
      AsyncStorage.removeItem('tempEmail');
    };
  }, []);

  const renvoyerOTP = async () => {
    if (!email) {
      Alert.alert('Erreur', 'Aucun email disponible pour renvoyer le code.');
      return;
    }

    setChargementRenvoyer(true);
    try {
      await sendVerificationEmail(email);
      Alert.alert('Succès', 'Un nouveau code OTP a été envoyé à votre email.');
    } catch (error) {
      const err = error as Error;
      Alert.alert('Erreur', err.message || "Échec de l'envoi du code OTP");
    } finally {
      setChargementRenvoyer(false);
    }
  };

  const verifierOTP = async () => {
    if (!email) {
      Alert.alert('Erreur', 'Aucun email disponible pour la vérification.');
      return;
    }

    setChargementVerification(true);
    const otpComplet = otp.join('');

    try {
      if (otpComplet.length !== 4) {
        throw new Error('Veuillez entrer un code OTP valide (4 chiffres)');
      }

      await verifyEmailWithOTP(email, otpComplet);
      await AsyncStorage.setItem('emailVerified', 'true');
      Alert.alert('Succès', 'Email vérifié avec succès. Veuillez vous reconnecter.');
      router.replace('/(auth)/LoginScreen');
    } catch (error) {
      const err = error as Error;
      Alert.alert('Erreur', err.message || 'Code OTP invalide');
    } finally {
      setChargementVerification(false);
    }
  };

  const gererChangementOTP = (valeur: string, index: number) => {
    if (!/^[0-9]?$/.test(valeur)) return; // Accepter uniquement les chiffres ou vide

    const nouvelOtp = [...otp];
    nouvelOtp[index] = valeur;
    setOtp(nouvelOtp);

    if (valeur && index < 3) {
      refsOtp[index + 1].current?.focus();
    } else if (!valeur && index > 0) {
      refsOtp[index - 1].current?.focus();
    }
  };

  return (
    <View style={styles.conteneur}>
      <Text style={styles.titre}>Vérification d'email</Text>

      <Text style={styles.sousTitre}>Entrez le code OTP envoyé à {email || 'votre email'}</Text>

      <View style={styles.conteneurOtp}>
        {[0, 1, 2, 3].map((index) => (
          <TextInput
            key={index}
            style={styles.champOtp}
            keyboardType="number-pad"
            maxLength={1}
            value={otp[index]}
            onChangeText={(valeur) => gererChangementOTP(valeur, index)}
            ref={refsOtp[index]}
            accessibilityLabel={`Champ OTP numéro ${index + 1}`}
          />
        ))}
      </View>

      <TouchableOpacity
        onPress={renvoyerOTP}
        disabled={chargementRenvoyer || !email}
      >
        {chargementRenvoyer ? (
          <ActivityIndicator color="#FD6A00" />
        ) : (
          <Text style={styles.texteRenvoyer}>
            Vous n'avez pas reçu le code ? Renvoyer
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.bouton, (otp.some(chiffre => !chiffre) || chargementVerification) && styles.boutonDesactive]}
        onPress={verifierOTP}
        disabled={otp.some(chiffre => !chiffre) || chargementVerification}
      >
        {chargementVerification ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.texteBouton}>Vérifier</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/(auth)/LoginScreen')}>
        <Text style={styles.texteRetour}>Retour à la connexion</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  titre: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sousTitre: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  bouton: {
    backgroundColor: '#FD6A00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  boutonDesactive: {
    opacity: 0.7,
  },
  texteBouton: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  conteneurOtp: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  champOtp: {
    width: 60,
    height: 60,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
  },
  texteRenvoyer: {
    textAlign: 'center',
    color: '#FD6A00',
    marginBottom: 20,
  },
  texteRetour: {
    textAlign: 'center',
    color: '#FD6A00',
    fontSize: 14,
    marginTop: 20,
  },
});

export default VerifyEmailScreen;