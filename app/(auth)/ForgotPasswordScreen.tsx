import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { sendPasswordResetOTP, verifyResetOTP } from '../../components/services/api';
import { router } from 'expo-router';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [etape, setEtape] = useState(1);
  const [compteARebours, setCompteARebours] = useState(120);
  const [chargementEnvoi, setChargementEnvoi] = useState(false);
  const [chargementVerification, setChargementVerification] = useState(false);
  const [chargementRenvoyer, setChargementRenvoyer] = useState(false);
  
  const refOtp1 = useRef<TextInput>(null);
  const refOtp2 = useRef<TextInput>(null);
  const refOtp3 = useRef<TextInput>(null);
  const refOtp4 = useRef<TextInput>(null);
  
  const refsOtp = [refOtp1, refOtp2, refOtp3, refOtp4];

  const envoyerOTP = async () => {
    setChargementEnvoi(true);
    try {
      await sendPasswordResetOTP(email);
      setEtape(2);
      demarrerCompteARebours();
      Alert.alert('Succès', 'Un code OTP a été envoyé à votre email');
    } catch (erreur: unknown) {
      const messageErreur = erreur instanceof Error ? erreur.message : 'Échec de l\'envoi du code OTP';
      Alert.alert('Erreur', messageErreur);
    } finally {
      setChargementEnvoi(false);
    }
  };

  const demarrerCompteARebours = () => {
    const timer = setInterval(() => {
      setCompteARebours((precedent) => {
        if (precedent <= 1) {
          clearInterval(timer);
          return 0;
        }
        return precedent - 1;
      });
    }, 1000);
  };

  const renvoyerOTP = async () => {
    setChargementRenvoyer(true);
    try {
      await sendPasswordResetOTP(email);
      setCompteARebours(120);
      demarrerCompteARebours();
      Alert.alert('Succès', 'Un nouveau code OTP a été envoyé');
    } catch (erreur: unknown) {
      const messageErreur = erreur instanceof Error ? erreur.message : 'Échec de l\'envoi du nouveau code';
      Alert.alert('Erreur', messageErreur);
    } finally {
      setChargementRenvoyer(false);
    }
  };

  const verifierOTP = async () => {
    setChargementVerification(true);
    const otpComplet = otp.join('');
    
    try {
      if (otpComplet.length !== 4) {
        throw new Error('Veuillez entrer un code OTP valide');
      }

      await verifyResetOTP(email, otpComplet);
      router.navigate({
        pathname: '/resetPassword',
        params: { email, otp: otpComplet }
      });
    } catch (erreur: unknown) {
      const messageErreur = erreur instanceof Error ? erreur.message : 'Code OTP invalide';
      Alert.alert('Erreur', messageErreur);
    } finally {
      setChargementVerification(false);
    }
  };

  const gererChangementOTP = (valeur: string, index: number) => {
    const nouvelOtp = [...otp];
    nouvelOtp[index] = valeur;
    setOtp(nouvelOtp);

    if (valeur && index < 3) {
      refsOtp[index + 1].current?.focus();
    }
  };

  return (
    <View style={styles.conteneur}>
      <Text style={styles.titre}>Mot de passe oublié</Text>
      
      {etape === 1 ? (
        <>
          <Text style={styles.sousTitre}>Pas de souci ! Ça arrive. Entrez votre email et nous vous enverrons un OTP.</Text>
          
          <TextInput
            style={styles.champSaisie}
            placeholder="Entrez votre adresse email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          
          <TouchableOpacity 
            style={styles.bouton} 
            onPress={envoyerOTP}
            disabled={!email || chargementEnvoi}
          >
            {chargementEnvoi ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.texteBouton}>Continuer</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.sousTitre}>Entrez le code OTP envoyé à {email}</Text>
          
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
              />
            ))}
          </View>
          
          <Text style={styles.compteARebours}>
            {Math.floor(compteARebours / 60)}:{String(compteARebours % 60).padStart(2, '0')} Sec
          </Text>
          
          <TouchableOpacity 
            onPress={renvoyerOTP} 
            disabled={compteARebours > 0 || chargementRenvoyer}
          >
            {chargementRenvoyer ? (
              <ActivityIndicator color="#FD6A00" />
            ) : (
              <Text style={[styles.texteRenvoyer, compteARebours > 0 && styles.texteRenvoyerDesactive]}>
                Vous n'avez pas reçu le code ? Renvoyer
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.bouton} 
            onPress={verifierOTP}
            disabled={otp.some(chiffre => !chiffre) || chargementVerification}
          >
            {chargementVerification ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.texteBouton}>Valider</Text>
            )}
          </TouchableOpacity>
        </>
      )}
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
  champSaisie: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  bouton: {
    backgroundColor: '#FD6A00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
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
  compteARebours: {
    textAlign: 'center',
    color: '#FD6A00',
    marginBottom: 10,
  },
  texteRenvoyer: {
    textAlign: 'center',
    color: '#FD6A00',
    marginBottom: 20,
  },
  texteRenvoyerDesactive: {
    color: '#ccc',
  },
  piedDePage: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  textePiedDePage: {
    color: '#666',
    fontSize: 14,
  },
  lienPiedDePage: {
    color: '#FD6A00',
    fontWeight: '600',
    fontSize: 14,
    marginBottom:10,
  },
});

export default ForgotPasswordScreen;