import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Switch,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

export default function CreateAnnonce() {
  // Simule utilisateur connecté avec rôle
  // role peut être "vendeur" ou "client"
  const utilisateurConnecte = {
    id: "user123",
    nom: "Jean Dupont",
    role: "vendeur", // "client" ou "vendeur"
  };

  // Champs du formulaire (sans parkingId ni userOwnerId visibles)
  const [marque, setMarque] = useState("");
  const [model, setModel] = useState("");
  const [prix, setPrix] = useState("");
  const [description, setDescription] = useState("");
  const [garantie, setGarantie] = useState(false);
  const [dureeGarantie, setDureeGarantie] = useState("");
  const [documents, setDocuments] = useState<string[]>([]);
  const [chauffeur, setChauffeur] = useState(false);
  const [assurance, setAssurance] = useState("");
  const [dureeAssurance, setDureeAssurance] = useState("");
  const [carteGrise, setCarteGrise] = useState("");
  const [vignette, setVignette] = useState("");
  const [status, setStatus] = useState("DISPONIBLE");
  const [fuelType, setFuelType] = useState("ESSENCE");
  const [mileage, setMileage] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const pickImages = async (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setter((prev) => [...prev, ...newImages]);
    }
  };

  const validateForm = () => {
    let newErrors: { [key: string]: string } = {};

    if (!marque.trim()) newErrors.marque = "La marque est obligatoire";
    if (!model.trim()) newErrors.model = "Le modèle est obligatoire";
    if (!prix.trim()) newErrors.prix = "Le prix est obligatoire";
    if (photos.length === 0) newErrors.photos = "Ajoutez au moins une photo";
    if (documents.length === 0) newErrors.documents = "Ajoutez au moins un document";
    if (!assurance.trim()) newErrors.assurance = "L'assurance est obligatoire";
    if (!carteGrise.trim()) newErrors.carteGrise = "La carte grise est obligatoire";
    if (!vignette.trim()) newErrors.vignette = "La vignette est obligatoire";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // Selon rôle, on prépare l'objet d'envoi différemment :
    let proprietaireData: { parkingId?: string; userOwnerId?: string } = {};

    if (utilisateurConnecte.role === "vendeur") {
      proprietaireData.parkingId = utilisateurConnecte.nom; // Nom utilisateur comme parkingId
    } else if (utilisateurConnecte.role === "client") {
      proprietaireData.userOwnerId = utilisateurConnecte.id; // id utilisateur comme userOwnerId
    }

    const dataToSend = {
      ...proprietaireData,
      marque: marque.trim(),
      model: model.trim(),
      prix: prix.trim(),
      description: description.trim() || null,
      garantie,
      dureeGarantie: garantie ? dureeGarantie.trim() : null,
      documents,
      chauffeur,
      assurance: assurance.trim(),
      dureeAssurance: assurance.trim() ? dureeAssurance.trim() : null,
      carteGrise: carteGrise.trim(),
      vignette: vignette.trim(),
      status,
      fuelType,
      mileage: mileage.trim() || null,
      photos,
    };

    console.log("Données envoyées :", dataToSend);

    Alert.alert("Succès", "Annonce envoyée !");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* PHOTOS */}
      <View style={styles.photoContainer}>
        {photos.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {photos.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.photo} resizeMode="cover" />
            ))}
          </ScrollView>
        ) : (
          <TouchableOpacity style={styles.addPhotoButton} onPress={() => pickImages(setPhotos)}>
            <Ionicons name="camera" size={40} color="#FF7F00" />
            <Text style={styles.addPhotoText}>Ajouter des photos</Text>
          </TouchableOpacity>
        )}
      </View>
      {errors.photos && <Text style={styles.error}>{errors.photos}</Text>}

      {/* MARQUE */}
      <Text style={styles.label}>Marque *</Text>
      <TextInput style={styles.input} value={marque} onChangeText={setMarque} placeholder="Marque" />
      {errors.marque && <Text style={styles.error}>{errors.marque}</Text>}

      {/* MODÈLE */}
      <Text style={styles.label}>Modèle *</Text>
      <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="Modèle" />
      {errors.model && <Text style={styles.error}>{errors.model}</Text>}

      {/* PRIX */}
      <Text style={styles.label}>Prix (€) *</Text>
      <TextInput
        style={styles.input}
        value={prix}
        onChangeText={setPrix}
        placeholder="Prix"
        keyboardType="numeric"
      />
      {errors.prix && <Text style={styles.error}>{errors.prix}</Text>}

      {/* DESCRIPTION (optionnelle) */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Description (optionnelle)"
        multiline
      />

      {/* GARANTIE */}
      <View style={styles.switchRow}>
        <Text style={styles.label}>Garantie</Text>
        <Switch value={garantie} onValueChange={setGarantie} />
      </View>
      {garantie && (
        <TextInput
          style={styles.input}
          value={dureeGarantie}
          onChangeText={setDureeGarantie}
          placeholder="Durée garantie (mois)"
          keyboardType="numeric"
        />
      )}

      {/* DOCUMENTS */}
      <Text style={styles.label}>Documents *</Text>
      <TouchableOpacity style={styles.addDocButton} onPress={() => pickImages(setDocuments)}>
        <Ionicons name="document-text" size={30} color="#FF7F00" />
        <Text style={styles.addPhotoText}>Ajouter documents</Text>
      </TouchableOpacity>
      {errors.documents && <Text style={styles.error}>{errors.documents}</Text>}

      {/* CHAUFFEUR */}
      <View style={styles.switchRow}>
        <Text style={styles.label}>Avec chauffeur</Text>
        <Switch value={chauffeur} onValueChange={setChauffeur} />
      </View>

      {/* ASSURANCE */}
      <Text style={styles.label}>Assurance *</Text>
      <TextInput
        style={styles.input}
        value={assurance}
        onChangeText={setAssurance}
        placeholder="Document assurance"
      />
      {errors.assurance && <Text style={styles.error}>{errors.assurance}</Text>}
      {assurance && (
        <TextInput
          style={styles.input}
          value={dureeAssurance}
          onChangeText={setDureeAssurance}
          placeholder="Durée assurance (mois)"
          keyboardType="numeric"
        />
      )}

      {/* CARTE GRISE */}
      <Text style={styles.label}>Carte grise *</Text>
      <TextInput
        style={styles.input}
        value={carteGrise}
        onChangeText={setCarteGrise}
        placeholder="Carte grise"
      />
      {errors.carteGrise && <Text style={styles.error}>{errors.carteGrise}</Text>}

      {/* VIGNETTE */}
      <Text style={styles.label}>Vignette *</Text>
      <TextInput
        style={styles.input}
        value={vignette}
        onChangeText={setVignette}
        placeholder="Vignette"
      />
      {errors.vignette && <Text style={styles.error}>{errors.vignette}</Text>}

      {/* STATUS */}
      <Text style={styles.label}>Statut</Text>
      <Picker selectedValue={status} onValueChange={(itemValue) => setStatus(itemValue)}>
        <Picker.Item label="Disponible" value="DISPONIBLE" />
        <Picker.Item label="En location" value="EN_LOCATION" />
        <Picker.Item label="Acheté" value="ACHETE" />
        <Picker.Item label="En maintenance" value="EN_MAINTENANCE" />
        <Picker.Item label="Indisponible" value="INDISPONIBLE" />
      </Picker>

      {/* CARBURANT */}
      <Text style={styles.label}>Type de carburant</Text>
      <Picker selectedValue={fuelType} onValueChange={(itemValue) => setFuelType(itemValue)}>
        <Picker.Item label="Essence" value="ESSENCE" />
        <Picker.Item label="Diesel" value="DIESEL" />
        <Picker.Item label="Électrique" value="ELECTRIQUE" />
        <Picker.Item label="Hybride" value="HYBRIDE" />
        <Picker.Item label="GPL" value="GPL" />
        <Picker.Item label="Autre" value="AUTRE" />
      </Picker>

      {/* KILOMÉTRAGE */}
      <TextInput
        style={styles.input}
        value={mileage}
        onChangeText={setMileage}
        placeholder="Kilométrage"
        keyboardType="numeric"
      />

      {/* BOUTON ENVOYER */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Envoyer</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#fff" },
  label: { fontSize: 16, marginBottom: 5, fontWeight: "bold" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 5 },
  photoContainer: { borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#ddd", alignItems: "center", height: 200, marginBottom: 10 },
  addPhotoButton: { alignItems: "center", justifyContent: "center" },
  addDocButton: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 10, marginBottom: 15 },
  addPhotoText: { marginTop: 5, fontSize: 14, color: "#FF7F00", fontWeight: "bold" },
  photo: { width: 300, height: 180, borderRadius: 10, marginRight: 10, backgroundColor: "#f0f0f0" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  submitButton: { backgroundColor: "#FF7F00", padding: 15, borderRadius: 8, marginTop: 20 },
  submitButtonText: { color: "#fff", fontSize: 18, textAlign: "center", fontWeight: "bold" },
  error: { color: "red", fontSize: 12, marginBottom: 10 },
});
