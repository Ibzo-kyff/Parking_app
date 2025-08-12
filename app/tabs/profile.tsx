import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable, Dimensions } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Link } from 'expo-router'; // Changement important ici

const { width } = Dimensions.get('window');

const profile = () => {
  const [profileImage, setProfileImage] = useState('https://cdn-icons-png.flaticon.com/512/149/149071.png');
  const [modalVisible, setModalVisible] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
    setModalVisible(false);
  };

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
    setModalVisible(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      {/* Photo de profil modifiable */}
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.8}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: profileImage }}
              style={styles.profileImage}
            />
            <View style={styles.editIcon}>
              <Feather name="edit-2" size={20} color="#FDB913" />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>Harber Djitteye</Text>
        <Text style={styles.userTitle}>Développeur Full Stack</Text>
      </View>

      {/* Menu options */}
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
      </View>

      {/* Bouton Déconnexion */}
      <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8}>
        <Text style={styles.logoutButtonText}>Déconnexion</Text>
      </TouchableOpacity>

      {/* Modal pour changer la photo */}
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
            >
              <MaterialCommunityIcons name="camera" size={24} color="#FDB913" />
              <Text style={styles.modalButtonText}>Prendre une photo</Text>
            </Pressable>
            
            <Pressable 
              style={styles.modalButton} 
              onPress={pickImage}
              android_ripple={{ color: '#f0f0f0' }}
            >
              <FontAwesome name="photo" size={24} color="#FDB913" />
              <Text style={styles.modalButtonText}>Choisir depuis la galerie</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.modalButton, { borderBottomWidth: 0 }]} 
              onPress={() => setModalVisible(false)}
              android_ripple={{ color: '#f0f0f0' }}
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
    flex: 1,
    backgroundColor: "white",
    paddingBottom: 5,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: '#FDB913',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FDB913',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  userTitle: {
    fontSize: 14,
    color: '#777',
    fontStyle: 'italic',
  },
  menuContainer: {
    marginHorizontal: 20,
    marginBottom: 5,
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuIcon: {
    width: 35,
    height: 35,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 99, 71, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 3,
  },
  menuItemSubText: {
    fontSize: 13,
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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
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
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#333',
  },
  modalButton: {
    width: '100%',
    paddingVertical: 8,
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
});

export default profile;