import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { parkingService } from '../../components/services/profileApi';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface Parking {
  id: string;
  nom: string;
  address: string;
  phone?: string;
  prix?: number;
  image?: string;
}

const ParkingListScreen: React.FC = () => {
  const { authState } = useAuth(); // Utilisez authState au lieu de déstructurer accessToken directement
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  const fetchParkings = async () => {
    try {
      if (!authState.accessToken) {
        Alert.alert('Erreur', 'Token d\'accès manquant');
        return;
      }
      
      const data = await parkingService.getParkings(authState.accessToken);
      setParkings(data);
    } catch (error) {
      console.error('Erreur chargement parkings :', error);
      Alert.alert('Erreur', 'Impossible de charger la liste des parkings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchParkings();
  }, [authState.accessToken]); // Dépendance sur authState.accessToken

  const onRefresh = () => {
    setRefreshing(true);
    fetchParkings();
  };

  const openChat = (parking: Parking) => {
    navigation.navigate('chatpage', { 
      parkingId: parking.id, 
      parkingName: parking.nom 
    });
  };

  const renderItem = ({ item }: { item: Parking }) => (
    <View style={styles.card}>
      {item.image ? (
        <Image 
          source={{ uri: item.image }} 
          style={styles.image} 
          onError={() => console.log("Erreur de chargement de l'image")}
        />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={{ color: '#999' }}>Pas d'image</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.nom}>{item.nom}</Text>
        <Text style={styles.address}>{item.address}</Text>
        {item.phone && <Text style={styles.phone}>📞 {item.phone}</Text>}
        {item.prix && <Text style={styles.prix}>{item.prix} FCFA / h</Text>}

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.btnMsg} 
            onPress={() => openChat(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.btnText}>💬 Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Chargement des parkings...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={parkings}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={parkings.length === 0 ? styles.emptyContainer : styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#007bff']}
          tintColor={'#007bff'}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucun parking disponible</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 12,
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  nom: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  prix: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '600',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  btnMsg: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#007bff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default ParkingListScreen;