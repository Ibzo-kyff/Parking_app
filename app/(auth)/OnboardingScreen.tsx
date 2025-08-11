import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get('window');

const OnboardingScreen = () => {
  const router = useRouter();

  useEffect(() => {
     const checkFirstLaunch = async () => {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (hasLaunched) {
        router.replace("(auth)/LoginScreen");
      } else {
        await AsyncStorage.setItem('hasLaunched', 'true');
      }
    };
    checkFirstLaunch();
  }, []);

  const handleLetsGo = () => {
    router.replace("(auth)/LoginScreen");
  };

  return (
    <View style={styles.container}>
      {/* Voiture qui arrive de la gauche */}
      <Animatable.View 
        animation={{
          from: { translateX: -width },
          to: { translateX: 0 }
        }}
        duration={1500}
        easing="ease-out-circ"
        style={styles.carContainer}
      >
        <Image 
          source={require('../../assets/images/pop.png')} 
          style={styles.carImage}
        />
      </Animatable.View>

      <Animatable.View 
        animation="fadeInUp" 
        duration={1000} 
        delay={800}
        style={styles.textContainer}
      >
        <Animatable.Text 
          animation="pulse" 
          duration={1500} 
          iterationCount="infinite"
          style={styles.title}
        >
          Bienvenue sur Mobility
        </Animatable.Text>
        
        <Animatable.Text 
          animation="slideInDown" 
          duration={800} 
          delay={200} 
          style={styles.subtitle}
        >
          Explorer vos voitures
        </Animatable.Text>
        
        <Animatable.Text 
          animation="fadeIn" 
          duration={1000} 
          delay={400} 
          style={styles.description}
        >
          Plongez dans l'aventure automobile avec des prix qui défient toute concurrence !
        </Animatable.Text>
        
        <Animatable.View 
          animation="bounceIn" 
          duration={1000} 
          delay={600}
          style={styles.buttonContainer}
        >
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLetsGo}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Commencer</Text>
          </TouchableOpacity>
        </Animatable.View>
      </Animatable.View>

      {/* Effet de poussière subtile - version corrigée */}
      <Animatable.View
        animation={{
          0: { opacity: 0, transform: [{ scale: 0 }] },
          0.5: { opacity: 0.3, transform: [{ scale: 1 }] },
          1: { opacity: 0, transform: [{ scale: 1.2 }] }
        }}
        duration={2000}
        iterationCount="infinite"
        style={styles.dustEffect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dda15e',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  carContainer: {
    width: width * 0.9,
    height: height * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    marginRight: width * -0.30,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginVertical: 5,
  },
  description: {
    fontSize: 16,
    color: '#f8edeb',
    textAlign: 'center',
    marginVertical: 10,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 30,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dda15e',
    letterSpacing: 0.5,
  },
  dustEffect: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    bottom: height * 0.2,
    right: width * 0.1,
  },
});

export default OnboardingScreen;