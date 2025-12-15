import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, 
  KeyboardAvoidingView, Platform, Alert, Animated, ActivityIndicator
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
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

  const handleLogout = async () => {
    try {
      clearAuthState();
      router.replace('/(auth)/LoginScreen');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = authState.accessToken;
        
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
        
        const data = await userService.getUserDetails(token);
           
        const userInfo = {
          nom: data.nom || '',
          prenom: data.prenom || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          motdepasse: "********"
        };
        
        setUserData(userInfo);
        setOriginalData(userInfo);
        
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
      } catch (err: any) {
        console.error("Erreur:", err);
        
        if (err.status === 401 || err.status === 403) {
          Alert.alert(
            "Session expirée", 
            "Votre session a expiré. Veuillez vous reconnecter.",
            [{ text: "OK", onPress: () => handleLogout() }]
          );
          setTokenError(true);
        } else {
          Alert.alert(
            "Erreur", 
            err.message || "Impossible de récupérer vos informations."
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = authState.accessToken;
      if (!token) {
        Alert.alert("Erreur", "Session expirée");
        setSaving(false);
        return;
      }

      const updatedData: any = {
        nom: userData.nom,
        prenom: userData.prenom,
        address: userData.address,
        phone: userData.phone,
        email: userData.email
      };
      
      if (userData.motdepasse && userData.motdepasse !== "********" && userData.motdepasse !== originalData.motdepasse) {
        updatedData.motdepasse = userData.motdepasse;
      }

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

      const updated = await userService.updateUserDetails(token, updatedData);
      
      const updatedUserInfo = {
        nom: updated.nom || userData.nom,
        prenom: updated.prenom || userData.prenom,
        address: updated.address || userData.address,
        phone: updated.phone || userData.phone,
        email: updated.email || userData.email,
        motdepasse: "********"
      };
      
      setUserData(updatedUserInfo);
      setOriginalData(updatedUserInfo);
      setIsEditing(false);
      setShowPassword(false);
      
      Alert.alert("Succès", "Informations mises à jour");
    } catch (err: any) {
      console.error("Erreur lors de la sauvegarde:", err);
      
      if (err.status === 401 || err.status === 403) {
        Alert.alert(
          "Session expirée", 
          "Votre session a expiré.",
          [{ text: "OK", onPress: () => handleLogout() }]
        );
      } else {
        Alert.alert(
          "Erreur", 
          err.message || "Impossible de sauvegarder."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (tokenError) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={22} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>
        
        <View style={styles.card}>
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={50} color="#FF6B6B" />
            <Text style={styles.errorTitle}>Session expirée</Text>
            <Text style={styles.errorMessage}>
              Veuillez vous reconnecter
            </Text>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogout}
            >
              <Text style={styles.loginButtonText}>Se reconnecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={22} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>
        
        <View style={styles.card}>
          {[...Array(6)].map((_, index) => (
            <View key={index} style={styles.skeletonContainer}>
              <View style={styles.skeletonInput} />
            </View>
          ))}
        </View>
        
        <View style={styles.footer}>
          <View style={[styles.actionButton, styles.skeletonButton]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Feather name="arrow-left" size={22} color="#ff7d00" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Mon Profil</Text>
              <TouchableOpacity style={styles.profileIcon}>
                <Ionicons name="person" size={20} color="#ff7d00" />
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <View style={styles.inputRow}>
                  <View style={styles.inputContainerHalf}>
                    <Text style={styles.label}>Nom</Text>
                    <View style={styles.inputWrapper}>
                      <Feather name="user" size={18} color="#888" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, !isEditing && styles.disabledInput]}
                        value={userData.nom}
                        editable={isEditing}
                        onChangeText={(text) => handleChange('nom', text)}
                        placeholder="Votre nom"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.inputContainerHalf}>
                    <Text style={styles.label}>Prénom</Text>
                    <View style={styles.inputWrapper}>
                      <Feather name="user" size={18} color="#888" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, !isEditing && styles.disabledInput]}
                        value={userData.prenom}
                        editable={isEditing}
                        onChangeText={(text) => handleChange('prenom', text)}
                        placeholder="Votre prénom"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Feather name="mail" size={18} color="#888" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.disabledInput]}
                      value={userData.email}
                      editable={false}
                      placeholder="votre@email.com"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Téléphone</Text>
                  <View style={styles.inputWrapper}>
                    <Feather name="phone" size={18} color="#888" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, !isEditing && styles.disabledInput]}
                      value={userData.phone}
                      editable={isEditing}
                      onChangeText={(text) => handleChange('phone', text)}
                      placeholder="Votre numéro"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Adresse</Text>
                  <View style={styles.inputWrapper}>
                    <Feather name="map-pin" size={18} color="#888" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, !isEditing && styles.disabledInput]}
                      value={userData.address}
                      editable={isEditing}
                      onChangeText={(text) => handleChange('address', text)}
                      placeholder="Votre adresse"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Mot de passe</Text>
                  <View style={styles.inputWrapper}>
                    <Feather name="lock" size={18} color="#888" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, !isEditing && styles.disabledInput]}
                      value={isEditing ? userData.motdepasse : "••••••••"}
                      editable={isEditing}
                      secureTextEntry={!showPassword && isEditing}
                      onChangeText={(text) => handleChange('motdepasse', text)}
                      placeholder={isEditing ? "Nouveau mot de passe" : ""}
                    />
                    {isEditing && (
                      <TouchableOpacity 
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                      >
                        <Feather 
                          name={showPassword ? 'eye-off' : 'eye'} 
                          size={18} 
                          color="#888" 
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  {isEditing && (
                    <Text style={styles.hintText}>Laissez vide pour ne pas changer</Text>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

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
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Feather 
                  name={isEditing ? 'check' : 'edit-2'} 
                  size={18} 
                  color="white" 
                />
                <Text style={styles.actionButtonText}>
                  {isEditing ? 'Sauvegarder' : 'Modifier'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          {isEditing && (
            <TouchableOpacity 
              onPress={() => {
                setIsEditing(false);
                setUserData(originalData);
                setShowPassword(false);
              }}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  keyboardView: { 
    flex: 1 
  },
  scrollContainer: { 
    paddingBottom: 100 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center'
  },
  profileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    gap: 16,
  },
  inputRow: {
    flexDirection: 'column',
    gap: 12,
  },
  inputContainerHalf: {
    flex: 1,
  },
  inputContainer: {
    // marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    padding: 0,
  },
  disabledInput: {
    color: '#888',
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  hintText: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  editButton: {
    backgroundColor: '#ff7d00',
  },
  saveButton: {
    backgroundColor: '#ff7d00',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#4a6fa5',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  skeletonContainer: {
    marginBottom: 16,
  },
  skeletonInput: {
    height: 48,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  skeletonButton: {
    backgroundColor: '#f0f0f0',
    height: 48,
  },
});

export default Infopersonnel;