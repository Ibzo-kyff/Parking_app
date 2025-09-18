import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Dimensions } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const AideSupport = () => {
  const contactMethods = [
    {
      icon: 'phone',
      title: 'Nous appeler',
      description: 'Service client disponible 24/7',
      action: () => Linking.openURL('tel:+22312345678')
    },
    {
      icon: 'mail',
      title: 'Envoyer un email',
      description: 'Réponse sous 24 heures',
      action: () => Linking.openURL('mailto:support@example.com')
    },
    {
      icon: 'message-square',
      title: 'Chat en direct',
      description: 'Disponible de 8h à 20h',
      action: () => console.log('Chat initié')
    }
  ];

  const faqs = [
    'Comment modifier mes informations ?',
    'Problème de connexion',
    'Comment annuler une réservation ?',
    'Paiement sécurisé'
  ];

  return (
    <LinearGradient 
      colors={['#fdbb13ff',  '#fdbb1365']} 
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.3 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* En-tête centré */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Aide & Support</Text>
          <Text style={styles.headerSubtitle}>Nous sommes là pour vous aider</Text>
        </View>

        {/* Carte principale centrée */}
        <View style={styles.card}>
          {/* Section Contact */}
          <Text style={styles.sectionTitle}>Contactez-nous</Text>

          {contactMethods.map((method, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.contactMethod}
              onPress={method.action}
            >
              <View style={styles.methodLeft}>
                <Feather name={method.icon} size={24} color="#FDB913" />
                <View style={styles.methodTextContainer}>
                  <Text style={styles.methodTitle}>{method.title}</Text>
                  <Text style={styles.methodDescription}>{method.description}</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          ))}

          {/* Séparateur */}
          <View style={styles.separator} />

          {/* Section FAQ */}
          <Text style={styles.sectionTitle}>Questions fréquentes</Text>

          {faqs.map((question, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.faqItem}
              onPress={() => console.log('FAQ sélectionnée:', question)}
            >
              <Text style={styles.faqText}>{question}</Text>
              <Feather name="chevron-right" size={18} color="#999" />
            </TouchableOpacity>
          ))}

          {/* Section Centre d'aide */}
          <Text style={styles.sectionTitle}>Centre d'aide</Text>
          <TouchableOpacity 
            style={styles.helpCenter}
            onPress={() => Linking.openURL('https://aide.example.com')}
          >
            <MaterialIcons name="help-outline" size={24} color="#FDB913" />
            <Text style={styles.helpCenterText}>Accéder au centre d'aide en ligne</Text>
            <Feather name="external-link" size={18} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  scrollContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 30,
  },
  header: {
    width: width * 0.9,
    paddingVertical: 25,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
  },
  card: {
    width: width * 0.9,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginBottom: 15,
    marginTop: 10,
  },
  contactMethod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodTextContainer: {
    marginLeft: 15,
  },
  methodTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  methodDescription: {
    fontSize: 14,
    color: '#777',
    marginTop: 3,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 10,
  },
  faqItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  faqText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  helpCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  helpCenterText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 15,
    marginRight: 10,
    flex: 1,
  },
});

export default AideSupport;