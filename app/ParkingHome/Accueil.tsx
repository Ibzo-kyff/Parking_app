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

const AccueilScreen = () => {
  const [searchText, setSearchText] = useState('');

  // 🔹 Navigation / actions
  const handleAjouterVoiture = () => router.navigate('/voitures/ajouter');
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
    <ScrollView style={styles.container}>
      {/* 🔹 Image en-tête */}
      <Animated.View entering={FadeInDown.duration(800)} style={styles.headerWrapper}>
        <ImageBackground source={headerImage} style={styles.headerImage} imageStyle={{ borderRadius: 12 }}>
          <Animated.Text entering={FadeInDown.duration(800).delay(200)} style={styles.headerText}>
            Gérez votre parking en toute sécurité
          </Animated.Text>
        </ImageBackground>
      </Animated.View>

      {/* 🔍 Barre de recherche avec saisie + icône filtre */}
<View style={[styles.searchBar, { paddingVertical: 8 }]}>
  {/* Icône recherche */}
  <Ionicons name="search" size={24} color="#888" style={{ marginRight: 10 }} />

  {/* Champ de recherche */}
  <TextInput
    style={[styles.searchPlaceholder, { fontSize: 16, flex: 1 }]}
    placeholder="Rechercher une voiture..."
    value={searchText}
    onChangeText={setSearchText}
  />

  {/* Icône filtre */}
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

      {/* Statistiques avec bouton à gauche et cartes à droite */}
      <View style={[styles.statsSection, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 10 }]}>
        {/* Bouton à gauche */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={[styles.addButton, { paddingVertical: 8, paddingHorizontal: 10 }]} onPress={handleAjouterVoiture}>
            <Text style={[styles.addButtonText, { fontSize: 12 }]}>+ Ajouter une voiture</Text>
          </TouchableOpacity>
        </View>

        {/* Cartes à droite */}
        <View style={{ flex: 1, justifyContent: 'space-between', height: 110 }}>
          <ImageBackground source={bgStat} style={[styles.statCard, { height: 50, paddingVertical: 6 }]} imageStyle={styles.statCardImage}>
            <Text style={[styles.statNumber, { fontSize: 16 }]}>12</Text>
            <Text style={[styles.statLabel, { fontSize: 10 }]}>En vente</Text>
          </ImageBackground>
          <ImageBackground source={bgStat} style={[styles.statCard, { height: 50, paddingVertical: 6 }]} imageStyle={styles.statCardImage}>
            <Text style={[styles.statNumber, { fontSize: 16 }]}>5</Text>
            <Text style={[styles.statLabel, { fontSize: 10 }]}>En location</Text>
          </ImageBackground>
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
    </ScrollView>
  );
};

export default AccueilScreen;

// 🔹 Styles (inchangés sauf TextInput)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7', marginTop: 90 },
  headerWrapper: {
    marginHorizontal: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerImage: { height: 80, justifyContent: 'center', alignItems: 'center' },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchPlaceholder: { color: '#888', fontSize: 14 },
  addButton: { backgroundColor: '#FD6A00', borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  statsSection: {
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
  statCard: {
    flex: 1,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  statCardImage: { borderRadius: 10, resizeMode: 'cover', opacity: 0.3 },
  statNumber: { fontWeight: 'bold', color: '#000' },
  statLabel: { color: '#000' },
  marquesSection: { marginHorizontal: 16, marginBottom: 20 },
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
  marqueLogo: { width: 40, height: 40, resizeMode: 'contain', marginBottom: 5 },
  marqueNom: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  recentesSection: { marginHorizontal: 16, marginBottom: 20 },
  recentCard: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  recentImage: { width: '100%', height: 150, borderRadius: 8 },
  recentText: { marginTop: 5, fontSize: 14, fontWeight: '600', color: '#333' },
  populairesSection: { marginHorizontal: 16, marginBottom: 20 },
  populairesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  voirTout: { fontSize: 14, color: '#FD6A00', fontWeight: 'bold' },
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
  voitureImage: { width: 100, height: 70, borderRadius: 8, marginBottom: 8 },
  voitureText: { fontSize: 14, fontWeight: '600', color: '#333', textAlign: 'center' },
});
