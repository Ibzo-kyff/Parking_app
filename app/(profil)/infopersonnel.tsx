import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const infopersonnel = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    nom: 'Djitteye',
    prenom: 'Amadou',
    adresse: '123 balaban coro , Bamako',
    telephone: '+223 76 45 32 10',
    email: 'djitteyeamadou@gmail.com',
    motdepasse: '********'
  });

  const handleChange = (name, value) => {
    setUserData({...userData, [name]: value});
  };

  const handleSave = () => {
    setIsEditing(false);
    console.log('Données sauvegardées:', userData);
  };

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
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Informations Personnelles</Text>
          </View>

          <View style={styles.card}>
            {/* Nom */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nom</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="person-outline" size={20} color="#777" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={userData.nom}
                  onChangeText={(text) => handleChange('nom', text)}
                  editable={isEditing}
                  placeholder="Votre nom"
                />
              </View>
            </View>

            {/* Prénom */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Prénom</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="person-outline" size={20} color="#777" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={userData.prenom}
                  onChangeText={(text) => handleChange('prenom', text)}
                  editable={isEditing}
                  placeholder="Votre prénom"
                />
              </View>
            </View>

            {/* Adresse */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Adresse</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="location-on" size={20} color="#777" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={userData.adresse}
                  onChangeText={(text) => handleChange('adresse', text)}
                  editable={isEditing}
                  placeholder="Votre adresse"
                />
              </View>
            </View>

            {/* Téléphone */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Téléphone</Text>
              <View style={styles.inputWrapper}>
                <Feather name="phone" size={20} color="#777" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={userData.telephone}
                  onChangeText={(text) => handleChange('telephone', text)}
                  editable={isEditing}
                  keyboardType="phone-pad"
                  placeholder="Votre numéro"
                />
              </View>
            </View>

            {/* Email - Toujours modifiable */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="email" size={20} color="#777" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={userData.email}
                  onChangeText={(text) => handleChange('email', text)}
                  editable={true}  // Toujours modifiable
                  keyboardType="email-address"
                  placeholder="Votre email"
                />
              </View>
            </View>

            {/* Mot de passe */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={20} color="#777" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={userData.motdepasse}
                  onChangeText={(text) => handleChange('motdepasse', text)}
                  editable={isEditing}
                  secureTextEntry={!isEditing}
                  placeholder="Votre mot de passe"
                />
                {!isEditing && (
                  <TouchableOpacity style={styles.eyeIcon}>
                    <Feather name="eye-off" size={20} color="#777" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bouton Modifier/Enregistrer en bas de l'écran */}
        <View style={styles.footer}>
          <TouchableOpacity 
            onPress={() => isEditing ? handleSave() : setIsEditing(true)}
            style={[styles.actionButton, isEditing ? styles.saveButton : styles.editButton]}
          >
            <Feather 
              name={isEditing ? 'check' : 'edit-2'} 
              size={20} 
              color="white" 
              style={styles.buttonIcon}
            />
            <Text style={styles.actionButtonText}>
              {isEditing ? 'Enregistrer' : 'Modifier mes informations'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 80, // Espace pour le bouton en bas
  },
  header: {
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#777',
    marginBottom: 5,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 5,
  },
  eyeIcon: {
    padding: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  editButton: {
    backgroundColor: '#FDB913',
  },
  saveButton: {
    backgroundColor: '#4CAF50', // Vert pour l'action de sauvegarde
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  buttonIcon: {
    marginRight: 5,
  },
});

export default infopersonnel;