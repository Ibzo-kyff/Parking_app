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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";

const fuelOptions = ["ESSENCE", "DIESEL", "ELECTRIQUE", "HYBRIDE"];

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
  const [assurance, setAssurance] = useState("");
  const [dureeAssurance, setDureeAssurance] = useState("");
  const [carteGrise, setCarteGrise] = useState("");
  const [vignette, setVignette] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

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

  // Charger rôle / IDs depuis AsyncStorage automatiquement
  useEffect(() => {
  const loadOwnerFromStorage = async () => {
    try {
      const role = await AsyncStorage.getItem("role");
      setRoleLoaded(role);

      if (role === "PARKING") {
        const pid = await AsyncStorage.getItem("parkingId");
        if (pid) setParkingId(pid);
      }

      if (role === "CLIENT") {
        const uid = await AsyncStorage.getItem("userId");
        if (uid) setUserOwnerId(uid);
      }
    } catch (err) {
      console.warn("Erreur chargement AsyncStorage", err);
    }
  };

  loadOwnerFromStorage();
}, []);


  const handleSubmit = async () => {
    if (!marque || !model || !prix) {
      return Alert.alert("Erreur", "Veuillez remplir marque, modèle et prix");
    }
    if (!parkingId && !userOwnerId) {
      return Alert.alert(
        "Erreur",
        "Vous devez renseigner soit un Parking ID, soit un User ID"
      );
    }
    if (parkingId && userOwnerId) {
      return Alert.alert(
        "Erreur",
        "Vous ne pouvez pas renseigner à la fois Parking ID et User ID"
      );
    }

    try {
      const formData = new FormData();
      formData.append("marque", marque);
      formData.append("model", model);
      formData.append("prix", prix);
      formData.append("description", description || "");
      formData.append("fuelType", fuelType);
      formData.append("mileage", mileage || "0");
      formData.append("garantie", garantie ? "true" : "false");
      formData.append("dureeGarantie", dureeGarantie || "0");
      formData.append("chauffeur", chauffeur ? "true" : "false");
      formData.append("assurance", assurance || "");
      formData.append("dureeAssurance", dureeAssurance || "0");
      formData.append("carteGrise", carteGrise || "");
      formData.append("vignette", vignette || "");
      if (parkingId) formData.append("parkingId", parkingId);
      if (userOwnerId) formData.append("userOwnerId", userOwnerId);

      photos.forEach((uri, index) => {
        const filename = uri.split("/").pop();
        const fileType = filename?.split(".").pop();
        formData.append("photos", {
          uri,
          name: filename || `photo_${index}.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      });

      const response = await fetch("http://192.168.1.4:5000/api/vehicules", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Succès ✅", "Véhicule créé avec succès");
        // reset form
        setMarque("");
        setModel("");
        setPrix("");
        setDescription("");
        setFuelType("ESSENCE");
        setMileage("");
        setParkingId("");
        setUserOwnerId("");
        setGarantie(false);
        setDureeGarantie("");
        setChauffeur(false);
        setAssurance("");
        setDureeAssurance("");
        setCarteGrise("");
        setVignette("");
        setPhotos([]);
      } else {
        Alert.alert("Erreur ❌", data.error || "Impossible de créer le véhicule");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur serveur", "Vérifie ton backend ou ta connexion");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.formCard}>
            <Text style={styles.title}>Créer un véhicule</Text>

            {/* Images */}
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

            {/* Inputs */}
            <TextInput style={styles.input} placeholder="Marque" value={marque} onChangeText={setMarque} />
            <TextInput style={styles.input} placeholder="Modèle" value={model} onChangeText={setModel} />
            <TextInput style={styles.input} placeholder="Prix" value={prix} onChangeText={setPrix} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
            
            {/* Picker fuelType */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Type de carburant :</Text>
              <Picker selectedValue={fuelType} onValueChange={setFuelType} style={styles.picker}>
                {fuelOptions.map((fuel) => (
                  <Picker.Item key={fuel} label={fuel} value={fuel} />
                ))}
              </Picker>
            </View>

            <TextInput style={styles.input} placeholder="Kilométrage" value={mileage} onChangeText={setMileage} keyboardType="numeric" />
            {/* If role isn't loaded yet let user type IDs. Once role is loaded we hide the inputs
                because the correct ID (parkingId or userOwnerId) is auto-filled from AsyncStorage
                and will still be sent with the form. We show a small read-only note instead. */}
            {roleLoaded === null ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Parking ID"
                  value={parkingId}
                  onChangeText={setParkingId}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="User Owner ID"
                  value={userOwnerId}
                  onChangeText={setUserOwnerId}
                  keyboardType="numeric"
                />
              </>
            ) : (
              <Text style={{ marginBottom: 10, color: '#666' }}>
                Identifiant utilisé : {roleLoaded === 'PARKING' ? `Parking ID ${parkingId || '(non défini)'}` : `User ID ${userOwnerId || '(non défini)'}`}
              </Text>
            )}

            {/* Switches */}
            <View style={styles.switchRow}>
              <Text>Garantie</Text>
              <Switch value={garantie} onValueChange={setGarantie} />
            </View>
            <TextInput style={styles.input} placeholder="Durée garantie (mois)" value={dureeGarantie} onChangeText={setDureeGarantie} keyboardType="numeric" />

            <View style={styles.switchRow}>
              <Text>Chauffeur</Text>
              <Switch value={chauffeur} onValueChange={setChauffeur} />
            </View>
            <TextInput style={styles.input} placeholder="Assurance" value={assurance} onChangeText={setAssurance} />
            <TextInput style={styles.input} placeholder="Durée assurance (mois)" value={dureeAssurance} onChangeText={setDureeAssurance} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Carte Grise" value={carteGrise} onChangeText={setCarteGrise} />
            <TextInput style={styles.input} placeholder="Vignette" value={vignette} onChangeText={setVignette} />

            {/* Submit */}
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddVehicleForm;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f4f4" },
  scrollView: { flex: 1 },
  formCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    margin: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#333", textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 16, backgroundColor: "#fafafa" },
  button: { backgroundColor: "#FF6F00", paddingVertical: 15, borderRadius: 25, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  imagePicker: { height: 150, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, marginBottom: 15, justifyContent: "center", alignItems: "center", backgroundColor: "#fafafa" },
  imagePickerText: { color: "#888", fontSize: 16 },
  previewImage: { width: 100, height: 100, borderRadius: 10, marginRight: 10 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  pickerContainer: { marginBottom: 15 },
  pickerLabel: { fontSize: 16, marginBottom: 5 },
  picker: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, backgroundColor: "#fafafa" },
});