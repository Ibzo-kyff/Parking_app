import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { getMarques } from '../../components/services/accueil'; // ✅ ton service backend

type Marque = {
  id: string | number;
  name: string;
  image: string; // URL de l’image venant du backend
};

export default function TousLesMarques() {
  const [marques, setMarques] = useState<Marque[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarques = async () => {
      try {
        const data = await getMarques(); // Appel backend
        setMarques(data);
      } catch (error) {
        console.error("Erreur lors du chargement des marques :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarques();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="orange" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Toutes les Marques</Text>
      <FlatList
        data={marques}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.text}>{item.name}</Text>
          </View>
        )}
        numColumns={2} // ✅ affichage en grille 2 colonnes
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  item: { flex: 1, margin: 8, alignItems: 'center' },
  image: { width: 100, height: 100, resizeMode: 'contain', borderRadius: 10 },
  text: { marginTop: 5, fontSize: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
