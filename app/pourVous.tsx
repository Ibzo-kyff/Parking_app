// screens/PourVous.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Car {
  id: string;
  profileImage: any;
  profileName: string;
  itemImage: any;
  itemName: string;
  itemPrice: string;
  brand: string;
  year: number;
  mileage: number;
  fuel: string;
  transmission: string;
  color: string;
  power: number;
  tankCapacity: number;
  doors: number;
  seats: number;
  consumption: number;
  equipment: string;
}

const cars: Car[] = [
  {
    id: '1',
    profileImage: require('../assets/images/carrousel1.png'),
    profileName: 'Keita business auto',
    itemImage: require('../assets/images/toyota1.png'),
    itemName: 'Prado 4X4',
    itemPrice: 'Prix: 55Millions FCFA',
    brand: 'Toyota',
    year: 2020,
    mileage: 30000,
    fuel: 'Diesel',
    transmission: 'Automatique',
    color: 'Blanc',
    power: 250,
    tankCapacity: 87,
    doors: 5,
    seats: 7,
    consumption: 8.5,
    equipment: 'Climatisation, GPS, Sièges chauffants',
  },
   {
    id: '2',
    profileImage: require('../assets/images/carrousel2.png'),
    profileName: 'Fofana business auto',
    itemImage: require('../assets/images/kia.png'),
    itemName: 'Kia',
    itemPrice: 'Prix: 75Millions FCFA',
    brand: 'Kia',
    year: 2021,
    mileage: 30000,
    fuel: 'Diesel',
    transmission: 'Automatique',
    color: 'Orange',
    power: 250,
    tankCapacity: 87,
    doors: 5,
    seats: 7,
    consumption: 8.5,
    equipment: 'Climatisation, GPS, Sièges chauffants',
  },
  {
    id: '3',
    profileImage: require('../assets/images/carrousel2.png'),
    profileName: 'Keita business auto',
    itemImage: require('../assets/images/kia.png'),
    itemName: 'Kia',
    itemPrice: 'Prix: 75Millions FCFA',
    brand: 'Kia',
    year: 2021,
    mileage: 30000,
    fuel: 'Diesel',
    transmission: 'Automatique',
    color: 'Orange',
    power: 250,
    tankCapacity: 87,
    doors: 5,
    seats: 7,
    consumption: 8.5,
    equipment: 'Climatisation, GPS, Sièges chauffants',
  },
  // Tu peux ajouter d'autres voitures ici
];

const PourVous: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  // ✅ Filtrage dynamique des voitures
  const filteredCars = cars.filter((car) =>
    car.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    car.profileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    car.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('(tabs)')}
        >
          <FontAwesome name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>Pour vous</Text>

        <View style={styles.searchBarContainer}>
          <FontAwesome name="search" size={24} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Recherche..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.sortButton} onPress={() => console.log('Tri activé')}>
            <FontAwesome name="sort" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {filteredCars.length > 0 ? (
          filteredCars.map((car) => (
            <View key={car.id} style={styles.itemContainer}>
              <View style={styles.profileContainer}>
                <Image source={car.profileImage} style={styles.profileImage} />
                <Text style={styles.profileName}>{car.profileName}</Text>
              </View>
              <View style={styles.itemDetailsContainer}>
                <Image source={car.itemImage} style={styles.itemImage} />
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemName}>{car.itemName}</Text>
                  <Text style={styles.itemPrice}>{car.itemPrice}</Text>

                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('Details', { item: car })}
                  >
                    <Text style={styles.buttonText}>Infos</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>Aucun résultat trouvé.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    marginTop: 0,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f3f3',
    borderColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 10,
    marginVertical: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
  },
  sortButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    backgroundColor: '#FD6A00',
    marginLeft: 10,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    borderColor: '#f5f5f5',
    borderWidth: 2,
    marginBottom: 20,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  itemDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 180,
    height: 130,
    borderRadius: 10,
    marginRight: 10,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 16,
    color: '#777',
    marginBottom: 5,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#FD6A00',
    borderRadius: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default PourVous;
