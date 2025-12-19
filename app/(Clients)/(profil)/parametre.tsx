import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Modal } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ParametresPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const navigation = useNavigation();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['token','user']);
            } catch (e) {
              console.warn('Erreur suppression storage:', e);
            }
            router.replace('/(auth)/LoginScreen');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Vos données seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => console.log('Compte supprimé') }
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    setShowPrivacy(true);
  };

  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#ff7d00" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Paramètres</Text>
            <Text style={styles.headerSubtitle}>Personnalisez votre expérience</Text>
          </View>
          
          <View style={styles.headerIcon}>
            <Ionicons name="settings-outline" size={24} color="#ff7d00" />
          </View>
        </View>

        <Modal
          visible={showPrivacy}
          animationType="slide"
          onRequestClose={() => setShowPrivacy(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Politique de confidentialité</Text>
              <TouchableOpacity onPress={() => setShowPrivacy(false)} style={styles.modalCloseButton}>
                <Feather name="x" size={20} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.policyHeading}>Introduction</Text>
              <Text style={styles.policyText}>
                Nous prenons la confidentialité de vos données au sérieux. Cette politique explique quelles
                informations nous collectons, comment nous les utilisons et les options dont vous disposez.
              </Text>

              <Text style={styles.policyHeading}>Données collectées</Text>
              <Text style={styles.policyText}>
                Nous pouvons collecter des informations personnelles (nom, adresse e-mail) et des données
                techniques (identifiants d'appareil, données de localisation si vous les autorisez) nécessaires
                au fonctionnement du service.
              </Text>

              <Text style={styles.policyHeading}>Utilisation des données</Text>
              <Text style={styles.policyText}>
                Les données servent à fournir et améliorer le service, gérer votre compte, vous envoyer des
                notifications importantes et personnaliser votre expérience.
              </Text>

              <Text style={styles.policyHeading}>Partage et tiers</Text>
              <Text style={styles.policyText}>
                Nous ne vendons pas vos données. Nous pouvons partager certaines informations avec des prestataires
                de services (hébergement, analytics) qui agissent en notre nom et sous contrat.
              </Text>

              <Text style={styles.policyHeading}>Sécurité</Text>
              <Text style={styles.policyText}>
                Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données
                contre tout accès non autorisé. Aucune méthode n'est toutefois totalement sécurisée.
              </Text>

              <Text style={styles.policyHeading}>Conservation</Text>
              <Text style={styles.policyText}>
                Nous conservons vos données le temps nécessaire pour fournir le service et pour respecter
                nos obligations légales.
              </Text>

              <Text style={styles.policyHeading}>Vos droits</Text>
              <Text style={styles.policyText}>
                Vous pouvez demander l'accès, la rectification ou la suppression de vos données en nous contactant.
              </Text>

              <Text style={styles.policyHeading}>Contact</Text>
              <Text style={styles.policyText}>
                Pour toute question relative à cette politique, contactez-nous via l'adresse indiquée dans
                l'application ou les informations légales.
              </Text>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setShowPrivacy(false)}>
                  <Text style={styles.closeButtonText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apparence</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.settingItem}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#fff5e6' }]}>
                  <Ionicons name="moon-outline" size={20} color="#ff7d00" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Mode sombre</Text>
                  <Text style={styles.settingDescription}>Adapté à l'utilisation nocturne</Text>
                </View>
              </View>
              <Switch
                value={darkMode}
                onValueChange={() => setDarkMode(!darkMode)}
                trackColor={{ false: "#e0e0e0", true: "#ff7d00" }}
                thumbColor={Platform.OS === 'ios' ? "#fff" : darkMode ? "#fff" : "#fff"}
                ios_backgroundColor="#e0e0e0"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.settingItem}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#fff5e6' }]}>
                  <Ionicons name="notifications-outline" size={20} color="#ff7d00" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Notifications push</Text>
                  <Text style={styles.settingDescription}>Recevez des alertes importantes</Text>
                </View>
              </View>
              <Switch
                value={notifications}
                onValueChange={() => setNotifications(!notifications)}
                trackColor={{ false: "#e0e0e0", true: "#ff7d00" }}
                thumbColor={Platform.OS === 'ios' ? "#fff" : notifications ? "#fff" : "#fff"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confidentialité</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handlePrivacyPolicy}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#fff5e6' }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#ff7d00" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Politique de confidentialité</Text>
                  <Text style={styles.settingDescription}>Comment nous protégeons vos données</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#bbb" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#fff5e6' }]}>
                  <Ionicons name="trash-outline" size={20} color="#ff7d00" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Supprimer mon compte</Text>
                  <Text style={styles.settingDescription}>Cette action est définitive</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#bbb" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#fff5e6' }]}>
                  <Ionicons name="log-out-outline" size={20} color="#ff7d00" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Déconnexion</Text>
                  <Text style={styles.settingDescription}>Quitter votre session actuelle</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#bbb" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 Mon Application. Tous droits réservés.</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 5,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff5e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    marginLeft: 2,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  settingDescription: {
    fontSize: 13,
    color: '#888',
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 6,
  },
  copyrightText: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  modalCloseButton: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 50 : 18,
    padding: 8,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  policyHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 6,
  },
  policyText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 10,
  },
  modalFooter: {
    alignItems: 'center',
    marginTop: 10,
  },
  closeButton: {
    backgroundColor: '#ff7d00',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ParametresPage;