
import Header from '../Header';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-swiper';

import bgStat from '../../assets/images/image1.jpg';
import headerImage from '../../assets/images/parking.png';

// 🔹 Types
type Voiture = {
  id: string;
  marque: string;
  modele: string;
  image: any;
};

type Marque = {
  id: string;
  nom: string;
  logo: any;
};

// 🔹 Données
const voituresPopulaires: Voiture[] = [
  { id: '1', marque: 'Toyota', modele: 'Corolla', image: require('../../assets/images/voiture1.jpg') },
  { id: '2', marque: 'Hyundai', modele: 'Elantra', image: require('../../assets/images/voiture3.jpg') },
  { id: '3', marque: 'Peugeot', modele: '308', image: require('../../assets/images/voiture3.jpg') },
];

const marques: Marque[] = [
  { id: '1', nom: 'Toyota', logo: require('../../assets/images/toyota.jpg') },
  { id: '2', nom: 'Renault', logo: require('../../assets/images/renault.png') },
  { id: '3', nom: 'Mercedes', logo: require('../../assets/images/mercede.png') },
  { id: '4', nom: 'Audi', logo: require('../../assets/images/audi.png') },
];

const voituresRecentes: Voiture[] = [
  { id: '4', marque: 'BMW', modele: 'Serie 3', image: require('../../assets/images/voiture1.jpg') },
  { id: '5', marque: 'Audi', modele: 'A4', image: require('../../assets/images/voiture1.jpg') },
  { id: '6', marque: 'Renault', modele: 'Clio', image: require('../../assets/images/voiture3.jpg') },
];

const AccueilParking = () => {
   const [searchText, setSearchText] = useState('');

  // 🔹 Navigation / actions
  const handleAjouterVoiture = () => router.navigate('/(ParkingDetail)/AjoutParking');
  const handleHistorique = () => router.navigate('/historique');
  const handleVoirTout = () => router.navigate('/voitures/populaires');

  const handleSelectMarque = (marque: Marque) => {
    router.push(`/voitures/marque/${marque.nom}`);
  };

  const handleSelectVoiture = (voiture: Voiture) => {
    router.push(`/voitures/details/${voiture.id}`);
  };

  // 🔹 Renders
  const renderVoitureItem = ({ item }: { item: Voiture }) => (
    <TouchableOpacity style={styles.voitureCard} onPress={() => handleSelectVoiture(item)}>
      <Image source={item.image} style={styles.voitureImage} />
      <Text style={styles.voitureText}>{item.marque} {item.modele}</Text>
    </TouchableOpacity>
  );

  const renderMarqueItem = ({ item }: { item: Marque }) => (
    <TouchableOpacity style={styles.marqueCard} onPress={() => handleSelectMarque(item)}>
      <Image source={item.logo} style={styles.marqueLogo} />
      <Text style={styles.marqueNom}>{item.nom}</Text>
    </TouchableOpacity>
  );
  return (
    <View style={styles.mainContainer}>
      {/* Header fixe */}
      <Header />
      
      {/* Contenu scrollable */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.searchBar}>
          <Ionicons name="search" size={24} color="#888" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchPlaceholder}
            placeholder="Rechercher une voiture..."
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity onPress={() => console.log("Filtre cliqué")}>
            <Ionicons name="filter" size={24} color="#FD6A00" style={{ marginLeft: 10 }} />
          </TouchableOpacity>
        </View>

        {/* Carousel Marques */}
        <View style={styles.marquesSection}>
          <Text style={styles.sectionTitle}>Marques</Text>
          <FlatList
            data={marques}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={renderMarqueItem}
          />
        </View>

        {/* Carousel voitures récentes */}
        <View style={styles.recentesSection}>
          <Text style={styles.sectionTitle}>Récemment ajoutées</Text>
          <View style={{ height: 200 }}>
            <Swiper autoplay autoplayTimeout={3} showsPagination={true} dotColor="#ccc" activeDotColor="#FD6A00">
              {voituresRecentes.map((v) => (
                <TouchableOpacity key={v.id} style={styles.recentCard} onPress={() => handleSelectVoiture(v)}>
                  <Image source={v.image} style={styles.recentImage} />
                  <Text style={styles.recentText}>{v.marque} {v.modele}</Text>
                </TouchableOpacity>
              ))}
            </Swiper>
          </View>
        </View>

       

        {/* Populaires */}
        <View style={styles.populairesSection}>
          <View style={styles.populairesHeader}>
            <Text style={styles.sectionTitle}>Voitures les plus vues</Text>
            <TouchableOpacity onPress={handleVoirTout}>
              <Text style={styles.voirTout}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={voituresPopulaires}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={renderVoitureItem}
          />
        </View>
        {/* Liens rapides en bas de l'écran */}
         {/* Statistiques */}
        <View style={styles.statsSection}>
           <TouchableOpacity style={styles.quickLink} onPress={handleAjouterVoiture}>
            <Ionicons name="add-circle" size={24} color="#FD6A00" />
            <Text style={styles.quickLinkText}>Ajouter</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickLink} onPress={() => router.navigate('/voitures/vendues')}>
            <Ionicons name="car-sport" size={24} color="#FD6A00" />
            <Text style={styles.quickLinkText}>Vendues</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickLink} onPress={() => router.navigate('/voitures/louees')}>
            <Ionicons name="time" size={24} color="#FD6A00" />
            <Text style={styles.quickLinkText}>Louées</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// 🔹 Styles modifiés
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    paddingTop: 25,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 20, // Espace pour le header fixe
    paddingBottom: 20,
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchPlaceholder: { 
    color: '#888', 
    fontSize: 16, 
    flex: 1 
  },
  addButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: { 
    backgroundColor: '#FD6A00', 
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  addButtonText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 12,
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsCardsContainer: {
    flex: 1,
    justifyContent: 'space-between',
    height: 110,
  },
  statCard: {
    height: 50,
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  statCardImage: { 
    borderRadius: 10, 
    resizeMode: 'cover', 
    opacity: 0.3 
  },
  statNumber: { 
    fontWeight: 'bold', 
    color: '#000',
    fontSize: 16,
  },
  statLabel: { 
    color: '#000',
    fontSize: 10,
  },
  marquesSection: { 
    marginHorizontal: 16, 
    marginBottom: 20 
  },
  marqueCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginRight: 10,
    width: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  marqueLogo: { 
    width: 40, 
    height: 40, 
    resizeMode: 'contain', 
    marginBottom: 5 
  },
  marqueNom: { 
    fontSize: 12, 
    fontWeight: '600', 
    textAlign: 'center' 
  },
  recentesSection: { 
    marginHorizontal: 16, 
    marginBottom: 20 
  },
  recentCard: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  recentImage: { 
    width: '100%', 
    height: 150, 
    borderRadius: 8 
  },
  recentText: { 
    marginTop: 5, 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#333' 
  },
  populairesSection: { 
    marginHorizontal: 16, 
    marginBottom: 20 
  },
  populairesHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  voirTout: { 
    fontSize: 14, 
    color: '#FD6A00', 
    fontWeight: 'bold' 
  },
  voitureCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginRight: 10,
    width: 140,
    alignItems: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  voitureImage: { 
    width: 100, 
    height: 70, 
    borderRadius: 8, 
    marginBottom: 8 
  },
  voitureText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#333', 
    textAlign: 'center' 
  },
  quickLinksContainer: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  backgroundColor: '#fff',
  paddingVertical: 10,
  borderTopWidth: 1,
  borderTopColor: '#eee',
  position: 'absolute',
  bottom: 10,
  left: 0,
  right: 0,
},
quickLink: {
  alignItems: 'center',
  paddingHorizontal: 10,
},
quickLinkText: {
  marginTop: 4,
  fontSize: 12,
  color: '#333',
  fontWeight: '500',
},

});

export default AccueilParking;