import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, 
  KeyboardAvoidingView, Platform, Alert, Animated, ActivityIndicator
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useNavigation } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { userService } from '../../../components/services/profileApi';

const Infopersonnel = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    nom: '',
    prenom: '',
    address: '',
    phone: '',
    email: '',
    motdepasse: ''
  });
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const navigation = useNavigation();

  const { authState, clearAuthState } = useAuth();

  // 🔹 Déconnexion et redirection vers la page de connexion
  const handleLogout = async () => {
    try {
      clearAuthState();
      router.replace('/(auth)/LoginScreen');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  // 🔹 Charger les infos utilisateur depuis backend
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log("Tentative de récupération des données utilisateur...");
        
        const token = authState.accessToken;
        console.log("Token récupéré:", token ? "Présent" : "Absent");
        
        if (!token) {
          Alert.alert(
            "Session expirée", 
            "Votre session a expiré. Veuillez vous reconnecter.",
            [{ text: "OK", onPress: () => handleLogout() }]
          );
          setLoading(false);
          setTokenError(true);
          return;
        }        
        // Utilisation du service API
        const data = await userService.getUserDetails(token);
           
        // Structure correcte des données (suppression des doublons)
        const userInfo = {
          nom: data.nom || '',
          prenom: data.prenom || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          motdepasse: "********" // Mot de passe masqué par défaut
        };
        
        setUserData(userInfo);
        setOriginalData(userInfo);
        
        // Animation de fondu
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } catch (err: any) {
        console.error("Erreur complète:", err);
        
        if (err.status === 401 || err.status === 403) {
          // Token invalide ou expiré
          console.error("Erreur API (401/403): Token invalide");
          
          Alert.alert(
            "Session expirée", 
            "Votre session a expiré. Veuillez vous reconnecter.",
            [{ text: "OK", onPress: () => handleLogout() }]
          );
          
          setTokenError(true);
        } else {
          Alert.alert(
            "Erreur", 
            err.message || "Impossible de récupérer vos informations. Vérifiez votre connexion internet."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (name: string, value: string) => {
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  // 🔹 Sauvegarder vers backend avec méthode PUT
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = authState.accessToken;
      if (!token) {
        Alert.alert("Erreur", "Token d'authentification manquant");
        setSaving(false);
        return;
      }

      // Préparer les données à envoyer avec la méthode PUT
      const updatedData: any = {
        nom: userData.nom,
        prenom: userData.prenom,
        address: userData.address,
        phone: userData.phone,
        email: userData.email // L'email est généralement non modifiable
      };
      
      // Ne mettre à jour le mot de passe que s'il a été modifié (et n'est pas vide)
      if (userData.motdepasse && userData.motdepasse !== "********" && userData.motdepasse !== originalData.motdepasse) {
        updatedData.motdepasse = userData.motdepasse;
      }

      // Vérifier si des modifications ont été apportées
      const hasChanges = 
        userData.nom !== originalData.nom ||
        userData.prenom !== originalData.prenom ||
        userData.address !== originalData.address ||
        userData.phone !== originalData.phone ||
        (userData.motdepasse && userData.motdepasse !== "********" && userData.motdepasse !== originalData.motdepasse);

      if (!hasChanges) {
        setIsEditing(false);
        Alert.alert("Info", "Aucune modification détectée.");
        setSaving(false);
        return;
      }

      console.log("Envoi des données mises à jour:", updatedData);

      // Utilisation du service API pour la mise à jour
      const updated = await userService.updateUserDetails(token, updatedData);
      
      console.log("Réponse de mise à jour:", updated);
      
      // Mettre à jour les données affichées (suppression des doublons)
      const updatedUserInfo = {
        nom: updated.nom || userData.nom,
        prenom: updated.prenom || userData.prenom,
        address: updated.address || userData.address,
        phone: updated.phone || userData.phone,
        email: updated.email || userData.email,
        motdepasse: "********" // Réinitialiser l'affichage du mot de passe
      };
      
      setUserData(updatedUserInfo);
      setOriginalData(updatedUserInfo);
      setIsEditing(false);
      setShowPassword(false);
      
      Alert.alert("Succès", "Vos informations ont été mises à jour.");
    } catch (err: any) {
      console.error("Erreur lors de la sauvegarde:", err);
      
      if (err.status === 401 || err.status === 403) {
        // Token invalide ou expiré
        Alert.alert(
          "Session expirée", 
          "Votre session a expiré. Veuillez vous reconnecter.",
          [{ text: "OK", onPress: () => handleLogout() }]
        );
      } else {
        Alert.alert(
          "Erreur", 
          err.message || "Impossible de sauvegarder vos informations. Veuillez réessayer."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // Afficher un message si le token est invalide
  if (tokenError) {
    return (
      <LinearGradient 
        colors={['#FDB913', '#ffffff']} 
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Informations Personnelles</Text>
        </View>
        
        <View style={styles.card}>
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={50} color="#F44336" />
            <Text style={styles.errorTitle}>Session expirée</Text>
            <Text style={styles.errorMessage}>
              Votre session a expiré. Veuillez vous reconnecter pour accéder à vos informations.
            </Text>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogout}
            >
              <Text style={styles.loginButtonText}>Se reconnecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Afficher le skeleton pendant le chargement
  if (loading) {
    return (
      <LinearGradient 
        colors={['#FDB913', '#ffffff']} 
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Informations Personnelles</Text>
        </View>
        
        <View style={styles.card}>
          {[...Array(6)].map((_, index) => (
            <View key={index} style={styles.skeletonContainer}>
              <View style={styles.skeletonLabel} />
              <View style={styles.skeletonInput} />
            </View>
          ))}
        </View>
        
        <View style={styles.footer}>
          <View style={[styles.actionButton, styles.skeletonButton]} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient 
      colors={['#FDB913', '#ffffff']} 
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.3 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Feather name="arrow-left" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Informations Personnelles</Text>
            </View>

            <View style={styles.card}>
              {/* Nom */}
              <InputField
                label="Nom"
                value={userData.nom || ''}
                editable={isEditing}
                icon={<MaterialIcons name="person-outline" size={20} color="#777" />}
                onChangeText={(text: string) => handleChange('nom', text)}
              />

              {/* Prénom */}
              <InputField
                label="Prénom"
                value={userData.prenom || ''}
                editable={isEditing}
                icon={<MaterialIcons name="person-outline" size={20} color="#777" />}
                onChangeText={(text: string) => handleChange('prenom', text)}
              />

              {/* Adresse */}
              <InputField
                label="Adresse"
                value={userData.address || ''}
                editable={isEditing}
                icon={<MaterialIcons name="location-on" size={20} color="#777" />}
                onChangeText={(text: string) => handleChange('address', text)}
              />

              {/* Téléphone */}
              <InputField
                label="Téléphone"
                value={userData.phone || ''}
                editable={isEditing}
                icon={<Feather name="phone" size={20} color="#777" />}
                onChangeText={(text: string) => handleChange('phone', text)}
                keyboardType="phone-pad"
              />

              {/* Email (toujours affiché, jamais éditable) */}
              <InputField
                label="Email"
                value={userData.email || ''}
                editable={false}
                icon={<MaterialIcons name="email" size={20} color="#777" />}
              />

              {/* Mot de passe avec œil pour afficher/masquer */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mot de passe</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="lock" size={20} color="#777" />
                  <TextInput
                    style={[styles.input, !isEditing && styles.disabledInput]}
                    value={isEditing ? (userData.motdepasse || '') : "********"}
                    editable={isEditing}
                    secureTextEntry={!showPassword && isEditing}
                    onChangeText={(text: string) => handleChange('motdepasse', text)}
                    placeholder={isEditing ? "Nouveau mot de passe" : ""}
                  />
                  {isEditing && (
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Feather 
                        name={showPassword ? 'eye-off' : 'eye'} 
                        size={20} 
                        color="#777" 
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bouton unique en bas (Modifier/Enregistrer) */}
        <View style={styles.footer}>
          <TouchableOpacity 
            onPress={() => {
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
              }
            }}
            style={[styles.actionButton, isEditing ? styles.saveButton : styles.editButton]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Feather 
                  name={isEditing ? 'check' : 'edit-2'} 
                  size={20} 
                  color="white" 
                />
                <Text style={styles.actionButtonText}>
                  {isEditing ? 'Enregistrer' : 'Modifier mes informations'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

// 🔹 Composant champ réutilisable
const InputField = ({ label, value, editable, icon, ...props }: any) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      {icon}
      <TextInput
        style={[styles.input, !editable && styles.disabledInput]}
        value={value}
        editable={editable}
        {...props}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContainer: { paddingBottom: 100 },
  header: { 
    padding: 20, 
    paddingTop: 50, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    zIndex: 1
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#fff',
  },
  card: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    margin: 20, 
    padding: 20, 
    elevation: 5 
  },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, color: '#777', marginBottom: 5, fontWeight: '500' },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee', 
    paddingBottom: 8 
  },
  input: { 
    flex: 1, 
    fontSize: 16, 
    color: '#333', 
    marginLeft: 10,
    padding: 0
  },
  disabledInput: { color: '#999' },
  footer: { 
    position: 'absolute', 
    bottom: 20, 
    left: 0, 
    right: 0, 
    paddingHorizontal: 20 
  },
  actionButton: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 15, 
    borderRadius: 12,
  },
  editButton: { backgroundColor: '#FDB913' },
  saveButton: { backgroundColor: '#4CAF50' },
  actionButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '600', 
    marginLeft: 10 
  },
  
  // Styles pour le skeleton loader
  skeletonContainer: {
    marginBottom: 20
  },
  skeletonLabel: {
    height: 14,
    width: '30%',
    backgroundColor: '#e1e1e1',
    borderRadius: 4,
    marginBottom: 5
  },
  skeletonInput: {
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 4
  },
  skeletonButton: {
    backgroundColor: '#e1e1e1',
    height: 50
  },
  
  // Styles pour l'erreur de token
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F44336',
    marginTop: 10,
    marginBottom: 10
  },
  errorMessage: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginBottom: 20
  },
  loginButton: {
    backgroundColor: '#FDB913',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default Infopersonnel;