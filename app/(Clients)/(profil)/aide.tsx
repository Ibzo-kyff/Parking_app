import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';

const AideSupport = () => {
  const navigation = useNavigation();

  const contactMethods = [
  
    {
      icon: 'mail',
      title: 'Envoyer un email',
      description: 'Réponse sous 24 heures',
      action: () => Linking.openURL('mailto:mobilitymali.zone@gmail.com'),
      color: '#ff7d00'
    },
    {
      icon: 'message-square',
      title: 'Chat en direct',
      description: 'Disponible de 8h à 20h',
      action: () => Alert.alert('Chat en direct', "Le chat est disponible de 8h à 20h. Vous pouvez envoyer un message et notre équipe vous répondra."),
      color: '#ff7d00'
    }
  ];
  const router = useRouter();

  const faqs = [
    { 
      id: 'edit-info',
      question: 'Comment modifier mes informations ?',
      icon: 'person-outline',
      action: () => router.push('/(Clients)/(profil)/infopersonnel')
    },
    { 
      id: 'login-issue',
      question: 'Problème de connexion',
      icon: 'wifi-outline',
      action: () => Alert.alert('Problème de connexion', 'Vérifiez votre connexion Internet et vos identifiants. Si le problème persiste, contactez le support.')
    },
    { 
      id: 'cancel-reservation',
      question: 'Comment annuler une réservation ?',
      icon: 'close-circle-outline',
      action: () => Alert.alert(
        'Annulation de réservation',
        "Vous pouvez annuler une réservation uniquement si il reste plus de 24 heures avant le début de la réservation. \n\nPour annuler : ouvrez 'Réservations', sélectionnez la réservation concernée puis appuyez sur 'Annuler'. \n\nSi le temps restant est inférieur ou égal à 24 heures, l'annulation n'est pas possible via l'application. Contactez le support si nécessaire.")
    },
    { 
      id: 'secure-payment',
      question: 'Paiement sécurisé',
      icon: 'card-outline',
      action: () => Alert.alert('Paiement sécurisé', 'Les paiements sont traités via des prestataires sécurisés. Vos données bancaires ne sont pas stockées.')
    }
  ];

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
            <Ionicons name="arrow-back" size={22} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Aide & Support</Text>
            <Text style={styles.headerSubtitle}>Nous sommes là pour vous aider</Text>
          </View>
          
          <View style={styles.headerIcon}>
            <Ionicons name="help-circle-outline" size={24} color="#ff7d00" />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#fff5e6' }]}>
              <Ionicons name="call-outline" size={22} color="#ff7d00" />
            </View>
            <Text style={styles.sectionTitle}>Contactez-nous</Text>
          </View>

          <View style={styles.contactMethodsContainer}>
            {contactMethods.map((method, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.contactMethod}
                onPress={method.action}
                activeOpacity={0.7}
              >
                <View style={[styles.contactIconContainer, { backgroundColor: '#fff5e6' }]}>
                  <Feather name={method.icon as any} size={20} color="#ff7d00" />
                </View>
                <View style={styles.contactTextContainer}>
                  <Text style={styles.contactTitle}>{method.title}</Text>
                  <Text style={styles.contactDescription}>{method.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#bbb" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.sectionHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#fff5e6' }]}>
              <Ionicons name="help-outline" size={22} color="#ff7d00" />
            </View>
            <Text style={styles.sectionTitle}>Questions fréquentes</Text>
          </View>

          <View style={styles.faqContainer}>
            {faqs.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.faqItem}
                onPress={item.action}
                activeOpacity={0.7}
              >
                <View style={styles.faqLeft}>
                  <Ionicons name={item.icon as any} size={18} color="#ff7d00" style={styles.faqIcon} />
                  <Text style={styles.faqText}>{item.question}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#bbb" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.sectionHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#fff5e6' }]}>
              <Ionicons name="book-outline" size={22} color="#ff7d00" />
            </View>
            <Text style={styles.sectionTitle}>Centre d'aide</Text>
          </View>

          <TouchableOpacity 
            style={styles.helpCenter}
            onPress={() => Linking.openURL('https://aide.example.com')}
            activeOpacity={0.7}
          >
            <View style={styles.helpCenterLeft}>
              <View style={[styles.contactIconContainer, { backgroundColor: '#fff5e6' }]}>
                <Ionicons name="globe-outline" size={20} color="#ff7d00" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactTitle}>Centre d'aide en ligne</Text>
                <Text style={styles.contactDescription}>Articles détaillés et guides</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={18} color="#bbb" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Nous répondons à vos questions</Text>
          <Text style={styles.infoText}>du lundi au vendredi, 8h - 20h</Text>
          <Text style={styles.infoEmail}>mobilitymali.zone@gmail.com</Text>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  contactMethodsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 14,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  contactDescription: {
    fontSize: 13,
    color: '#666',
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 20,
  },
  faqContainer: {
    gap: 10,
    marginBottom: 20,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 12,
  },
  faqLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  faqIcon: {
    marginRight: 12,
  },
  faqText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  helpCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 14,
  },
  helpCenterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  infoEmail: {
    fontSize: 14,
    color: '#ff7d00',
    fontWeight: '500',
    marginTop: 8,
  },
});

export default AideSupport;