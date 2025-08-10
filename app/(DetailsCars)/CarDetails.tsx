import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

const carImage = require('../../assets/images/toyota1.png');

interface CarDetails {
  brand: string;
  year: number;
  mileage: string;
  fuel: string;
  transmission: string;
  color: string;
  power: string;
}

const carData: CarDetails = {
  brand: 'Toyota',
  year: 2020,
  mileage: '30000 km',
  fuel: 'Diesel',
  transmission: 'Automatique',
  color: 'Blanc',
  power: '250 ch',
};

const CarDetailScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.imageContainer}>
          <Image source={carImage} style={styles.carImage} resizeMode="cover" />
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.carName}>Prado 4X4</Text>
          <Text style={styles.price}>
            Prix: <Text style={styles.priceValue}>55 Millions FCFA</Text>
          </Text>
          <TouchableOpacity style={styles.reserveButton}>
            <Text style={styles.reserveButtonText}>Réserver</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featuresContainer}>
          {[
            { icon: 'car', label: 'Marque', value: carData.brand, IconComp: FontAwesome5 },
            { icon: 'calendar-alt', label: 'Année', value: carData.year, IconComp: FontAwesome5 },
            { icon: 'speedometer', label: 'Kilométrage', value: carData.mileage, IconComp: MaterialCommunityIcons },
            { icon: 'gas-station', label: 'Carburant', value: carData.fuel, IconComp: MaterialCommunityIcons },
            { icon: 'exchange-alt', label: 'Transmission', value: carData.transmission, IconComp: FontAwesome5 },
            { icon: 'fill-drip', label: 'Couleur', value: carData.color, IconComp: FontAwesome5 },
            { icon: 'engine', label: 'Puissance', value: carData.power, IconComp: MaterialCommunityIcons },
          ].map(({ icon, label, value, IconComp }) => (
            <View style={styles.featureItem} key={label}>
              <IconComp name={icon} size={24} color="#555" style={styles.icon} />
              <Text style={styles.featureLabel}>{label}:</Text>
              <Text style={styles.featureValue}>{value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#e1e4dfff' },
  scrollView: { flex: 1 },

  imageContainer: {
    width: '100%',
    height: 230,
  },
  carImage: {
    width: '100%',
    height: '100%',
    marginTop: 20, // ✅ Décalage de l’image vers le bas
  },

  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },

  carName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  price: { fontSize: 16, color: '#666' },
  priceValue: { fontSize: 20, fontWeight: 'bold', color: '#FF6F00' },

  reserveButton: {
    marginTop: 15,
    alignSelf: 'flex-end',
    backgroundColor: '#FF6F00',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  reserveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  featuresContainer: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  icon: { marginRight: 15, width: 30, textAlign: 'center' },
  featureLabel: { fontSize: 16, color: '#555', flex: 1 },
  featureValue: { fontSize: 16, fontWeight: '600', color: '#333' },
});

export default CarDetailScreen;
