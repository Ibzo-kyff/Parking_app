// app/(clients)/favoris.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { favorisService, FavorisVehicule } from '../../../components/services/favorisService';

const { width } = Dimensions.get('window');

export default function FavorisScreen() {
  const [favoris, setFavoris] = useState<FavorisVehicule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Charger les favoris
  const loadFavoris = async () => {
    try {
      const favorisData = await favorisService.getFavoris();
      setFavoris(favorisData);
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
      Alert.alert('Erreur', 'Impossible de charger vos favoris');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFavoris();
  }, []);

  // Retirer un véhicule des favoris
  const removeFromFavoris = async (vehiculeId: number) => {
    Alert.alert(
      'Retirer des favoris',
      'Êtes-vous sûr de vouloir retirer ce véhicule de vos favoris ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await favorisService.removeFromFavoris(vehiculeId);
              if (success) {
                setFavoris(prev => prev.filter(fav => fav.id !== vehiculeId));
                Alert.alert('Succès', 'Véhicule retiré des favoris');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de retirer le véhicule');
            }
          },
        },
      ]
    );
  };

  // Vider tous les favoris
  const clearAllFavoris = () => {
    if (favoris.length === 0) return;

    Alert.alert(
      'Vider les favoris',
      'Êtes-vous sûr de vouloir vider tous vos favoris ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await favorisService.clearFavoris();
              if (success) {
                setFavoris([]);
                Alert.alert('Succès', 'Tous les favoris ont été supprimés');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de vider les favoris');
            }
          },
        },
      ]
    );
  };

  // Rafraîchir
  const onRefresh = () => {
    setRefreshing(true);
    loadFavoris();
  };

  // Naviguer vers les détails du véhicule
  const navigateToCarDetails = (vehicule: FavorisVehicule) => {
    router.push({
      pathname: '/(clients)/cardetails',
      params: { vehicule: JSON.stringify(vehicule) }
    });
  };

  // Obtenir la première photo
  const getFirstPhoto = (photos: string[] | string | undefined): string | null => {
    if (!photos) return null;
    if (Array.isArray(photos) && photos.length > 0) {
      return photos[0];
    }
    if (typeof photos === 'string') {
      return photos;
    }
    return null;
  };

  // Rendu d'un item de favoris
  const renderFavorisItem = ({ item }: { item: FavorisVehicule }) => {
    const photoUrl = getFirstPhoto(item.photos);
    
    return (
      <TouchableOpacity 
        style={styles.carCard}
        onPress={() => navigateToCarDetails(item)}
      >
        <View style={styles.carImageContainer}>
          {photoUrl ? (
            <Image 
              source={{ uri: photoUrl }} 
              style={styles.carImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.carImage, styles.placeholderImage]}>
              <FontAwesome name="car" size={40} color="#ccc" />
            </View>
          )}
          
          {/* Bouton retirer des favoris */}
          <TouchableOpacity 
            style={styles.removeFavorisButton}
            onPress={() => removeFromFavoris(item.id)}
          >
            <FontAwesome name="heart" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.carInfo}>
          <Text style={styles.carName}>
            {item.marqueRef?.name || 'Marque'} {item.model}
          </Text>
          
          <Text style={styles.carPrice}>
            {item.prix ? `${item.prix.toLocaleString()} FCFA` : 'Prix non disponible'}
          </Text>

          <View style={styles.carDetails}>
            <Text style={styles.carDetail}>
              <FontAwesome name="calendar" size={12} color="#666" /> {item.year}
            </Text>
            <Text style={styles.carDetail}>
              <FontAwesome name="tachometer" size={12} color="#666" /> {item.mileage?.toLocaleString()} km
            </Text>
            <Text style={styles.carDetail}>
              <FontAwesome name="gas-pump" size={12} color="#666" /> {item.fuelType}
            </Text>
          </View>

          {item.description && (
            <Text style={styles.carDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <Text style={styles.addedDate}>
            Ajouté le {new Date(item.addedAt).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Écran de chargement
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6F00" />
          <Text style={styles.loadingText}>Chargement de vos favoris...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Favoris</Text>
        {favoris.length > 0 && (
          <TouchableOpacity onPress={clearAllFavoris} style={styles.clearButton}>
            <MaterialIcons name="delete-sweep" size={24} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>

      {favoris.length === 0 ? (
        <ScrollView 
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.emptyIcon}>
            <FontAwesome name="heart-o" size={80} color="#ccc" />
          </View>
          <Text style={styles.emptyTitle}>Aucun favori</Text>
          <Text style={styles.emptyText}>
            Les véhicules que vous ajoutez en favoris apparaîtront ici.
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/Clients/listVoiture')}
          >
            <Text style={styles.browseButtonText}>Parcourir les véhicules</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={favoris}
          renderItem={renderFavorisItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                {favoris.length} véhicule{favoris.length > 1 ? 's' : ''} favori{favoris.length > 1 ? 's' : ''}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  browseButton: {
    backgroundColor: '#FF6F00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  statsContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  carCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  carImageContainer: {
    position: 'relative',
  },
  carImage: {
    width: '100%',
    height: 200,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeFavorisButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carInfo: {
    padding: 16,
  },
  carName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  carPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6F00',
    marginBottom: 12,
  },
  carDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  carDetail: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  carDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  addedDate: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});