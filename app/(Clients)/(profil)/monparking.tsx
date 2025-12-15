import * as React from "react";
import { useAuth } from '../../../context/AuthContext';
import { getMyParking, updateParking } from "../../../components/services/parkingApi";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { router } from "expo-router";

export default function MonParking() {
  const { authState } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [parkingId, setParkingId] = React.useState<number | null>(null);
  const [name, setName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [city, setCity] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [capacity, setCapacity] = React.useState('');
  const [hoursOfOperation, setHoursOfOperation] = React.useState('');
  const [status, setStatus] = React.useState('ACTIVE');
  const [logo, setLogo] = React.useState('');
  const [imageError, setImageError] = React.useState(false);

  const scrollViewRef = React.useRef<ScrollView>(null);
  const emailInputRef = React.useRef<TextInput>(null);

  React.useEffect(() => {
    fetchParking();
  }, []);

  const fetchParking = async () => {
    try {
      setLoading(true);
      const data = await getMyParking(authState.accessToken!);
      setParkingId(data.id);
      setName(data.name || '');
      setAddress(data.address || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setCity(data.city || '');
      setDescription(data.description || '');
      setCapacity(data.capacity?.toString() || '0');
      setHoursOfOperation(data.hoursOfOperation || '');
      setStatus(data.status || 'ACTIVE');
      setLogo(data.logo || '');
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Impossible de charger les informations du parking");
    } finally {
      setLoading(false);
    }
  };

  const pickLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Accès à la galerie nécessaire');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets) {
        setLogo(result.assets[0].uri);
        setImageError(false);
      }
    } catch (err) {
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
    }
  };

  const handleSave = async () => {
    if (!parkingId) return;

    const data = {
      name,
      address,
      phone,
      email,
      city,
      description,
      capacity: parseInt(capacity) || 0,
      hoursOfOperation,
      status,
    };

    try {
      setUploading(true);
      const logoUri = logo && !logo.startsWith('http') ? logo : undefined;
      await updateParking(authState.accessToken!, parkingId, data, logoUri);
      Alert.alert("Succès", "Informations du parking mises à jour");
      fetchParking(); // Refresh
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Impossible de mettre à jour");
    } finally {
      setUploading(false);
    }
  };

  // Fonction pour gérer le focus sur les champs de texte
  const handleInputFocus = (inputName: string) => {
    // Défilement vers le bas pour les champs problématiques
    if (inputName === 'email' || inputName === 'description' || inputName === 'hours') {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 400, animated: true });
      }, 100);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff7d00" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.imageSection}>
          <View style={styles.imageContainer}>
            <TouchableOpacity 
              style={styles.imageTouchable} 
              onPress={pickLogo} 
              disabled={uploading}
            >
              {uploading ? (
                <View style={styles.imageLoading}>
                  <ActivityIndicator size="large" color="#ff7d00" />
                </View>
              ) : logo && !imageError ? (
                <Image
                  source={{ uri: logo }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={styles.placeholderContainer}>
                  <MaterialIcons name="photo-camera" size={40} color="#ff7d00" />
                  <Text style={styles.placeholderText}>Ajouter un logo</Text>
                  <Text style={styles.placeholderSubtext}>Appuyez pour sélectionner</Text>
                </View>
              )}
              <View style={styles.editIcon}>
                <Feather name="edit-2" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Informations du parking</Text>

          <View style={styles.form}>
            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <Text style={styles.inputLabel}>Nom du parking</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Entrez le nom"
                  onFocus={() => handleInputFocus('name')}
                />
              </View>

              <View style={[styles.inputContainer, styles.halfInput]}>
                <Text style={styles.inputLabel}>Capacité</Text>
                <TextInput
                  style={styles.input}
                  value={capacity}
                  onChangeText={setCapacity}
                  placeholder="Nombre de places"
                  keyboardType="numeric"
                  onFocus={() => handleInputFocus('capacity')}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Adresse</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Adresse complète"
                onFocus={() => handleInputFocus('address')}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <Text style={styles.inputLabel}>Ville</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Ville"
                  onFocus={() => handleInputFocus('city')}
                />
              </View>

              <View style={[styles.inputContainer, styles.halfInput]}>
                <Text style={styles.inputLabel}>Statut</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={status}
                    onValueChange={(itemValue) => setStatus(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label=" Actif" value="ACTIVE" />
                    <Picker.Item label=" Inactif" value="INACTIVE" />
                    <Picker.Item label=" Maintenance" value="MAINTENANCE" />
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <Text style={styles.inputLabel}>Téléphone</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Numéro de téléphone"
                  keyboardType="phone-pad"
                  onFocus={() => handleInputFocus('phone')}
                />
              </View>

              <View style={[styles.inputContainer, styles.halfInput]}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  ref={emailInputRef}
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="adresse@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onFocus={() => {
                    handleInputFocus('email');
                    // Focus spécifique pour l'email
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 450, animated: true });
                    }, 150);
                  }}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Horaires d'ouverture</Text>
              <TextInput
                style={styles.input}
                value={hoursOfOperation}
                onChangeText={setHoursOfOperation}
                placeholder="Ex: Lun-Ven 8h-19h, Sam 8h-12h"
                onFocus={() => handleInputFocus('hours')}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={description}
                onChangeText={setDescription}
                placeholder="Décrivez votre parking, services, tarifs..."
                multiline
                numberOfLines={4}
                onFocus={() => {
                  handleInputFocus('description');
                  // Défilement supplémentaire pour la description
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 500, animated: true });
                  }, 200);
                }}
                scrollEnabled={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, (uploading || loading) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={uploading || loading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Sauvegarder les modifications</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Espace supplémentaire en bas pour éviter que le clavier cache le contenu */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30, // Espace supplémentaire pour le défilement
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 16,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSection: {
    backgroundColor: "#1a1a1a",
    paddingBottom: 30,
  },
  imageContainer: {
    width: "100%",
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  imageTouchable: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#2d2d2d",
    justifyContent: "center",
    alignItems: "center",
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#ff7d00',
  },
  imageLoading: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    alignItems: "center",
    padding: 20,
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: "#ff7d00",
    fontWeight: "600",
    textAlign: 'center',
  },
  placeholderSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: "#999",
    textAlign: 'center',
  },
  editIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#ff7d00',
    borderRadius: 12,
    padding: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 25,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
    color: '#1a1a1a',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  saveButton: {
    backgroundColor: "#ff7d00",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  saveButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomSpacer: {
    height: 100, // Espace supplémentaire pour le clavier
  },
});