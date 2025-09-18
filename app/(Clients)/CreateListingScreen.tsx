import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CarsDetails from '../../components/CarsDetails';
export default function ClientDetails() {
  return (
    <View style={styles.container}>
      <CarsDetails/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f3f3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    color: '#000',
  },
});
