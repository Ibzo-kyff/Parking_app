import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';

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
    <LinearGradient
      colors={['#0F172A', '#1E293B', '#334155']}
      style={styles.container}
    >
      {/* Étoiles de fond animées */}
      <View style={styles.starsContainer}>
        {[...Array(15)].map((_, i) => (
          <Animatable.View
            key={i}
            animation={{
              from: { opacity: 0, transform: [{ scale: 0 }] },
              to: { opacity: 0.7, transform: [{ scale: 1 }] }
            }}
            duration={2000 + Math.random() * 2000}
            delay={Math.random() * 1000}
            iterationCount="infinite"
            direction="alternate"
            style={[
              styles.star,
              {
                top: Math.random() * height,
                left: Math.random() * width,
              }
            ]}
          />
        ))}
      </View>

      {/* Voiture avec effet de lueur */}
      <Animatable.View 
        animation={{
          from: { opacity: 0, transform: [{ translateX: -width }] },
          to: { opacity: 1, transform: [{ translateX: 0 }] }
        }}
        duration={1800}
        easing="ease-out-back"
        style={styles.carContainer}
      >
        <Animatable.View
          animation={{
            from: { opacity: 0.1, transform: [{ scale: 0.9 }] },
            to: { opacity: 0.3, transform: [{ scale: 1.1 }] }
          }}
          duration={3000}
          iterationCount="infinite"
          direction="alternate"
          style={styles.glowEffect}
        />
        <Image 
          source={require('../../assets/images/pop.png')} 
          style={styles.carImage}
        />
      </Animatable.View>

      {/* Traces de pneu animées */}
      <Animatable.View
        animation={{
          from: { opacity: 0, transform: [{ translateX: -100 }] },
          to: { opacity: 0.3, transform: [{ translateX: 0 }] }
        }}
        duration={1500}
        delay={500}
        style={styles.tireTrack}
      />
      <Animatable.View
        animation={{
          from: { opacity: 0, transform: [{ translateX: -120 }] },
          to: { opacity: 0.3, transform: [{ translateX: -20 }] }
        }}
        duration={1500}
        delay={700}
        style={[styles.tireTrack, { top: height * 0.45 }]}
      />

      <Animatable.View 
        animation={{
          from: { opacity: 0, transform: [{ translateY: 100 }] },
          to: { opacity: 1, transform: [{ translateY: 0 }] }
        }}
        duration={1200}
        delay={1000}
        style={styles.contentContainer}
      >
        {/* Logo/Badge */}
        <Animatable.View
          animation={{
            from: { transform: [{ scale: 0 }, { rotate: '-180deg' }] },
            to: { transform: [{ scale: 1 }, { rotate: '0deg' }] }
          }}
          duration={1000}
          delay={1200}
          style={styles.logoBadge}
        >
          <Text style={styles.logoText}>M</Text>
        </Animatable.View>

        <Animatable.Text 
          animation={{
            from: { opacity: 0, transform: [{ translateY: -50 }] },
            to: { opacity: 1, transform: [{ translateY: 0 }] }
          }}
          duration={800}
          delay={300}
          style={styles.title}
        >
          <Text style={styles.titleAccent}>Bienvenue sur</Text>
          {'\n'}
          <Text style={styles.titleMain}>Mobility</Text>
        </Animatable.Text>
        
        <Animatable.Text 
          animation={{
            from: { opacity: 0 },
            to: { opacity: 1 }
          }}
          duration={1000}
          delay={500}
          style={styles.subtitle}
        >
          Explorez l'excellence automobile
        </Animatable.Text>
        
        <Animatable.Text 
          animation={{
            from: { opacity: 0 },
            to: { opacity: 1 }
          }}
          duration={1000}
          delay={700}
          style={styles.description}
        >
          Plongez dans l'aventure automobile avec des prix qui défient toute concurrence.
        </Animatable.Text>
        
        <Animatable.View 
          animation={{
            from: { transform: [{ scale: 0 }] },
            to: { transform: [{ scale: 1 }] }
          }}
          duration={1000}
          delay={1100}
          style={styles.buttonContainer}
        >
          <TouchableOpacity 
            style={styles.button}
            onPress={handleLetsGo}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FD6A00', '#FF8C42']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>Commencer l'aventure</Text>
              <Animatable.View
                animation={{
                  from: { transform: [{ translateX: -10 }] },
                  to: { transform: [{ translateX: 10 }] }
                }}
                duration={1000}
                iterationCount="infinite"
                direction="alternate"
                style={styles.buttonIcon}
              >
                <Text style={styles.icon}>→</Text>
              </Animatable.View>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>

      </Animatable.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  starsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    backgroundColor: '#FFF',
    borderRadius: 1.5,
  },
  carContainer: {
    position: 'absolute',
    top: height * 0.15,
    width: width * 1.2,
    height: height * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: 'rgba(253, 106, 0, 0.1)',
    borderRadius: width * 0.4,
  },
  carImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    transform: [{ scale: 1.1 }],
    marginRight: width * -0.2,
  },
  tireTrack: {
    position: 'absolute',
    top: height * 0.4,
    width: 150,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    transform: [{ skewX: '-20deg' }],
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 30,
    paddingBottom: 50,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FD6A00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FD6A00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  titleAccent: {
    color: '#CBD5E1',
    fontSize: 24,
  },
  titleMain: {
    color: '#FFF',
    fontSize: 42,
    fontWeight: '900',
    textShadowColor: 'rgba(253, 106, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#FD6A00',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  activeDot: {
    backgroundColor: '#FD6A00',
    transform: [{ scale: 1.3 }],
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 25,
  },
  button: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#FD6A00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 10,
  },
  icon: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  loginLink: {
    color: '#FD6A00',
    fontWeight: '600',
  },
});

export default OnboardingScreen;