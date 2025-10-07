import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // ← Expo Router au lieu de React Navigation
import { getMarques } from '../../components/services/accueil';

export type Marque = {
  id: string | number;
  name: string; 
  logoUrl?: string;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
  vehicles: any[];
};

export default function TousLesMarques() {
  const router = useRouter(); // ← Expo Router
  const [marques, setMarques] = useState<Marque[]>([]);
  const [filteredMarques, setFilteredMarques] = useState<Marque[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMarques = async () => {
      try {
        const data: Marque[] = await getMarques();

        // Suppression des doublons
        const unique: Marque[] = Array.from(
          new Map<string, Marque>(
            data.map((item) => [item.name.trim().toLowerCase(), item])
          ).values()
        );

        setMarques(unique);
        setFilteredMarques(unique);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des marques :', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarques();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredMarques(marques);
    } else {
      const filtered = marques.filter((item) =>
        item.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredMarques(filtered);
    }
  };

  const handleImageError = (itemId: string | number) => {
    console.log(`❌ Erreur de chargement de l'image pour la marque ${itemId}`);
  };

  const handleMarquePress = (marque: Marque) => {
  console.log('Marque sélectionnée:', marque.name);
  
  // Navigation vers la liste des véhicules avec la marque en paramètre
  router.push({
    pathname: '/(Clients)/listVoiture', // ou le chemin de votre liste de véhicules
    params: { 
      selectedMarque: marque.name,
      marqueId: marque.id.toString()
    }
  });
};

  const handleGoBack = () => {
    // Navigation vers /tabs/accueil
    router.push('/tabs/accueil');
  };

  // Alternative: utiliser router.back() si vous venez de l'accueil
  // const handleGoBack = () => {
  //   router.back();
  // };

  // Alternative: utiliser replace pour éviter l'historique
  // const handleGoBack = () => {
  //   router.replace('/tabs/accueil');
  // };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des marques...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Toutes les marques</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchBar}
          placeholder="Rechercher une marque..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Compteur de résultats */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredMarques.length} marque{filteredMarques.length > 1 ? 's' : ''} trouvée{filteredMarques.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Liste des marques */}
      <FlatList
        data={filteredMarques}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.item}
            onPress={() => handleMarquePress(item)}
          >
            <View style={styles.imageContainer}>
              {item.logoUrl ? (
                <Image
                  source={{ uri: item.logoUrl }}
                  style={styles.image}
                  onError={() => handleImageError(item.id)}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.text} numberOfLines={2}>
              {item.name.trim()}
            </Text>
            {item.vehicles && item.vehicles.length > 0 && (
              <Text style={styles.vehicleCount}>
                {item.vehicles.length} véhicule{item.vehicles.length > 1 ? 's' : ''}
              </Text>
            )}
          </TouchableOpacity>
        )}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={80} color="#ccc" />
            <Text style={styles.noResult}>Aucune marque trouvée</Text>
            <Text style={styles.noResultSubtitle}>
              Essayez avec d'autres termes de recherche
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 8
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  item: {
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  imageContainer: {
    marginBottom: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#e8e8e8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#999',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  vehicleCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResult: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  noResultSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});