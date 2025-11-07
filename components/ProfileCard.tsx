import React, { useState, useEffect } from 'react';
import { 
  View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, 
  Modal, Pressable, Dimensions, ActivityIndicator, Alert, 
  RefreshControl 
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Link, router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { userService } from '../components/services/profileApi';

const { width } = Dimensions.get('window');

const ProfileCard = () => {
  const [profileImage, setProfileImage] = useState('https://cdn-icons-png.flaticon.com/512/149/149071.png');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState({
    nom: "",
    prenom: "",
    userId: ""
  });
  const [userRole, setUserRole] = useState<string>(''); // Ajout d'un état pour le rôle

  const { authState, setAuthState, clearAuthState, refreshAuth } = useAuth();

  // Fonction pour récupérer les données utilisateur
  const fetchUserData = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      else setRefreshing(true);
      
      // Récupération du token depuis le contexte d'authentification
      const token = authState.accessToken;
      
      if (!token) {
        Alert.alert('Erreur', 'Token d\'authentification manquant');
        router.replace('/(auth)/LoginScreen');
        return;
      }

      // Appel du service avec le token
      const userInfo = await userService.getCurrentUser(token);
      
      // Mettre à jour l'image de profil
      if (userInfo.image) {
        setProfileImage(`${userInfo.image}?t=${Date.now()}`);  // ← Correction : pas de préfixe 'https://parkapp-pi.vercel.app'
      }
      
      setUserData({
        nom: userInfo.nom || "Prénom",
        prenom: userInfo.prenom || "Nom",
        userId: userInfo.id || ""
      });
      
      setUserRole(userInfo.role || ''); // Mise à jour du rôle
      
    } catch (error: any) {
      console.error('Erreur:', error);
      
      if (error.status === 401 || error.message.includes('Token invalide ou expiré')) {  // ← AJOUT : Vérifiez aussi le message pour robustesse
        const refreshed = await refreshAuth();  // ← AJOUT : Tentez refresh
        if (refreshed) {
          // Réessayez avec le nouveau token
          try {
            const userInfo = await userService.getCurrentUser(authState.accessToken!);  // Note : ! car refresh a réussi
            if (userInfo.image) {
              setProfileImage(`${userInfo.image}?t=${Date.now()}`);
            }
            setUserData({
              nom: userInfo.nom || "Prénom",
              prenom: userInfo.prenom || "Nom",
              userId: userInfo.id || ""
            });
            setUserRole(userInfo.role || ''); // Mise à jour du rôle après refresh
            return;  // Succès, pas d'alerte
          } catch (retryError) {
            console.error('Erreur après refresh:', retryError);
          }
        }
        // Si refresh échoue, déconnectez
        Alert.alert('Session expirée', 'Veuillez vous reconnecter');
        clearAuthState();
        router.replace('/(auth)/LoginScreen');
      } else {
        Alert.alert('Erreur', 'Impossible de charger les données du profil');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    
    const interval = setInterval(() => {
      fetchUserData(true);
    }, 300000);
    
    return () => clearInterval(interval);
  }, []);

  // Fonction pour uploader l'image
  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);
      const token = authState.accessToken;
      
      if (!token) {
        Alert.alert('Erreur', 'Token d\'authentification manquant');
        return false;
      }

      // Appel du service avec le token et l'URI de l'image
      const result = await userService.updateProfileImage(token, uri);
      
      Alert.alert('Succès', 'Photo de profil mise à jour avec succès');
      
      // Mettre à jour l'image affichée
      if (result.image) {
        setProfileImage(`${result.image}?t=${Date.now()}`);  // ← Correction : pas de préfixe
      }
      
      return true;
    } catch (error: any) {
      console.error('Erreur upload complète:', error);
      
      let errorMessage = 'Impossible de mettre à jour la photo de profil';
      if (error.message.includes('413')) {
        errorMessage = 'L\'image est trop volumineuse. Veuillez choisir une image plus petite.';
      } else if (error.message.includes('415')) {
        errorMessage = 'Format d\'image non supporté. Veuillez utiliser JPEG ou PNG.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Erreur de réseau. Veuillez vérifier votre connexion internet.';
      }
      
      Alert.alert('Erreur', errorMessage);
      return false;
    } finally {
      setUploading(false);
    }
  };

const pickImage = async () => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à votre galerie');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newUri = result.assets[0].uri;
      const previousImage = profileImage; // Store previous for revert on fail
      setProfileImage(newUri); // Update immediately for instant UX
      const uploadSuccess = await uploadImage(newUri);
      if (!uploadSuccess) {
        setProfileImage(previousImage); // Revert if upload fails
      }
    }
  } catch (error) {
    console.error('Erreur sélection image:', error);
    Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
  } finally {
    setModalVisible(false);
  }
};

const takePhoto = async () => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à votre caméra');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newUri = result.assets[0].uri;
      const previousImage = profileImage; // Store previous for revert on fail
      setProfileImage(newUri); // Update immediately for instant UX
      const uploadSuccess = await uploadImage(newUri);
      if (!uploadSuccess) {
        setProfileImage(previousImage); // Revert if upload fails
      }
    }
  } catch (error) {
    console.error('Erreur prise photo:', error);
    Alert.alert('Erreur', 'Impossible de prendre une photo');
  } finally {
    setModalVisible(false);
  }
};

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Se déconnecter',
          onPress: async () => {
            try {
              clearAuthState();
              router.replace('/(auth)/LoginScreen');
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    fetchUserData(true);
  };

  // Composant Skeleton pour le chargement
  const SkeletonLoader = () => (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          <View style={[styles.profileImage, styles.skeletonImage]} />
          <View style={styles.editIcon}>
            <Feather name="edit-2" size={20} color="#FDB913" />
          </View>
        </View>
        <View style={styles.skeletonTextContainer}>
          <View style={[styles.skeletonText, { width: 180, height: 24, marginBottom: 8 }]} />
          <View style={[styles.skeletonText, { width: 140, height: 16 }]} />
        </View>
      </View>

      <View style={styles.menuContainer}>
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.menuItem}>
            <View style={[styles.menuIcon, styles.skeletonIcon]} />
            <View style={styles.menuTextContainer}>
              <View style={[styles.skeletonText, { width: 200, height: 16, marginBottom: 4 }]} />
              <View style={[styles.skeletonText, { width: 160, height: 14 }]} />
            </View>
            <View style={[styles.skeletonChevron, { width: 20, height: 20 }]} />
          </View>
        ))}
      </View>

      <View style={[styles.logoutButton, styles.skeletonButton]} />
    </ScrollView>
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#FDB913']}
          tintColor={'#FDB913'}
        />
      }
    >
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.8} disabled={uploading}>
          <View style={styles.profileImageContainer}>
            {uploading ? (
              <View style={[styles.profileImage, styles.uploadingContainer]}>
                <ActivityIndicator size="large" color="#FDB913" />
              </View>
            ) : (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
                onError={() => setProfileImage('https://cdn-icons-png.flaticon.com/512/149/149071.png')}
              />
            )}
            <View style={styles.editIcon}>
              {uploading ? (
                <ActivityIndicator size="small" color="#FDB913" />
              ) : (
                <Feather name="edit-2" size={20} color="#FDB913" />
              )}
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{userData.nom} {userData.prenom}</Text>
        
        {refreshing && (
          <View style={styles.refreshingIndicator}>
            <ActivityIndicator size="small" color="#FDB913" />
            <Text style={styles.refreshingText}>Mise à jour...</Text>
          </View>
        )}
      </View>

      <View style={styles.menuContainer}>
        <Link href="../(profil)/infopersonnel" asChild>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuIcon}>
              <Ionicons name="person-outline" size={24} color="#FDB913" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemText}>Informations personnelles</Text>
              <Text style={styles.menuItemSubText}>Gérez vos données personnelles</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        </Link>
        
        <Link href="../(profil)/parametre" asChild>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuIcon}>
              <Feather name="settings" size={24} color="#FDB913" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemText}>Paramètres</Text>
              <Text style={styles.menuItemSubText}>Personnalisez l'application</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        </Link>
         
        <Link href="../(profil)/aide" asChild>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuIcon}>
              <Feather name="help-circle" size={24} color="#FDB913" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemText}>Aide & Support</Text>
              <Text style={styles.menuItemSubText}>Centre d'aide et contact</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        </Link>
        {userRole === 'CLIENT' && (
          /* NOUVEAU : Section Favoris */
          <Link href="../(profil)/favoris" asChild>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.menuIcon}>
                <FontAwesome name="heart" size={24} color="#FDB913" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemText}>Favoris</Text>
                <Text style={styles.menuItemSubText}>Vos véhicules favoris</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          </Link>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Déconnexion</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Changer la photo de profil</Text>
            
            <Pressable 
              style={styles.modalButton} 
              onPress={takePhoto}
              android_ripple={{ color: '#f0f0f0' }}
              disabled={uploading}
            >
              <MaterialCommunityIcons name="camera" size={24} color="#FDB913" />
              <Text style={styles.modalButtonText}>Prendre une photo</Text>
            </Pressable>
            
            <Pressable 
              style={styles.modalButton} 
              onPress={pickImage}
              android_ripple={{ color: '#f0f0f0' }}
              disabled={uploading}
            >
              <FontAwesome name="photo" size={24} color="#FDB913" />
              <Text style={styles.modalButtonText}>Choisir depuis la galerie</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.modalButton, { borderBottomWidth: 0 }]} 
              onPress={() => setModalVisible(false)}
              android_ripple={{ color: '#f0f0f0' }}
              disabled={uploading}
            >
              <Text style={[styles.modalButtonText, { color: '#FDB913' }]}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    backgroundColor: "#f8f9fa",
    paddingVertical: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 20,
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#FDB913',
  },
  uploadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  editIcon: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    backgroundColor: '#fff',
    width: 35,
    height: 35,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  refreshingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  refreshingText: {
    fontSize: 12,
    color: '#FDB913',
    marginLeft: 8,
  },
  menuContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(253, 185, 19, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 3,
  },
  menuItemSubText: {
    fontSize: 14,
    color: '#777',
  },
  logoutButton: {
    marginHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
  },
  logoutButtonText: {
    color: '#FDB913',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: width * 0.85,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingTop: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#333',
  },
  modalButton: {
    width: '100%',
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalButtonText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  
  // Styles pour le skeleton loader
  skeletonImage: {
    backgroundColor: '#e1e1e1',
  },
  skeletonTextContainer: {
    alignItems: 'center',
  },
  skeletonText: {
    backgroundColor: '#e1e1e1',
    borderRadius: 4,
  },
  skeletonIcon: {
    backgroundColor: '#e1e1e1',
  },
  skeletonChevron: {
    backgroundColor: '#e1e1e1',
    borderRadius: 10,
  },
  skeletonButton: {
    backgroundColor: '#e1e1e1',
  },
});

export default ProfileCard;