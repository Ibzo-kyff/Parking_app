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
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { favorisService, FavorisVehicule } from '../../../components/services/favorisService';

export default function FavorisScreen() {
  const [favoris, setFavoris] = useState<FavorisVehicule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const onRefresh = () => {
    setRefreshing(true);
    loadFavoris();
  };

  const navigateToCarDetails = (vehicule: FavorisVehicule) => {
    router.push({
      pathname: '/(clients)/cardetails',
      params: { vehicule: JSON.stringify(vehicule) }
    });
  };

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

  const renderFavorisItem = ({ item }: { item: FavorisVehicule }) => {
    const photoUrl = getFirstPhoto(item.photos);
    
    return (
      <TouchableOpacity 
        style={styles.carCard}
        onPress={() => navigateToCarDetails(item)}
        activeOpacity={0.9}
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
              <FontAwesome name="car" size={36} color="#ccc" />
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.removeFavorisButton}
            onPress={() => removeFromFavoris(item.id)}
            activeOpacity={0.8}
          >
            <FontAwesome name="heart" size={14} color="#FFF" />
          </TouchableOpacity>

          {item.year && (
            <View style={styles.yearBadge}>
              <Text style={styles.yearText}>{item.year}</Text>
            </View>
          )}
        </View>

        <View style={styles.carInfo}>
          <Text style={styles.carName} numberOfLines={1}>
            {item.marqueRef?.name || 'Marque'} {item.model}
          </Text>
          
          <Text style={styles.carPrice}>
            {item.prix ? `${item.prix.toLocaleString()} FCFA` : 'Prix non disponible'}
          </Text>

          <View style={styles.carDetails}>
            <View style={styles.detailItem}>
              <FontAwesome name="tachometer" size={12} color="#888" />
              <Text style={styles.detailText}>{item.mileage?.toLocaleString() || '0'} km</Text>
            </View>
            
            <View style={styles.detailItem}>
              <FontAwesome name="car" size={12} color="#888" />
              <Text style={styles.detailText}>{item.fuelType || '--'}</Text>
            </View>
            
           
          </View>

          <Text style={styles.addedDate}>
            <Ionicons name="time-outline" size={12} color="#999" /> 
            {' '}Ajouté le {new Date(item.addedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#ff7d00" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes Favoris</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff7d00" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#ff7d00" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Favoris</Text>
        {favoris.length > 0 && (
          <TouchableOpacity onPress={clearAllFavoris} style={styles.clearButton}>
            <MaterialIcons name="delete-sweep" size={22} color="#ff7d00" />
          </TouchableOpacity>
        )}
      </View>

      {favoris.length === 0 ? (
        <ScrollView 
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#ff7d00']}
              tintColor="#ff7d00"
            />
          }
        >
          <View style={styles.emptyIconContainer}>
            <View style={styles.emptyIconCircle}>
              <FontAwesome name="heart-o" size={44} color="#ff7d00" />
            </View>
          </View>
          <Text style={styles.emptyTitle}>Aucun favori</Text>
          <Text style={styles.emptyText}>
            Les véhicules que vous ajoutez en favoris s'afficheront ici.
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/Clients/listVoiture')}
            activeOpacity={0.8}
          >
            <Text style={styles.browseButtonText}>Découvrir les véhicules</Text>
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
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#ff7d00']}
              tintColor="#ff7d00"
            />
          }
          ListHeaderComponent={
            <View style={styles.statsContainer}>
              <View style={styles.statsContent}>
                <FontAwesome name="heart" size={18} color="#ff7d00" />
                <Text style={styles.statsText}>
                  {favoris.length} véhicule{favoris.length > 1 ? 's' : ''} favori{favoris.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Faites glisser vers le bas pour actualiser
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
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  clearButton: {
    padding: 8,
  },
  headerPlaceholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
    fontWeight: '400',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff5e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  browseButton: {
    backgroundColor: '#ff7d00',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#ff7d00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  statsContainer: {
    backgroundColor: '#fff5e6',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginLeft: 10,
  },
  carCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  carImageContainer: {
    position: 'relative',
  },
  carImage: {
    width: '100%',
    height: 180,
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
    backgroundColor: '#ff4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  yearBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255, 125, 0, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  yearText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  carInfo: {
    padding: 16,
  },
  carName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  carPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ff7d00',
    marginBottom: 12,
  },
  carDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  addedDate: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#aaa',
  },
});