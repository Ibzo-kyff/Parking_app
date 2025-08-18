
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Header from '../Header';


 // ✅ ajout de l'import


interface ImageItem {
  source: any;
  name: string;
  price?: string;
}


type RootStackParamList = {
  Accueil: { firstName?: string; lastName?: string };
};


type AccueilRouteProp = RouteProp<RootStackParamList, 'Accueil'>;


const Accueil: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<AccueilRouteProp>();


  const { firstName, lastName } = route.params || {};


  const images: ImageItem[] = [
    { source: require('../../assets/images/mercede.png'), name: 'Mercedes' },
    { source: require('../../assets/images/kia.jpg'), name: 'Kia' },
    { source: require('../../assets/images/renault.png'), name: 'Renault' },
    { source: require('../../assets/images/toyota.jpg'), name: 'Toyota' },
    { source: require('../../assets/images/audi.png'), name: 'Audi' },
  ];


  const moreImages: ImageItem[] = [
    { source: require('../../assets/images/toyota1.png'), name: 'Prado 4X4', price: '55Millions FCFA' },
    { source: require('../../assets/images/kia.png'), name: 'KIA EV6-2022', price: '35Millions FCFA' },
    { source: require('../../assets/images/mercedesbenz.jpg'), name: 'Mercedes Benz', price: '30Millions FCFA' },
    { source: require('../../assets/images/mercedesgla.jpg'), name: 'Mercedes GLA', price: '30Millions FCFA' },
  ];


  const carouselImages = [
// ✅ StyleSheet pour le design
    { source: require('../../assets/images/carrousel1.png') },
    { source: require('../../assets/images/carrousel2.png') },
    { source: require('../../assets/images/carrousel3.jpg') },
    { source: require('../../assets/images/carrousel4.jpg') },
  ];


  const scrollViewRef = useRef<ScrollView>(null);
  const pourVousScrollRef = useRef<ScrollView>(null);


  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPourVousIndex, setCurrentPourVousIndex] = useState(0);


  useEffect(() => {
    const intervalId = setInterval(() => {
      const nextIndex = (currentIndex + 1) % carouselImages.length;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({ x: nextIndex * 300, animated: true });
    }, 3000);
    return () => clearInterval(intervalId);
  }, [currentIndex]);


  useEffect(() => {
    const intervalId = setInterval(() => {
      const nextIndex = (currentPourVousIndex + 1) % moreImages.length;
      setCurrentPourVousIndex(nextIndex);
      pourVousScrollRef.current?.scrollTo({ x: nextIndex * 180, animated: true });
    }, 3000);
    return () => clearInterval(intervalId);
  }, [currentPourVousIndex]);


  const handleImagePress = (index: number, type: string) => {
    console.log(`Pressed on ${type} image at index: ${index}`);
  };


  return (
    <View style={styles.container}>
      {/* ✅ Header avec nom et icône notification */}
      <Header firstName={firstName} lastName={lastName} />


      <View style={styles.searchBarContainer}>
        <FontAwesome name="search" size={24} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchBar}
          placeholder="Recherche..."
          placeholderTextColor="#999"
        />
        {/* <TouchableOpacity style={styles.sortButton}>
          <FontAwesome name="sort" size={24} color="#fff" />
        </TouchableOpacity> */}
      </View>


      {/* 🔁 Carousel */}
      <View style={styles.carouselContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          ref={scrollViewRef}
          style={styles.carouselScrollView}
          scrollEventThrottle={16}
          pagingEnabled
        >
          {carouselImages.map((item, index) => (
            <View key={index} style={styles.carouselItem}>
              <Image source={item.source} style={styles.carouselImage} />
            </View>
          ))}
        </ScrollView>
      </View>


      <View style={styles.scrollContainer}>
        <View style={styles.scrollSection}>
          <Text style={styles.scrollTitle}>Nos marques</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageScrollView}
            contentContainerStyle={styles.scrollViewContent}
          >
            {images.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.imageContainer}
                onPress={() => handleImagePress(index, 'first')}
              >
                <View style={styles.imageWrapper}>
                  <Image source={item.source} style={styles.scrollImage} />
                </View>
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageLabel}>{item.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>


          <View style={styles.scrollTitleContainer}>
            <Text style={styles.scrollTitle}>Pour vous</Text>
            <TouchableOpacity onPress={() => navigation.navigate('pourVous' as never)}>
              <Text style={styles.seeAllButton}>Voir tout</Text>
            </TouchableOpacity>
          </View>


          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            ref={pourVousScrollRef}
            style={styles.imageScrollView}
            contentContainerStyle={styles.scrollViewContent}
          >
            {moreImages.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.imageContainerLarge}
                onPress={() => handleImagePress(index, 'second')}
              >
                <View style={styles.imageWrapperLarge}>
                  <Image source={item.source} style={styles.scrollImageLarge} />
                </View>
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageLabel}>{item.name}</Text>
                  <Text style={styles.imagePrice}>{item.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};


// ... styles restent inchangés (tu les as déjà bien faits)




const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f3f3',
    padding: 20,
  },
  scrollViewContent: {
  flexGrow: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 10,
    marginVertical: 10,
    marginBottom: 20,
    marginTop: 25,
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
  carouselContainer: {
    height: 150,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  carouselScrollView: {
    flex: 1,
  },
  carouselItem: {
    width: 100,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  carouselImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  seeAllButton: {
    fontSize: 14,
    color: '#FD6A00',
    fontWeight: 'bold',
  },
  scrollContainer: {
    paddingBottom: 0,
    paddingTop: 20,
  },
  scrollSection: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    marginTop: -22,
  },
  scrollTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  scrollTitle: {
    fontSize: 18,
    color: 'black',
    fontWeight: 'bold',
  },
  imageScrollView: {
    marginTop: 0,
    marginBottom: 20,
  },
  imageContainer: {
    width: 100,
    padding: 5,
    marginTop: 10,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#F4F3F3',
  },
  imageContainerLarge: {
    width: 160,
    padding: 5,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#F4F3F3',
  },
  imageWrapper: {
    width: '100%',
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
  },
  imageWrapperLarge: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
  },
  scrollImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  scrollImageLarge: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
  },
  imageLabel: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  imagePrice: {
    color: '#000',
    fontSize: 12,
    marginTop: 2,
  },
});


export default Accueil;