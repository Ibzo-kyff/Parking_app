import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("loginScreen");
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Fond avec cercles décoratifs */}
      <View style={styles.circlesContainer}>
        <View style={styles.topCircle} />
        <View style={styles.bottomCircle} />
      </View>

      <Animatable.View animation="fadeInUp" duration={3000} style={styles.centerContent}>
        <Image 
          source={require('../assets/images/park.png')} 
          style={styles.logo}
        />
      </Animatable.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circlesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  topCircle: {
    position: 'absolute',
    top: -height * 0.2,
    right: -width * 0.2,
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: '#FDB913',
    borderBottomLeftRadius: width * 0.3,
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -height * 0.2,
    left: -width * 0.2,
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: '#FDB913',
    borderTopRightRadius: width * 0.3,
  },
  centerContent: {
    alignItems: 'center',
  },
  logo: {
    width: 700,
    height: 700,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#333',
    marginTop: 4,
  },
});

export default SplashScreen;
