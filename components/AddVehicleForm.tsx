import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from '../context/AuthContext';
import { router } from "expo-router";
import { apiService } from '../components/services/addVehiculeApi';

// Constantes pour les options
const FUEL_OPTIONS = ["ESSENCE", "DIESEL", "ELECTRIQUE", "HYBRIDE"];
const DURATION_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

// Constantes pour les styles
const COLORS = {
  primary: "#FF6F00",
  background: "#f4f4f4",
  card: "#FFF",
  text: "#333",
  placeholder: "#888",
  border: "#ddd",
  shadow: "#000",
  inputBackground: "#fafafa",
};

const SIZES = {
  fontTitle: 22,
  fontLabel: 16,
  fontButton: 16,
  padding: 12,
  margin: 15,
  borderRadius: 10,
  buttonRadius: 25,
  shadowRadius: 5,
  imageSize: 100,
  imagePickerHeight: 150,
};

const SHADOW = {
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: SIZES.shadowRadius,
  elevation: 5,
};

const AddVehicleForm: React.FC = () => {
  const [marque, setMarque] = useState("");
  const [model, setModel] = useState("");
  const [prix, setPrix] = useState("");
  const [description, setDescription] = useState("");
  const [fuelType, setFuelType] = useState("ESSENCE");
  const [mileage, setMileage] = useState("");
  const [parkingId, setParkingId] = useState("");
  const [userOwnerId, setUserOwnerId] = useState("");
  const [roleLoaded, setRoleLoaded] = useState<string | null>(null);
  const [garantie, setGarantie] = useState(false);
  const [dureeGarantie, setDureeGarantie] = useState("");
  const [chauffeur, setChauffeur] = useState(false);
  const [assurance, setAssurance] = useState(false);
  const [dureeAssurance, setDureeAssurance] = useState("");
  const [carteGrise, setCarteGrise] = useState(false);
  const [vignette, setVignette] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const { authState, setAuthState } = useAuth();

  // Sélection des images
  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setPhotos(uris);
    }
  };

  // Charger les informations de l'utilisateur
  useEffect(() => {
    const loadUserData = async () => {
      if (authState.userId && authState.role === "CLIENT") {
        console.warn("Utilisation des données authState pour CLIENT :", { userId: authState.userId });
        setUserOwnerId(authState.userId);
        setParkingId("");
        setRoleLoaded("CLIENT");
        return;
      } else if (authState.parkingId && authState.role === "PARKING") {
        console.warn("Utilisation des données authState pour PARKING :", { parkingId: authState.parkingId });
        setParkingId(authState.parkingId);
        setUserOwnerId("");
        setRoleLoaded("PARKING");
        return;
      }

      if (!authState.accessToken) {
        console.warn("Token d'accès manquant dans authState");
        Alert.alert("Erreur", "Token d'accès manquant. Veuillez vous reconnecter.");
        router.push('/(auth)/LoginScreen');
        return;
      }

      const { data, error } = await apiService.getUserInfo(authState.accessToken);
      if (error) {
        console.warn("Erreur lors de la récupération des données utilisateur :", error);
        Alert.alert("Erreur", error);
        router.push('/(auth)/LoginScreen');
        return;
      }

      console.warn("Données utilisateur récupérées :", JSON.stringify(data));
      if (!data.id || !data.role) {
        console.warn("Données manquantes dans la réponse API :", data);
        Alert.alert("Erreur", "Données utilisateur incomplètes.");
        router.push('/(auth)/LoginScreen');
        return;
      }

      setRoleLoaded(data.role);
      if (data.role === "CLIENT") {
        setUserOwnerId(String(data.id));
        setParkingId("");
        console.warn("CLIENT défini - userOwnerId :", data.id);
      } else if (data.role === "PARKING") {
        if (!data.parkingId) {
          console.warn("parkingId manquant pour utilisateur PARKING :", data);
          Alert.alert("Erreur", "Aucun parking associé à cet utilisateur.");
          router.push('/(auth)/LoginScreen');
          return;
        }
        setParkingId(String(data.parkingId));
        setUserOwnerId("");
        console.warn("PARKING défini - parkingId :", data.parkingId);
      }
    };

    loadUserData();
  }, [authState.accessToken, authState.userId, authState.role, authState.parkingId]);

  // Soumission du formulaire
  const handleSubmit = async () => {
    console.warn("Submit déclenché - Données envoyées :", {
      parkingId,
      userOwnerId,
      marque,
      model,
      prix,
      description,
      fuelType,
      mileage,
      garantie,
      dureeGarantie,
      chauffeur,
      assurance,
      dureeAssurance,
      carteGrise,
      vignette,
      photos,
    });

    if (!marque || !model || !prix) {
      return Alert.alert("Erreur", "Veuillez remplir marque, modèle et prix.");
    }
    if (!parkingId && !userOwnerId) {
      return Alert.alert("Erreur", "Vous devez renseigner soit un Parking ID, soit un User ID.");
    }
    if (parkingId && userOwnerId) {
      return Alert.alert("Erreur", "Vous ne pouvez pas renseigner à la fois Parking ID et User ID.");
    }
    if (garantie && !dureeGarantie) {
      return Alert.alert("Erreur", "Veuillez sélectionner une durée de garantie.");
    }
    if (assurance && !dureeAssurance) {
      return Alert.alert("Erreur", "Veuillez sélectionner une durée d'assurance.");
    }
    if (isNaN(Number(prix))) {
      return Alert.alert("Erreur", "Le prix doit être un nombre valide.");
    }

    const formData = new FormData();
    formData.append("marque", marque);
    formData.append("model", model);
    formData.append("prix", prix);
    formData.append("description", description || "");
    formData.append("fuelType", fuelType);
    formData.append("mileage", mileage || "0");
    formData.append("garantie", garantie.toString());
    formData.append("dureeGarantie", garantie ? dureeGarantie || "0" : "0");
    formData.append("chauffeur", chauffeur.toString());
    formData.append("assurance", assurance.toString());
    formData.append("dureeAssurance", assurance ? dureeAssurance || "0" : "0");
    formData.append("carteGrise", carteGrise.toString());
    formData.append("vignette", vignette.toString());
    if (parkingId) formData.append("parkingId", parkingId);
    if (userOwnerId) formData.append("userOwnerId", userOwnerId);

  for (let i = 0; i < photos.length; i++) {
  const uri = photos[i];
  const filename = uri.split("/").pop() || `photo_${i}.jpg`;
  const ext = filename.split(".").pop();
  const type = ext ? `image/${ext}` : `image/jpeg`;

  // Important : envoyer un objet { uri, type, name }
  formData.append("photos", {
    uri,
    name: filename,
    type,
  } as any);
}

    const { data, error } = await apiService.createVehicle(formData, authState.accessToken || "");
    if (error) {
      console.warn("Erreur submit :", error);
      Alert.alert("Erreur ❌", error);
      return;
    }

    Alert.alert("Succès ✅", "Véhicule créé avec succès");
    setMarque("");
    setModel("");
    setPrix("");
    setDescription("");
    setFuelType("ESSENCE");
    setMileage("");
    setGarantie(false);
    setDureeGarantie("");
    setChauffeur(false);
    setAssurance(false);
    setDureeAssurance("");
    setCarteGrise(false);
    setVignette(false);
    setPhotos([]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.formCard}>
            <Text style={styles.title}>Créer un véhicule</Text>

            {/* Sélecteur d'images */}
            <TouchableOpacity style={styles.imagePicker} onPress={pickImages}>
              {photos.length > 0 ? (
                <ScrollView horizontal>
                  {photos.map((uri, i) => (
                    <Image key={i} source={{ uri }} style={styles.previewImage} />
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.imagePickerText}>+ Ajouter des photos</Text>
              )}
            </TouchableOpacity>

            {/* Champs de texte */}
            <TextInput
              style={styles.input}
              placeholder="Marque"
              value={marque}
              onChangeText={setMarque}
              placeholderTextColor={COLORS.placeholder}
            />
            <TextInput
              style={styles.input}
              placeholder="Modèle"
              value={model}
              onChangeText={setModel}
              placeholderTextColor={COLORS.placeholder}
            />
            <TextInput
              style={styles.input}
              placeholder="Prix"
              value={prix}
              onChangeText={setPrix}
              keyboardType="numeric"
              placeholderTextColor={COLORS.placeholder}
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={COLORS.placeholder}
            />

            {/* Sélecteur de carburant */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Type de carburant :</Text>
              <Picker selectedValue={fuelType} onValueChange={setFuelType} style={styles.picker}>
                {FUEL_OPTIONS.map((fuel) => (
                  <Picker.Item key={fuel} label={fuel} value={fuel} />
                ))}
              </Picker>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Kilométrage"
              value={mileage}
              onChangeText={setMileage}
              keyboardType="numeric"
              placeholderTextColor={COLORS.placeholder}
            />

            {/* Interrupteurs */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Garantie</Text>
              <Switch
                value={garantie}
                onValueChange={(value) => {
                  setGarantie(value);
                  if (!value) setDureeGarantie("");
                }}
              />
            </View>
            {garantie && (
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Durée de garantie (mois) :</Text>
                <Picker
                  selectedValue={dureeGarantie}
                  onValueChange={setDureeGarantie}
                  style={styles.picker}
                >
                  <Picker.Item label="Sélectionner une durée" value="" />
                  {DURATION_OPTIONS.map((duration) => (
                    <Picker.Item key={duration} label={`${duration} mois`} value={duration} />
                  ))}
                </Picker>
              </View>
            )}

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Chauffeur</Text>
              <Switch value={chauffeur} onValueChange={setChauffeur} />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Assurance</Text>
              <Switch
                value={assurance}
                onValueChange={(value) => {
                  setAssurance(value);
                  if (!value) setDureeAssurance("");
                }}
              />
            </View>
            {assurance && (
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Durée d'assurance (mois) :</Text>
                <Picker
                  selectedValue={dureeAssurance}
                  onValueChange={setDureeAssurance}
                  style={styles.picker}
                >
                  <Picker.Item label="Sélectionner une durée" value="" />
                  {DURATION_OPTIONS.map((duration) => (
                    <Picker.Item key={duration} label={`${duration} mois`} value={duration} />
                  ))}
                </Picker>
              </View>
            )}

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Carte Grise</Text>
              <Switch value={carteGrise} onValueChange={setCarteGrise} />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Vignette</Text>
              <Switch value={vignette} onValueChange={setVignette} />
            </View>

            {/* Bouton de soumission */}
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.borderRadius,
    margin: SIZES.margin,
    padding: SIZES.margin,
    ...SHADOW,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.margin,
  },
  pickerContainer: {
    marginBottom: SIZES.margin,
  },
  imagePicker: {
    height: SIZES.imagePickerHeight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    marginBottom: SIZES.margin,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.inputBackground,
  },
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: "bold",
    marginBottom: SIZES.margin,
    color: COLORS.text,
    textAlign: "center",
  },
  pickerLabel: {
    fontSize: SIZES.fontLabel,
    marginBottom: 5,
    color: COLORS.text,
  },
  switchLabel: {
    fontSize: SIZES.fontLabel,
    color: COLORS.text,
  },
  imagePickerText: {
    color: COLORS.placeholder,
    fontSize: SIZES.fontLabel,
  },
  buttonText: {
    color: COLORS.card,
    fontSize: SIZES.fontButton,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.padding,
    marginBottom: SIZES.margin,
    fontSize: SIZES.fontLabel,
    backgroundColor: COLORS.inputBackground,
  },
  picker: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.inputBackground,
  },
  previewImage: {
    width: SIZES.imageSize,
    height: SIZES.imageSize,
    borderRadius: SIZES.borderRadius,
    marginRight: 10,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.buttonRadius,
    alignItems: "center",
    marginTop: 10,
  },
});

export default AddVehicleForm;