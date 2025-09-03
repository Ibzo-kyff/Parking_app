import React, { useEffect, useState } from 'react';
import { useRoute } from '@react-navigation/native';
import {StyleSheet,View,Text,Image,SafeAreaView,ScrollView,ActivityIndicator,} from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { getvehiculesById, vehicules } from '../components/services/vehicules';
function CarDetailScreen() {
  const route = useRoute<any>();
  const { id } = route.params;

  const [car, setCar] = useState<vehicules | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const data = await getvehiculesById(id);
        setCar(data);
      } catch (error) {
        console.error('Erreur récupération voiture :', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCar();
  }, [id]);

  if (loading) return <ActivityIndicator size="large" color="#FF6F00" />;

  if (!car) return <Text>Véhicule introuvable</Text>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        

        <View style={styles.detailsCard}>
          <Text style={styles.carName}>{car.marque} {car.model}</Text>
          <Text style={styles.price}>
            Prix: <Text style={styles.priceValue}>{car.prix} FCFA</Text>
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          {[
            { icon: 'car', label: 'Marque', value: car.marque, IconComp: FontAwesome5 },
            { icon: 'calendar-alt', label: 'Année', value: car.dureeGarantie || 'N/A', IconComp: FontAwesome5 },
            { icon: 'speedometer', label: 'Kilométrage', value: car.mileage ? `${car.mileage} km` : 'N/A', IconComp: MaterialCommunityIcons },
            { icon: 'gas-station', label: 'Carburant', value: car.fuelType, IconComp: MaterialCommunityIcons },
            { icon: 'file-contract', label: 'Carte Grise', value: car.carteGrise ? 'Disponible' : 'Non', IconComp: FontAwesome5 },
            { icon: 'shield-alt', label: 'Assurance', value: car.assurance ? 'Valide' : 'Non', IconComp: FontAwesome5 },
            { icon: 'id-card', label: 'Vignette', value: car.vignette ? 'Valide' : 'Non', IconComp: FontAwesome5 },
          ].map(({ icon, label, value, IconComp }) => (
            <View style={styles.featureItem} key={label}>
              <IconComp name={icon} size={22} color="#555" style={styles.icon} />
              <Text style={styles.featureLabel}>{label}:</Text>
              <Text style={styles.featureValue}>{value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1,
     backgroundColor: '#e1e4dfff' 

  },
  imageContainer: {
     width: '100%',
      height: 230
     },
  carImage: {
     width: '100%',
      height: '100%',
       marginTop: 20
       },
  detailsCard: {
     backgroundColor: '#FFF',
      borderRadius: 15,
       marginHorizontal: 20,
       marginTop: 20, 
       padding: 20,
        elevation: 8 
      },
  carName: { 
    fontSize: 24,
     fontWeight: 'bold', 
     color: '#333',
      marginBottom: 5
     },
  price: { 
    fontSize: 16,
     color: '#666'
     },
  priceValue: { 
    fontSize: 20, 
    fontWeight: 'bold',
     color: '#FF6F00'
     },
  featuresContainer: { 
    backgroundColor: '#FFF',
     borderRadius: 15, 
     margin: 20,
      padding: 20, 
      elevation: 8
     },
  featureItem: { 
    flexDirection: 'row',
     alignItems: 'center', 
     paddingVertical: 12, 
     borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#EEE' 
    },
  icon: {
     marginRight: 15,
      width: 30,
       textAlign: 'center'
       },
  featureLabel: {
     fontSize: 16,
      color: '#555',
       flex: 1 },
  featureValue: { 
    fontSize: 16,
     fontWeight: '600',
      color: '#333'
     },
});

export default CarDetailScreen;
