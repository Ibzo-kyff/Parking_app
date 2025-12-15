// import React, { useState, useEffect } from "react";
// import {
//   StyleSheet,
//   View,
//   Text,
//   TextInput,
//   SafeAreaView,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
//   Image,
//   Switch,
//   KeyboardAvoidingView,
//   Platform,
//   ActivityIndicator,
// } from "react-native";
// import * as ImagePicker from "expo-image-picker";
// import { Picker } from "@react-native-picker/picker";
// import { useAuth } from '../context/AuthContext';
// import { router, useLocalSearchParams } from "expo-router";
// import { apiService } from '../components/services/addVehiculeApi';

// // Constantes pour les options
// const FUEL_OPTIONS = ["ESSENCE", "DIESEL", "ELECTRIQUE", "HYBRIDE"];
// const DURATION_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

// // Constantes pour les styles
// const COLORS = {
//   primary: "#FF6F00",
//   background: "#f4f4f4",
//   card: "#FFF",
//   text: "#333",
//   placeholder: "#888",
//   border: "#ddd",
//   shadow: "#000",
//   inputBackground: "#fafafa",
//   stepperActive: "#FF6F00",
//   stepperInactive: "#ccc",
// };

// const SIZES = {
//   fontTitle: 22,
//   fontLabel: 16,
//   fontButton: 16,
//   padding: 12,
//   margin: 15,
//   borderRadius: 10,
//   buttonRadius: 25,
//   shadowRadius: 5,
//   imageSize: 100,
//   imagePickerHeight: 150,
//   stepperCircle: 30,
// };

// const SHADOW = {
//   shadowColor: COLORS.shadow,
//   shadowOffset: { width: 0, height: 4 },
//   shadowOpacity: 0.1,
//   shadowRadius: SIZES.shadowRadius,
//   elevation: 5,
// };

// const AddVehicleForm: React.FC = () => {
//   const params = useLocalSearchParams();
//   const { vehicleToEdit, mode = 'add' } = params as { 
//     vehicleToEdit?: string; 
//     mode?: 'edit' | 'add' 
//   };

//   const [isInitializing, setIsInitializing] = useState(true);
//   const [step, setStep] = useState(1);
//   const [marque, setMarque] = useState("");
//   const [model, setModel] = useState("");
//   const [prix, setPrix] = useState("");
//   const [description, setDescription] = useState("");
//   const [fuelType, setFuelType] = useState("ESSENCE");
//   const [mileage, setMileage] = useState("");
//   const [forSale, setForSale] = useState(true);
//   const [forRent, setForRent] = useState(true);
//   const [parkingId, setParkingId] = useState("");
//   const [userOwnerId, setUserOwnerId] = useState("");
//   const [roleLoaded, setRoleLoaded] = useState<string | null>(null);
//   const [garantie, setGarantie] = useState(false);
//   const [dureeGarantie, setDureeGarantie] = useState("");
//   const [chauffeur, setChauffeur] = useState(false);
//   const [assurance, setAssurance] = useState(false);
//   const [dureeAssurance, setDureeAssurance] = useState("");
//   const [carteGrise, setCarteGrise] = useState(false);
//   const [vignette, setVignette] = useState(false);
//   const [photos, setPhotos] = useState<string[]>([]);
//   const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [editingVehicle, setEditingVehicle] = useState<any>(null);
//   const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

//   const { authState } = useAuth();

//   if (!authState) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//         <Text>Chargement de l'authentification...</Text>
//       </View>
//     );
//   }

//   // Charger les données du véhicule en mode édition
//   useEffect(() => {
//     const loadVehicleData = async () => {
//       if (mode === 'edit' && vehicleToEdit) {
//         try {
//           let vehicleData;
          
//           if (typeof vehicleToEdit === 'object') {
//             vehicleData = vehicleToEdit;
//           } else {
//             vehicleData = JSON.parse(vehicleToEdit as string);
//           }
          
//           setEditingVehicle(vehicleData);
          
//           console.log('🚗 Données véhicule reçues pour édition:', vehicleData);
          
//           if (vehicleData.marque) {
//             if (typeof vehicleData.marque === 'object') {
//               setMarque(vehicleData.marque.name || "");
//             } else {
//               setMarque(vehicleData.marque);
//             }
//           }
//           if (vehicleData.model) {
//             setModel(vehicleData.model);
//           }
//           if (vehicleData.prix) {
//             setPrix(vehicleData.prix.toString());
//           }
//           if (vehicleData.description) {
//             setDescription(vehicleData.description);
//           }
//           if (vehicleData.fuelType) {
//             setFuelType(vehicleData.fuelType);
//           }
//           if (vehicleData.mileage) {
//             setMileage(vehicleData.mileage.toString());
//           }
//           if (vehicleData.forSale !== undefined) {
//             setForSale(vehicleData.forSale);
//           }
//           if (vehicleData.forRent !== undefined) {
//             setForRent(vehicleData.forRent);
//           }
//           if (vehicleData.dureeGarantie) {
//             setGarantie(true);
//             setDureeGarantie(vehicleData.dureeGarantie.toString());
//           } else {
//             setGarantie(false);
//             setDureeGarantie("");
//           }
//           if (vehicleData.assurance !== undefined) {
//             setAssurance(vehicleData.assurance);
//           }
//           if (vehicleData.carteGrise !== undefined) {
//             setCarteGrise(vehicleData.carteGrise);
//           }
//           if (vehicleData.vignette !== undefined) {
//             setVignette(vehicleData.vignette);
//           }
//           if (vehicleData.photos) {
//             const photoUrls = Array.isArray(vehicleData.photos) 
//               ? vehicleData.photos 
//               : [vehicleData.photos];
//             setExistingPhotos(photoUrls.filter((photo: string) => photo && photo !== ""));
//           }
//         } catch (error) {
//           console.error('Erreur parsing vehicle data:', error);
//           Alert.alert("Erreur", "Impossible de charger les données du véhicule");
//         }
//       }
//     };

//     loadVehicleData();
//   }, [mode, vehicleToEdit]);

//   // Charger les informations de l'utilisateur
//   const loadUserData = async () => {
//     if (authState.userId && authState.role === "CLIENT") {
//       setUserOwnerId(authState.userId);
//       setParkingId("");
//       setRoleLoaded("CLIENT");
//       return;
//     } else if (authState.parkingId && authState.role === "PARKING") {
//       setParkingId(authState.parkingId);
//       setUserOwnerId("");
//       setRoleLoaded("PARKING");
//       return;
//     }

//     if (!authState.accessToken) {
//       Alert.alert("Erreur", "Token d'accès manquant. Veuillez vous reconnecter.");
//       router.push('/(auth)/LoginScreen');
//       return;
//     }

//     try {
//       const { data, error } = await apiService.getUserInfo(authState.accessToken);
//       if (error) {
//         Alert.alert("Erreur", error);
//         router.push('/(auth)/LoginScreen');
//         return;
//       }

//       setRoleLoaded(data.role);
//       if (data.role === "CLIENT") {
//         setUserOwnerId(String(data.id));
//         setParkingId("");
//       } else if (data.role === "PARKING") {
//         if (!data.parkingId) {
//           Alert.alert("Erreur", "Aucun parking associé à cet utilisateur.");
//           router.push('/(auth)/LoginScreen');
//           return;
//         }
//         setParkingId(String(data.parkingId));
//         setUserOwnerId("");
//       }
//     } catch (error) {
//       console.error('Erreur chargement user info:', error);
//       Alert.alert("Erreur", "Impossible de charger les informations utilisateur");
//     }
//   };

//   // Initialisation complète
//   useEffect(() => {
//     const initialize = async () => {
//       try {
//         await loadUserData();
//       } catch (error) {
//         console.error('Erreur initialisation:', error);
//       } finally {
//         setIsInitializing(false);
//       }
//     };

//     initialize();
//   }, [authState.accessToken, authState.userId, authState.role, authState.parkingId]);

//   // Sélection des images
//   const pickImages = async () => {
//     try {
//       const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à vos photos.');
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsMultipleSelection: true,
//         quality: 0.7,
//         selectionLimit: 10 - (existingPhotos.length + photos.length),
//       });

//       if (!result.canceled && result.assets.length > 0) {
//         const uris = result.assets.map((asset) => asset.uri);
//         const totalPhotos = existingPhotos.length + photos.length + uris.length;
        
//         if (totalPhotos > 10) {
//           Alert.alert("Limite atteinte", "Vous ne pouvez pas ajouter plus de 10 photos.");
//           return;
//         }
        
//         setPhotos(prev => [...prev, ...uris]);
//         if (formErrors.photos) {
//           setFormErrors(prev => ({...prev, photos: ''}));
//         }
//       }
//     } catch (error) {
//       console.error('Erreur sélection images:', error);
//       Alert.alert("Erreur", "Impossible de sélectionner les images");
//     }
//   };

//   // Supprimer une photo
//   const removePhoto = (index: number, isExisting: boolean = false) => {
//     if (isExisting) {
//       setExistingPhotos(prev => prev.filter((_, i) => i !== index));
//     } else {
//       setPhotos(prev => prev.filter((_, i) => i !== index));
//     }
//   };

//   // Validation de l'étape 1
//   const validateStep1 = () => {
//     const errors: {[key: string]: string} = {};
    
//     if (!marque.trim()) {
//       errors.marque = "La marque est requise";
//     }
//     if (!model.trim()) {
//       errors.model = "Le modèle est requis";
//     }
//     if (!prix.trim()) {
//       errors.prix = "Le prix est requis";
//     } else if (isNaN(Number(prix)) || Number(prix) <= 0) {
//       errors.prix = "Le prix doit être un nombre valide supérieur à 0";
//     }
//     if (!forSale && !forRent) {
//       errors.disponibilite = "Le véhicule doit être destiné à au moins une option : vente ou location";
//     }
//     if (mileage && (isNaN(Number(mileage)) || Number(mileage) < 0)) {
//       errors.mileage = "Le kilométrage doit être un nombre valide";
//     }
//     if (photos.length === 0 && existingPhotos.length === 0) {
//       errors.photos = "Au moins une photo est requise";
//     }

//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   // Validation de l'étape 2
//   const validateStep2 = () => {
//     const errors: {[key: string]: string} = {};
    
//     if (garantie && !dureeGarantie) {
//       errors.dureeGarantie = "Veuillez sélectionner une durée de garantie";
//     }
//     if (assurance && !dureeAssurance) {
//       errors.dureeAssurance = "Veuillez sélectionner une durée d'assurance";
//     }

//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   // Navigation vers l'étape suivante
//   const handleNext = () => {
//     if (step === 1 && validateStep1()) {
//       setStep(2);
//     }
//   };

//   // Navigation vers l'étape précédente
//   const handleBack = () => {
//     setStep(1);
//     setFormErrors({});
//   };

//   // Fonction pour formater les données du véhicule
//   const formatVehicleData = () => {
//     const baseData = {
//       marque: marque.trim(),
//       model: model.trim(),
//       prix: Number(prix),
//       description: description.trim() || "",
//       fuelType: fuelType,
//       mileage: mileage ? Number(mileage) : 0,
//       forSale: forSale,
//       forRent: forRent,
//       garantie: garantie,
//       dureeGarantie: garantie ? Number(dureeGarantie) : 0,
//       chauffeur: chauffeur,
//       assurance: assurance,
//       dureeAssurance: assurance ? Number(dureeAssurance) : 0,
//       carteGrise: carteGrise,
//       vignette: vignette,
//     };

//     return {
//       ...baseData,
//       marqueRef: {
//         name: marque.trim(),
//         id: Date.now(),
//         isCustom: true
//       },
//       photos: [...existingPhotos, ...photos].filter(photo => photo && photo !== "")
//     };
//   };

//   // Soumission du formulaire
//   const handleSubmit = async () => {
//     if (!validateStep2()) return;

//     if (!authState?.accessToken) {
//       Alert.alert("Erreur", "Token d'accès manquant. Veuillez vous reconnecter.");
//       return;
//     }

//     if (!parkingId && !userOwnerId) {
//       Alert.alert("Erreur", "Impossible de déterminer le propriétaire du véhicule.");
//       return;
//     }

//     try {
//       setIsLoading(true);

//       const formData = new FormData();
      
//       const vehicleData = formatVehicleData();
      
//       formData.append("marque", vehicleData.marque);
//       formData.append("model", vehicleData.model);
//       formData.append("prix", vehicleData.prix.toString());
//       formData.append("description", vehicleData.description);
//       formData.append("fuelType", vehicleData.fuelType);
//       formData.append("mileage", vehicleData.mileage.toString());
//       formData.append("forSale", vehicleData.forSale.toString());
//       formData.append("forRent", vehicleData.forRent.toString());
//       formData.append("garantie", vehicleData.garantie.toString());
//       formData.append("dureeGarantie", vehicleData.dureeGarantie.toString());
//       formData.append("chauffeur", vehicleData.chauffeur.toString());
//       formData.append("assurance", vehicleData.assurance.toString());
//       formData.append("dureeAssurance", vehicleData.dureeAssurance.toString());
//       formData.append("carteGrise", vehicleData.carteGrise.toString());
//       formData.append("vignette", vehicleData.vignette.toString());
      
//       if (parkingId) formData.append("parkingId", parkingId);
//       if (userOwnerId) formData.append("userOwnerId", userOwnerId);

//       photos.forEach((uri, index) => {
//         if (uri && uri !== "") {
//           const filename = uri.split("/").pop() || `photo_${Date.now()}_${index}.jpg`;
//           const fileExtension = filename.split('.').pop()?.toLowerCase();
//           const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
          
//           formData.append("photos", {
//             uri: uri,
//             name: filename,
//             type: mimeType,
//           } as any);
//         }
//       });

//       if (mode === 'edit' && existingPhotos.length > 0) {
//         existingPhotos.forEach((photo, index) => {
//           if (photo && photo !== "") {
//             formData.append("existingPhotos", photo);
//           }
//         });
//       }

//       console.log('📤 Envoi des données véhicule:', vehicleData);
      
//       let result;
//       if (mode === 'edit' && editingVehicle?.id) {
//         const { data, error } = await apiService.updateVehicle(editingVehicle.id, formData, authState.accessToken);
//         if (error) throw new Error(error);
//         result = data;
//         Alert.alert("Succès ✅", "Véhicule modifié avec succès");
//       } else {
//         const { data, error } = await apiService.createVehicle(formData, authState.accessToken);
//         if (error) throw new Error(error);
//         result = data;
//         Alert.alert("Succès ✅", "Véhicule créé avec succès");
//         resetForm();
//       }

//       console.log('✅ Réponse API:', result);

//       setTimeout(() => {
//         if (mode === 'edit') {
//           router.back();
//         } else {
//           router.replace('/(tabs)/Accueil');
//         }
//       }, 1500);

//     } catch (error: any) {
//       console.error('❌ Erreur soumission:', error);
//       Alert.alert(
//         "Erreur ❌", 
//         error.message || "Une erreur est survenue lors de l'enregistrement"
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Réinitialiser le formulaire
//   const resetForm = () => {
//     setMarque("");
//     setModel("");
//     setPrix("");
//     setDescription("");
//     setFuelType("ESSENCE");
//     setMileage("");
//     setForSale(true);
//     setForRent(true);
//     setGarantie(false);
//     setDureeGarantie("");
//     setChauffeur(false);
//     setAssurance(false);
//     setDureeAssurance("");
//     setCarteGrise(false);
//     setVignette(false);
//     setPhotos([]);
//     setExistingPhotos([]);
//     setStep(1);
//     setFormErrors({});
//   };

//   // Rendu du stepper
//   const renderStepper = () => (
//     <View style={styles.stepperContainer}>
//       <View style={styles.stepperRow}>
//         <View style={[styles.stepperCircle, { backgroundColor: step >= 1 ? COLORS.stepperActive : COLORS.stepperInactive }]}>
//           <Text style={styles.stepperNumber}>1</Text>
//         </View>
//         <View style={styles.stepperLine} />
//         <View style={[styles.stepperCircle, { backgroundColor: step >= 2 ? COLORS.stepperActive : COLORS.stepperInactive }]}>
//           <Text style={styles.stepperNumber}>2</Text>
//         </View>
//       </View>
//       <View style={styles.stepperLabels}>
//         <Text style={styles.stepperLabel}>Informations de base</Text>
//         <Text style={styles.stepperLabel}>Options avancées</Text>
//       </View>
//     </View>
//   );

//   // Rendu des photos
//   const renderPhotos = () => {
//     const allPhotos = [...existingPhotos, ...photos];
//     const totalPhotos = allPhotos.length;
    
//     return (
//       <View style={styles.photosSection}>
//         <Text style={styles.sectionLabel}>
//           Photos ({totalPhotos}/10) {totalPhotos === 0 && "*"}
//         </Text>
//         <TouchableOpacity style={[
//           styles.imagePicker, 
//           formErrors.photos && styles.inputError
//         ]} onPress={pickImages}>
//           {totalPhotos > 0 ? (
//             <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//               <View style={styles.imagesContainer}>
//                 {existingPhotos.map((uri, i) => (
//                   <View key={`existing-${i}`} style={styles.imageContainer}>
//                     <Image source={{ uri }} style={styles.previewImage} />
//                     <TouchableOpacity 
//                       style={styles.deleteImageButton}
//                       onPress={() => removePhoto(i, true)}
//                     >
//                       <Text style={styles.deleteImageText}>×</Text>
//                     </TouchableOpacity>
//                     <Text style={styles.imageLabel}>Existante</Text>
//                   </View>
//                 ))}
//                 {photos.map((uri, i) => (
//                   <View key={`new-${i}`} style={styles.imageContainer}>
//                     <Image source={{ uri }} style={styles.previewImage} />
//                     <TouchableOpacity 
//                       style={styles.deleteImageButton}
//                       onPress={() => removePhoto(i, false)}
//                     >
//                       <Text style={styles.deleteImageText}>×</Text>
//                     </TouchableOpacity>
//                     <Text style={styles.imageLabel}>Nouvelle</Text>
//                   </View>
//                 ))}
//               </View>
//             </ScrollView>
//           ) : (
//             <View style={styles.emptyPhotos}>
//               <Text style={styles.imagePickerText}>+ Ajouter des photos</Text>
//               <Text style={styles.photoHint}>(Maximum 10 photos)</Text>
//             </View>
//           )}
//         </TouchableOpacity>
//         {formErrors.photos && (
//           <Text style={styles.errorText}>{formErrors.photos}</Text>
//         )}
//       </View>
//     );
//   };

//   // Rendu des erreurs de formulaire
//   const renderError = (field: string) => {
//     if (formErrors[field]) {
//       return <Text style={styles.errorText}>{formErrors[field]}</Text>;
//     }
//     return null;
//   };

//   // Afficher le loader d'initialisation
//   if (isInitializing) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//         <Text>Chargement du formulaire...</Text>
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
//         <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
//           <View style={styles.formCard}>
//             <Text style={styles.title}>
//               {mode === 'edit' ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
//             </Text>
            
//             {renderStepper()}

//             {step === 1 && (
//               <>
//                 {/* Étape 1: Informations de base */}
//                 {renderPhotos()}

//                 <Text style={styles.sectionLabel}>Informations générales *</Text>
                
//                 <View>
//                   <TextInput
//                     style={[styles.input, formErrors.marque && styles.inputError]}
//                     placeholder="Marque *"
//                     value={marque}
//                     onChangeText={(text) => {
//                       setMarque(text);
//                       if (formErrors.marque) {
//                         setFormErrors(prev => ({...prev, marque: ''}));
//                       }
//                     }}
//                     placeholderTextColor={COLORS.placeholder}
//                   />
//                   {renderError('marque')}
//                 </View>
                
//                 <View>
//                   <TextInput
//                     style={[styles.input, formErrors.model && styles.inputError]}
//                     placeholder="Modèle *"
//                     value={model}
//                     onChangeText={(text) => {
//                       setModel(text);
//                       if (formErrors.model) {
//                         setFormErrors(prev => ({...prev, model: ''}));
//                       }
//                     }}
//                     placeholderTextColor={COLORS.placeholder}
//                   />
//                   {renderError('model')}
//                 </View>
                
//                 <View>
//                   <TextInput
//                     style={[styles.input, formErrors.prix && styles.inputError]}
//                     placeholder="Prix (FCFA) *"
//                     value={prix}
//                     onChangeText={(text) => {
//                       setPrix(text);
//                       if (formErrors.prix) {
//                         setFormErrors(prev => ({...prev, prix: ''}));
//                       }
//                     }}
//                     keyboardType="numeric"
//                     placeholderTextColor={COLORS.placeholder}
//                   />
//                   {renderError('prix')}
//                 </View>
                
//                 <TextInput
//                   style={[styles.input, styles.textArea]}
//                   placeholder="Description"
//                   value={description}
//                   onChangeText={setDescription}
//                   placeholderTextColor={COLORS.placeholder}
//                   multiline
//                   numberOfLines={3}
//                   textAlignVertical="top"
//                 />

//                 <Text style={styles.sectionLabel}>Caractéristiques</Text>

//                 <View style={styles.pickerContainer}>
//                   <Text style={styles.pickerLabel}>Type de carburant</Text>
//                   <View style={styles.pickerWrapper}>
//                     <Picker
//                       selectedValue={fuelType}
//                       onValueChange={setFuelType}
//                       style={styles.picker}
//                       dropdownIconColor={COLORS.primary}
//                     >
//                       {FUEL_OPTIONS.map((fuel) => (
//                         <Picker.Item key={fuel} label={fuel} value={fuel} />
//                       ))}
//                     </Picker>
//                   </View>
//                 </View>

//                 <View>
//                   <TextInput
//                     style={[styles.input, formErrors.mileage && styles.inputError]}
//                     placeholder="Kilométrage"
//                     value={mileage}
//                     onChangeText={(text) => {
//                       setMileage(text);
//                       if (formErrors.mileage) {
//                         setFormErrors(prev => ({...prev, mileage: ''}));
//                       }
//                     }}
//                     keyboardType="numeric"
//                     placeholderTextColor={COLORS.placeholder}
//                   />
//                   {renderError('mileage')}
//                 </View>

//                 <Text style={styles.sectionLabel}>Disponibilités *</Text>

//                 <View style={styles.switchRow}>
//                   <Text style={styles.switchLabel}>Pour la vente</Text>
//                   <Switch 
//                     value={forSale} 
//                     onValueChange={setForSale}
//                     trackColor={{ false: '#767577', true: COLORS.primary }}
//                     thumbColor={forSale ? '#f5dd4b' : '#f4f3f4'}
//                   />
//                 </View>

//                 <View style={styles.switchRow}>
//                   <Text style={styles.switchLabel}>Pour la location</Text>
//                   <Switch 
//                     value={forRent} 
//                     onValueChange={setForRent}
//                     trackColor={{ false: '#767577', true: COLORS.primary }}
//                     thumbColor={forRent ? '#f5dd4b' : '#f4f3f4'}
//                   />
//                 </View>
//                 {renderError('disponibilite')}

//                 <TouchableOpacity 
//                   style={[styles.button, isLoading && styles.buttonDisabled]} 
//                   onPress={handleNext}
//                   disabled={isLoading}
//                 >
//                   {isLoading ? (
//                     <ActivityIndicator size="small" color="#FFF" />
//                   ) : (
//                     <Text style={styles.buttonText}>Suivant</Text>
//                   )}
//                 </TouchableOpacity>
//               </>
//             )}

//             {step === 2 && (
//               <>
//                 {/* Étape 2: Options avancées */}
//                 <Text style={styles.sectionLabel}>Options supplémentaires</Text>

//                 <View style={styles.switchRow}>
//                   <Text style={styles.switchLabel}>Garantie</Text>
//                   <Switch
//                     value={garantie}
//                     onValueChange={(value) => {
//                       setGarantie(value);
//                       if (!value) setDureeGarantie("");
//                       if (formErrors.dureeGarantie) {
//                         setFormErrors(prev => ({...prev, dureeGarantie: ''}));
//                       }
//                     }}
//                     trackColor={{ false: '#767577', true: COLORS.primary }}
//                     thumbColor={garantie ? '#f5dd4b' : '#f4f3f4'}
//                   />
//                 </View>
                
//                 {garantie && (
//                   <View style={styles.pickerContainer}>
//                     <Text style={styles.pickerLabel}>Durée de garantie (mois)</Text>
//                     <View style={[styles.pickerWrapper, formErrors.dureeGarantie && styles.inputError]}>
//                       <Picker
//                         selectedValue={dureeGarantie}
//                         onValueChange={(value) => {
//                           setDureeGarantie(value);
//                           if (formErrors.dureeGarantie) {
//                             setFormErrors(prev => ({...prev, dureeGarantie: ''}));
//                           }
//                         }}
//                         style={styles.picker}
//                         dropdownIconColor={COLORS.primary}
//                       >
//                         <Picker.Item label="Sélectionner une durée" value="" />
//                         {DURATION_OPTIONS.map((duration) => (
//                           <Picker.Item key={duration} label={`${duration} mois`} value={duration} />
//                         ))}
//                       </Picker>
//                     </View>
//                     {renderError('dureeGarantie')}
//                   </View>
//                 )}

//                 <View style={styles.switchRow}>
//                   <Text style={styles.switchLabel}>Chauffeur inclus</Text>
//                   <Switch 
//                     value={chauffeur} 
//                     onValueChange={setChauffeur}
//                     trackColor={{ false: '#767577', true: COLORS.primary }}
//                     thumbColor={chauffeur ? '#f5dd4b' : '#f4f3f4'}
//                   />
//                 </View>

//                 <View style={styles.switchRow}>
//                   <Text style={styles.switchLabel}>Assurance</Text>
//                   <Switch
//                     value={assurance}
//                     onValueChange={(value) => {
//                       setAssurance(value);
//                       if (!value) setDureeAssurance("");
//                       if (formErrors.dureeAssurance) {
//                         setFormErrors(prev => ({...prev, dureeAssurance: ''}));
//                       }
//                     }}
//                     trackColor={{ false: '#767577', true: COLORS.primary }}
//                     thumbColor={assurance ? '#f5dd4b' : '#f4f3f4'}
//                   />
//                 </View>
                
//                 {assurance && (
//                   <View style={styles.pickerContainer}>
//                     <Text style={styles.pickerLabel}>Durée d'assurance (mois)</Text>
//                     <View style={[styles.pickerWrapper, formErrors.dureeAssurance && styles.inputError]}>
//                       <Picker
//                         selectedValue={dureeAssurance}
//                         onValueChange={(value) => {
//                           setDureeAssurance(value);
//                           if (formErrors.dureeAssurance) {
//                             setFormErrors(prev => ({...prev, dureeAssurance: ''}));
//                           }
//                         }}
//                         style={styles.picker}
//                         dropdownIconColor={COLORS.primary}
//                       >
//                         <Picker.Item label="Sélectionner une durée" value="" />
//                         {DURATION_OPTIONS.map((duration) => (
//                           <Picker.Item key={duration} label={`${duration} mois`} value={duration} />
//                         ))}
//                       </Picker>
//                     </View>
//                     {renderError('dureeAssurance')}
//                   </View>
//                 )}

//                 <View style={styles.switchRow}>
//                   <Text style={styles.switchLabel}>Carte Grise</Text>
//                   <Switch 
//                     value={carteGrise} 
//                     onValueChange={setCarteGrise}
//                     trackColor={{ false: '#767577', true: COLORS.primary }}
//                     thumbColor={carteGrise ? '#f5dd4b' : '#f4f3f4'}
//                   />
//                 </View>

//                 <View style={styles.switchRow}>
//                   <Text style={styles.switchLabel}>Vignette</Text>
//                   <Switch 
//                     value={vignette} 
//                     onValueChange={setVignette}
//                     trackColor={{ false: '#767577', true: COLORS.primary }}
//                     thumbColor={vignette ? '#f5dd4b' : '#f4f3f4'}
//                   />
//                 </View>

//                 <View style={styles.navigationButtons}>
//                   <TouchableOpacity style={[styles.button, styles.backButton]} onPress={handleBack}>
//                     <Text style={styles.buttonText}>Précédent</Text>
//                   </TouchableOpacity>
                  
//                   <TouchableOpacity 
//                     style={[styles.button, isLoading && styles.buttonDisabled]} 
//                     onPress={handleSubmit}
//                     disabled={isLoading}
//                   >
//                     {isLoading ? (
//                       <ActivityIndicator size="small" color="#FFF" />
//                     ) : (
//                       <Text style={styles.buttonText}>
//                         {mode === 'edit' ? 'Modifier' : 'Enregistrer'}
//                       </Text>
//                     )}
//                   </TouchableOpacity>
//                 </View>
//               </>
//             )}
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },
//   container: {
//     flex: 1,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   formCard: {
//     backgroundColor: COLORS.card,
//     borderRadius: SIZES.borderRadius,
//     margin: SIZES.margin,
//     padding: SIZES.margin,
//     ...SHADOW,
//   },
//   title: {
//     fontSize: SIZES.fontTitle,
//     fontWeight: "bold",
//     marginBottom: SIZES.margin,
//     color: COLORS.text,
//     textAlign: "center",
//   },
//   sectionLabel: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: COLORS.text,
//     marginBottom: 8,
//     marginTop: 16,
//   },
//   photosSection: {
//     marginBottom: SIZES.margin,
//   },
//   imagePicker: {
//     minHeight: SIZES.imagePickerHeight,
//     borderWidth: 2,
//     borderStyle: 'dashed',
//     borderColor: COLORS.border,
//     borderRadius: SIZES.borderRadius,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: COLORS.inputBackground,
//   },
//   emptyPhotos: {
//     alignItems: 'center',
//   },
//   imagesContainer: {
//     flexDirection: 'row',
//     padding: 10,
//   },
//   imageContainer: {
//     position: 'relative',
//     marginRight: 10,
//     alignItems: 'center',
//   },
//   previewImage: {
//     width: SIZES.imageSize,
//     height: SIZES.imageSize,
//     borderRadius: SIZES.borderRadius,
//   },
//   deleteImageButton: {
//     position: 'absolute',
//     top: -5,
//     right: -5,
//     backgroundColor: '#FF4444',
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 1,
//   },
//   deleteImageText: {
//     color: '#FFF',
//     fontWeight: 'bold',
//     fontSize: 14,
//   },
//   imageLabel: {
//     fontSize: 10,
//     color: COLORS.placeholder,
//     marginTop: 4,
//   },
//   imagePickerText: {
//     color: COLORS.primary,
//     fontSize: SIZES.fontLabel,
//     fontWeight: '600',
//   },
//   photoHint: {
//     fontSize: 12,
//     color: COLORS.placeholder,
//     marginTop: 4,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     borderRadius: SIZES.borderRadius,
//     padding: SIZES.padding,
//     marginBottom: 8,
//     fontSize: SIZES.fontLabel,
//     backgroundColor: COLORS.inputBackground,
//     color: COLORS.text,
//   },
//   inputError: {
//     borderColor: '#FF4444',
//   },
//   textArea: {
//     height: 100,
//     textAlignVertical: 'top',
//     marginBottom: SIZES.margin,
//   },
//   pickerContainer: {
//     marginBottom: SIZES.margin,
//   },
//   pickerLabel: {
//     fontSize: SIZES.fontLabel,
//     marginBottom: 8,
//     color: COLORS.text,
//     fontWeight: '500',
//   },
//   pickerWrapper: {
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     borderRadius: SIZES.borderRadius,
//     backgroundColor: COLORS.inputBackground,
//     overflow: 'hidden',
//   },
//   picker: {
//     height: 50,
//   },
//   switchRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: SIZES.margin,
//     paddingVertical: 8,
//   },
//   switchLabel: {
//     fontSize: SIZES.fontLabel,
//     color: COLORS.text,
//     flex: 1,
//   },
//   button: {
//     backgroundColor: COLORS.primary,
//     paddingVertical: SIZES.padding,
//     borderRadius: SIZES.buttonRadius,
//     alignItems: "center",
//     marginTop: 10,
//     ...SHADOW,
//   },
//   buttonDisabled: {
//     backgroundColor: COLORS.stepperInactive,
//     opacity: 0.6,
//   },
//   buttonText: {
//     color: COLORS.card,
//     fontSize: SIZES.fontButton,
//     fontWeight: "bold",
//   },
//   stepperContainer: {
//     marginBottom: SIZES.margin * 2,
//   },
//   stepperRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   stepperCircle: {
//     width: SIZES.stepperCircle,
//     height: SIZES.stepperCircle,
//     borderRadius: SIZES.stepperCircle / 2,
//     justifyContent: "center",
//     alignItems: "center",
//     ...SHADOW,
//   },
//   stepperNumber: {
//     color: "#fff",
//     fontWeight: "bold",
//     fontSize: 14,
//   },
//   stepperLine: {
//     flex: 1,
//     height: 2,
//     backgroundColor: COLORS.stepperInactive,
//     marginHorizontal: 10,
//   },
//   stepperLabels: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     marginTop: 10,
//   },
//   stepperLabel: {
//     fontSize: 12,
//     color: COLORS.text,
//     textAlign: "center",
//     width: "40%",
//   },
//   navigationButtons: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginTop: 20,
//   },
//   backButton: {
//     backgroundColor: COLORS.stepperInactive,
//     flex: 0.48,
//   },
//   errorText: {
//     color: '#FF4444',
//     fontSize: 12,
//     marginTop: 4,
//     marginLeft: 4,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: COLORS.background,
//   },
// });

// export default AddVehicleForm;

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
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from '../context/AuthContext';
import { router, useLocalSearchParams } from "expo-router";
import { apiService } from '../components/services/addVehiculeApi';

// Constantes pour les options
const FUEL_OPTIONS = ["ESSENCE", "DIESEL", "ELECTRIQUE", "HYBRIDE"];
const TRANSMISSION_OPTIONS = ["MANUAL", "AUTOMATIC"];
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
  stepperActive: "#FF6F00",
  stepperInactive: "#ccc",
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
  stepperCircle: 30,
};

const SHADOW = {
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: SIZES.shadowRadius,
  elevation: 5,
};

const AddVehicleForm: React.FC = () => {
  const params = useLocalSearchParams();
  const { vehicleToEdit, mode = 'add' } = params as { 
    vehicleToEdit?: string; 
    mode?: 'edit' | 'add' 
  };

  const [isInitializing, setIsInitializing] = useState(true);
  const [step, setStep] = useState(1);
  const [marque, setMarque] = useState("");
  const [model, setModel] = useState("");
  const [prix, setPrix] = useState("");
  const [description, setDescription] = useState("");
  const [fuelType, setFuelType] = useState("ESSENCE");
  const [transmission, setTransmission] = useState("MANUAL");
  const [mileage, setMileage] = useState("");
  const [forSale, setForSale] = useState(true);
  const [forRent, setForRent] = useState(true);
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
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const { authState } = useAuth();

  if (!authState) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text>Chargement de l'authentification...</Text>
      </View>
    );
  }

  // Charger les données du véhicule en mode édition
  useEffect(() => {
    const loadVehicleData = async () => {
      if (mode === 'edit' && vehicleToEdit) {
        try {
          let vehicleData;
          
          if (typeof vehicleToEdit === 'object') {
            vehicleData = vehicleToEdit;
          } else {
            vehicleData = JSON.parse(vehicleToEdit as string);
          }
          
          setEditingVehicle(vehicleData);
          
          console.log('🚗 Données véhicule reçues pour édition:', vehicleData);
          
          if (vehicleData.marque) {
            if (typeof vehicleData.marque === 'object') {
              setMarque(vehicleData.marque.name || "");
            } else {
              setMarque(vehicleData.marque);
            }
          }
          if (vehicleData.model) {
            setModel(vehicleData.model);
          }
          if (vehicleData.prix) {
            setPrix(vehicleData.prix.toString());
          }
          if (vehicleData.description) {
            setDescription(vehicleData.description);
          }
          if (vehicleData.fuelType) {
            setFuelType(vehicleData.fuelType);
          }
          if (vehicleData.transmission) {
            setTransmission(vehicleData.transmission);
          }
          if (vehicleData.mileage) {
            setMileage(vehicleData.mileage.toString());
          }
          if (vehicleData.forSale !== undefined) {
            setForSale(vehicleData.forSale);
          }
          if (vehicleData.forRent !== undefined) {
            setForRent(vehicleData.forRent);
          }
          if (vehicleData.dureeGarantie) {
            setGarantie(true);
            setDureeGarantie(vehicleData.dureeGarantie.toString());
          } else {
            setGarantie(false);
            setDureeGarantie("");
          }
          if (vehicleData.assurance !== undefined) {
            setAssurance(vehicleData.assurance);
          }
          if (vehicleData.carteGrise !== undefined) {
            setCarteGrise(vehicleData.carteGrise);
          }
          if (vehicleData.vignette !== undefined) {
            setVignette(vehicleData.vignette);
          }
          if (vehicleData.photos) {
            const photoUrls = Array.isArray(vehicleData.photos) 
              ? vehicleData.photos 
              : [vehicleData.photos];
            setExistingPhotos(photoUrls.filter((photo: string) => photo && photo !== ""));
          }
        } catch (error) {
          console.error('Erreur parsing vehicle data:', error);
          Alert.alert("Erreur", "Impossible de charger les données du véhicule");
        }
      }
    };

    loadVehicleData();
  }, [mode, vehicleToEdit]);

  // Charger les informations de l'utilisateur
  const loadUserData = async () => {
    if (authState.userId && authState.role === "CLIENT") {
      setUserOwnerId(authState.userId);
      setParkingId("");
      setRoleLoaded("CLIENT");
      return;
    } else if (authState.parkingId && authState.role === "PARKING") {
      setParkingId(authState.parkingId);
      setUserOwnerId("");
      setRoleLoaded("PARKING");
      return;
    }

    if (!authState.accessToken) {
      Alert.alert("Erreur", "Token d'accès manquant. Veuillez vous reconnecter.");
      router.push('/(auth)/LoginScreen');
      return;
    }

    try {
      const { data, error } = await apiService.getUserInfo(authState.accessToken);
      if (error) {
        Alert.alert("Erreur", error);
        router.push('/(auth)/LoginScreen');
        return;
      }

      setRoleLoaded(data.role);
      if (data.role === "CLIENT") {
        setUserOwnerId(String(data.id));
        setParkingId("");
      } else if (data.role === "PARKING") {
        if (!data.parkingId) {
          Alert.alert("Erreur", "Aucun parking associé à cet utilisateur.");
          router.push('/(auth)/LoginScreen');
          return;
        }
        setParkingId(String(data.parkingId));
        setUserOwnerId("");
      }
    } catch (error) {
      console.error('Erreur chargement user info:', error);
      Alert.alert("Erreur", "Impossible de charger les informations utilisateur");
    }
  };

  // Initialisation complète
  useEffect(() => {
    const initialize = async () => {
      try {
        await loadUserData();
      } catch (error) {
        console.error('Erreur initialisation:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [authState.accessToken, authState.userId, authState.role, authState.parkingId]);

  // Sélection des images
  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à vos photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        selectionLimit: 10 - (existingPhotos.length + photos.length),
      });

      if (!result.canceled && result.assets.length > 0) {
        const uris = result.assets.map((asset) => asset.uri);
        const totalPhotos = existingPhotos.length + photos.length + uris.length;
        
        if (totalPhotos > 10) {
          Alert.alert("Limite atteinte", "Vous ne pouvez pas ajouter plus de 10 photos.");
          return;
        }
        
        setPhotos(prev => [...prev, ...uris]);
        if (formErrors.photos) {
          setFormErrors(prev => ({...prev, photos: ''}));
        }
      }
    } catch (error) {
      console.error('Erreur sélection images:', error);
      Alert.alert("Erreur", "Impossible de sélectionner les images");
    }
  };

  // Supprimer une photo
  const removePhoto = (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      setExistingPhotos(prev => prev.filter((_, i) => i !== index));
    } else {
      setPhotos(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Validation de l'étape 1
  const validateStep1 = () => {
    const errors: {[key: string]: string} = {};
    
    if (!marque.trim()) {
      errors.marque = "La marque est requise";
    }
    if (!model.trim()) {
      errors.model = "Le modèle est requis";
    }
    if (!prix.trim()) {
      errors.prix = "Le prix est requis";
    } else if (isNaN(Number(prix)) || Number(prix) <= 0) {
      errors.prix = "Le prix doit être un nombre valide supérieur à 0";
    }
    if (!forSale && !forRent) {
      errors.disponibilite = "Le véhicule doit être destiné à au moins une option : vente ou location";
    }
    if (mileage && (isNaN(Number(mileage)) || Number(mileage) < 0)) {
      errors.mileage = "Le kilométrage doit être un nombre valide";
    }
    if (photos.length === 0 && existingPhotos.length === 0) {
      errors.photos = "Au moins une photo est requise";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validation de l'étape 2
  const validateStep2 = () => {
    const errors: {[key: string]: string} = {};
    
    if (garantie && !dureeGarantie) {
      errors.dureeGarantie = "Veuillez sélectionner une durée de garantie";
    }
    if (assurance && !dureeAssurance) {
      errors.dureeAssurance = "Veuillez sélectionner une durée d'assurance";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigation vers l'étape suivante
  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  // Navigation vers l'étape précédente
  const handleBack = () => {
    setStep(1);
    setFormErrors({});
  };

  // Fonction pour formater les données du véhicule
  const formatVehicleData = () => {
    const baseData = {
      marque: marque.trim(),
      model: model.trim(),
      prix: Number(prix),
      description: description.trim() || "",
      fuelType: fuelType,
      transmission: transmission,
      mileage: mileage ? Number(mileage) : 0,
      forSale: forSale,
      forRent: forRent,
      garantie: garantie,
      dureeGarantie: garantie ? Number(dureeGarantie) : 0,
      chauffeur: chauffeur,
      assurance: assurance,
      dureeAssurance: assurance ? Number(dureeAssurance) : 0,
      carteGrise: carteGrise,
      vignette: vignette,
    };

    return {
      ...baseData,
      marqueRef: {
        name: marque.trim(),
        id: Date.now(),
        isCustom: true
      },
      photos: [...existingPhotos, ...photos].filter(photo => photo && photo !== "")
    };
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateStep2()) return;

    if (!authState?.accessToken) {
      Alert.alert("Erreur", "Token d'accès manquant. Veuillez vous reconnecter.");
      return;
    }

    if (!parkingId && !userOwnerId) {
      Alert.alert("Erreur", "Impossible de déterminer le propriétaire du véhicule.");
      return;
    }

    try {
      setIsLoading(true);

      const formData = new FormData();
      
      const vehicleData = formatVehicleData();
      
      formData.append("marque", vehicleData.marque);
      formData.append("model", vehicleData.model);
      formData.append("prix", vehicleData.prix.toString());
      formData.append("description", vehicleData.description);
      formData.append("fuelType", vehicleData.fuelType);
      formData.append("transmission", vehicleData.transmission);
      formData.append("mileage", vehicleData.mileage.toString());
      formData.append("forSale", vehicleData.forSale.toString());
      formData.append("forRent", vehicleData.forRent.toString());
      formData.append("garantie", vehicleData.garantie.toString());
      formData.append("dureeGarantie", vehicleData.dureeGarantie.toString());
      formData.append("chauffeur", vehicleData.chauffeur.toString());
      formData.append("assurance", vehicleData.assurance.toString());
      formData.append("dureeAssurance", vehicleData.dureeAssurance.toString());
      formData.append("carteGrise", vehicleData.carteGrise.toString());
      formData.append("vignette", vehicleData.vignette.toString());
      
      if (parkingId) formData.append("parkingId", parkingId);
      if (userOwnerId) formData.append("userOwnerId", userOwnerId);

      photos.forEach((uri, index) => {
        if (uri && uri !== "") {
          const filename = uri.split("/").pop() || `photo_${Date.now()}_${index}.jpg`;
          const fileExtension = filename.split('.').pop()?.toLowerCase();
          const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
          
          formData.append("photos", {
            uri: uri,
            name: filename,
            type: mimeType,
          } as any);
        }
      });

      if (mode === 'edit' && existingPhotos.length > 0) {
        existingPhotos.forEach((photo, index) => {
          if (photo && photo !== "") {
            formData.append("existingPhotos", photo);
          }
        });
      }

      console.log('📤 Envoi des données véhicule:', vehicleData);
      
      let result;
      if (mode === 'edit' && editingVehicle?.id) {
        const { data, error } = await apiService.updateVehicle(editingVehicle.id, formData, authState.accessToken);
        if (error) throw new Error(error);
        result = data;
        Alert.alert("Succès ✅", "Véhicule modifié avec succès");
      } else {
        const { data, error } = await apiService.createVehicle(formData, authState.accessToken);
        if (error) throw new Error(error);
        result = data;
        Alert.alert("Succès ✅", "Véhicule créé avec succès");
        resetForm();
      }

      console.log('✅ Réponse API:', result);

      setTimeout(() => {
        if (mode === 'edit') {
          router.back();
        } else {
          router.replace('/tabs/accueil');
        }
      }, 1500);

    } catch (error: any) {
      console.error('❌ Erreur soumission:', error);
      Alert.alert(
        "Erreur ❌", 
        error.message || "Une erreur est survenue lors de l'enregistrement"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setMarque("");
    setModel("");
    setPrix("");
    setDescription("");
    setFuelType("ESSENCE");
    setTransmission("MANUAL");
    setMileage("");
    setForSale(true);
    setForRent(true);
    setGarantie(false);
    setDureeGarantie("");
    setChauffeur(false);
    setAssurance(false);
    setDureeAssurance("");
    setCarteGrise(false);
    setVignette(false);
    setPhotos([]);
    setExistingPhotos([]);
    setStep(1);
    setFormErrors({});
  };

  // Rendu du stepper
  const renderStepper = () => (
    <View style={styles.stepperContainer}>
      <View style={styles.stepperRow}>
        <View style={[styles.stepperCircle, { backgroundColor: step >= 1 ? COLORS.stepperActive : COLORS.stepperInactive }]}>
          <Text style={styles.stepperNumber}>1</Text>
        </View>
        <View style={styles.stepperLine} />
        <View style={[styles.stepperCircle, { backgroundColor: step >= 2 ? COLORS.stepperActive : COLORS.stepperInactive }]}>
          <Text style={styles.stepperNumber}>2</Text>
        </View>
      </View>
      <View style={styles.stepperLabels}>
        <Text style={styles.stepperLabel}>Informations de base</Text>
        <Text style={styles.stepperLabel}>Options avancées</Text>
      </View>
    </View>
  );

  // Rendu des photos
  const renderPhotos = () => {
    const allPhotos = [...existingPhotos, ...photos];
    const totalPhotos = allPhotos.length;
    
    return (
      <View style={styles.photosSection}>
        <Text style={styles.sectionLabel}>
          Photos ({totalPhotos}/10) {totalPhotos === 0 && "*"}
        </Text>
        <TouchableOpacity style={[
          styles.imagePicker, 
          formErrors.photos && styles.inputError
        ]} onPress={pickImages}>
          {totalPhotos > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.imagesContainer}>
                {existingPhotos.map((uri, i) => (
                  <View key={`existing-${i}`} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    <TouchableOpacity 
                      style={styles.deleteImageButton}
                      onPress={() => removePhoto(i, true)}
                    >
                      <Text style={styles.deleteImageText}>×</Text>
                    </TouchableOpacity>
                    <Text style={styles.imageLabel}>Existante</Text>
                  </View>
                ))}
                {photos.map((uri, i) => (
                  <View key={`new-${i}`} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    <TouchableOpacity 
                      style={styles.deleteImageButton}
                      onPress={() => removePhoto(i, false)}
                    >
                      <Text style={styles.deleteImageText}>×</Text>
                    </TouchableOpacity>
                    <Text style={styles.imageLabel}>Nouvelle</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.emptyPhotos}>
              <Text style={styles.imagePickerText}>+ Ajouter des photos</Text>
              <Text style={styles.photoHint}>(Maximum 10 photos)</Text>
            </View>
          )}
        </TouchableOpacity>
        {formErrors.photos && (
          <Text style={styles.errorText}>{formErrors.photos}</Text>
        )}
      </View>
    );
  };

  // Rendu des erreurs de formulaire
  const renderError = (field: string) => {
    if (formErrors[field]) {
      return <Text style={styles.errorText}>{formErrors[field]}</Text>;
    }
    return null;
  };

  // Afficher le loader d'initialisation
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text>Chargement du formulaire...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <Text style={styles.title}>
              {mode === 'edit' ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
            </Text>
            
            {renderStepper()}

            {step === 1 && (
              <>
                {/* Étape 1: Informations de base */}
                {renderPhotos()}

                <Text style={styles.sectionLabel}>Informations générales *</Text>
                
                <View>
                  <TextInput
                    style={[styles.input, formErrors.marque && styles.inputError]}
                    placeholder="Marque *"
                    value={marque}
                    onChangeText={(text) => {
                      setMarque(text);
                      if (formErrors.marque) {
                        setFormErrors(prev => ({...prev, marque: ''}));
                      }
                    }}
                    placeholderTextColor={COLORS.placeholder}
                  />
                  {renderError('marque')}
                </View>
                
                <View>
                  <TextInput
                    style={[styles.input, formErrors.model && styles.inputError]}
                    placeholder="Modèle *"
                    value={model}
                    onChangeText={(text) => {
                      setModel(text);
                      if (formErrors.model) {
                        setFormErrors(prev => ({...prev, model: ''}));
                      }
                    }}
                    placeholderTextColor={COLORS.placeholder}
                  />
                  {renderError('model')}
                </View>
                
                <View>
                  <TextInput
                    style={[styles.input, formErrors.prix && styles.inputError]}
                    placeholder="Prix (FCFA) *"
                    value={prix}
                    onChangeText={(text) => {
                      setPrix(text);
                      if (formErrors.prix) {
                        setFormErrors(prev => ({...prev, prix: ''}));
                      }
                    }}
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.placeholder}
                  />
                  {renderError('prix')}
                </View>
                
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description"
                  value={description}
                  onChangeText={setDescription}
                  placeholderTextColor={COLORS.placeholder}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <Text style={styles.sectionLabel}>Caractéristiques</Text>

                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Type de carburant</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={fuelType}
                      onValueChange={setFuelType}
                      style={styles.picker}
                      dropdownIconColor={COLORS.primary}
                    >
                      {FUEL_OPTIONS.map((fuel) => (
                        <Picker.Item key={fuel} label={fuel} value={fuel} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Boîte de vitesses</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={transmission}
                      onValueChange={setTransmission}
                      style={styles.picker}
                      dropdownIconColor={COLORS.primary}
                    >
                      {TRANSMISSION_OPTIONS.map((trans) => (
                        <Picker.Item key={trans} label={trans === 'MANUAL' ? 'Manuelle' : 'Automatique'} value={trans} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View>
                  <TextInput
                    style={[styles.input, formErrors.mileage && styles.inputError]}
                    placeholder="Kilométrage"
                    value={mileage}
                    onChangeText={(text) => {
                      setMileage(text);
                      if (formErrors.mileage) {
                        setFormErrors(prev => ({...prev, mileage: ''}));
                      }
                    }}
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.placeholder}
                  />
                  {renderError('mileage')}
                </View>

                <Text style={styles.sectionLabel}>Disponibilités *</Text>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Pour la vente</Text>
                  <Switch 
                    value={forSale} 
                    onValueChange={setForSale}
                    trackColor={{ false: '#767577', true: COLORS.primary }}
                    thumbColor={forSale ? '#f5dd4b' : '#f4f3f4'}
                  />
                </View>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Pour la location</Text>
                  <Switch 
                    value={forRent} 
                    onValueChange={setForRent}
                    trackColor={{ false: '#767577', true: COLORS.primary }}
                    thumbColor={forRent ? '#f5dd4b' : '#f4f3f4'}
                  />
                </View>
                {renderError('disponibilite')}

                <TouchableOpacity 
                  style={[styles.button, isLoading && styles.buttonDisabled]} 
                  onPress={handleNext}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.buttonText}>Suivant</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {step === 2 && (
              <>
                {/* Étape 2: Options avancées */}
                <Text style={styles.sectionLabel}>Options supplémentaires</Text>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Garantie</Text>
                  <Switch
                    value={garantie}
                    onValueChange={(value) => {
                      setGarantie(value);
                      if (!value) setDureeGarantie("");
                      if (formErrors.dureeGarantie) {
                        setFormErrors(prev => ({...prev, dureeGarantie: ''}));
                      }
                    }}
                    trackColor={{ false: '#767577', true: COLORS.primary }}
                    thumbColor={garantie ? '#f5dd4b' : '#f4f3f4'}
                  />
                </View>
                
                {garantie && (
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>Durée de garantie (mois)</Text>
                    <View style={[styles.pickerWrapper, formErrors.dureeGarantie && styles.inputError]}>
                      <Picker
                        selectedValue={dureeGarantie}
                        onValueChange={(value) => {
                          setDureeGarantie(value);
                          if (formErrors.dureeGarantie) {
                            setFormErrors(prev => ({...prev, dureeGarantie: ''}));
                          }
                        }}
                        style={styles.picker}
                        dropdownIconColor={COLORS.primary}
                      >
                        <Picker.Item label="Sélectionner une durée" value="" />
                        {DURATION_OPTIONS.map((duration) => (
                          <Picker.Item key={duration} label={`${duration} mois`} value={duration} />
                        ))}
                      </Picker>
                    </View>
                    {renderError('dureeGarantie')}
                  </View>
                )}

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Chauffeur inclus</Text>
                  <Switch 
                    value={chauffeur} 
                    onValueChange={setChauffeur}
                    trackColor={{ false: '#767577', true: COLORS.primary }}
                    thumbColor={chauffeur ? '#f5dd4b' : '#f4f3f4'}
                  />
                </View>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Assurance</Text>
                  <Switch
                    value={assurance}
                    onValueChange={(value) => {
                      setAssurance(value);
                      if (!value) setDureeAssurance("");
                      if (formErrors.dureeAssurance) {
                        setFormErrors(prev => ({...prev, dureeAssurance: ''}));
                      }
                    }}
                    trackColor={{ false: '#767577', true: COLORS.primary }}
                    thumbColor={assurance ? '#f5dd4b' : '#f4f3f4'}
                  />
                </View>
                
                {assurance && (
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>Durée d'assurance (mois)</Text>
                    <View style={[styles.pickerWrapper, formErrors.dureeAssurance && styles.inputError]}>
                      <Picker
                        selectedValue={dureeAssurance}
                        onValueChange={(value) => {
                          setDureeAssurance(value);
                          if (formErrors.dureeAssurance) {
                            setFormErrors(prev => ({...prev, dureeAssurance: ''}));
                          }
                        }}
                        style={styles.picker}
                        dropdownIconColor={COLORS.primary}
                      >
                        <Picker.Item label="Sélectionner une durée" value="" />
                        {DURATION_OPTIONS.map((duration) => (
                          <Picker.Item key={duration} label={`${duration} mois`} value={duration} />
                        ))}
                      </Picker>
                    </View>
                    {renderError('dureeAssurance')}
                  </View>
                )}

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Carte Grise</Text>
                  <Switch 
                    value={carteGrise} 
                    onValueChange={setCarteGrise}
                    trackColor={{ false: '#767577', true: COLORS.primary }}
                    thumbColor={carteGrise ? '#f5dd4b' : '#f4f3f4'}
                  />
                </View>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Vignette</Text>
                  <Switch 
                    value={vignette} 
                    onValueChange={setVignette}
                    trackColor={{ false: '#767577', true: COLORS.primary }}
                    thumbColor={vignette ? '#f5dd4b' : '#f4f3f4'}
                  />
                </View>

                <View style={styles.navigationButtons}>
                  <TouchableOpacity style={[styles.button, styles.backButton]} onPress={handleBack}>
                    <Text style={styles.buttonText}>Précédent</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.button, isLoading && styles.buttonDisabled]} 
                    onPress={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.buttonText}>
                        {mode === 'edit' ? 'Modifier' : 'Enregistrer'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: "bold",
    marginBottom: SIZES.margin,
    color: COLORS.text,
    textAlign: "center",
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 16,
  },
  photosSection: {
    marginBottom: SIZES.margin,
  },
  imagePicker: {
    minHeight: SIZES.imagePickerHeight,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.inputBackground,
  },
  emptyPhotos: {
    alignItems: 'center',
  },
  imagesContainer: {
    flexDirection: 'row',
    padding: 10,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 10,
    alignItems: 'center',
  },
  previewImage: {
    width: SIZES.imageSize,
    height: SIZES.imageSize,
    borderRadius: SIZES.borderRadius,
  },
  deleteImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  deleteImageText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  imageLabel: {
    fontSize: 10,
    color: COLORS.placeholder,
    marginTop: 4,
  },
  imagePickerText: {
    color: COLORS.primary,
    fontSize: SIZES.fontLabel,
    fontWeight: '600',
  },
  photoHint: {
    fontSize: 12,
    color: COLORS.placeholder,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.padding,
    marginBottom: 8,
    fontSize: SIZES.fontLabel,
    backgroundColor: COLORS.inputBackground,
    color: COLORS.text,
  },
  inputError: {
    borderColor: '#FF4444',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    marginBottom: SIZES.margin,
  },
  pickerContainer: {
    marginBottom: SIZES.margin,
  },
  pickerLabel: {
    fontSize: SIZES.fontLabel,
    marginBottom: 8,
    color: COLORS.text,
    fontWeight: '500',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.inputBackground,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.margin,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: SIZES.fontLabel,
    color: COLORS.text,
    flex: 1,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.buttonRadius,
    alignItems: "center",
    marginTop: 10,
    ...SHADOW,
  },
  buttonDisabled: {
    backgroundColor: COLORS.stepperInactive,
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.card,
    fontSize: SIZES.fontButton,
    fontWeight: "bold",
  },
  stepperContainer: {
    marginBottom: SIZES.margin * 2,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperCircle: {
    width: SIZES.stepperCircle,
    height: SIZES.stepperCircle,
    borderRadius: SIZES.stepperCircle / 2,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOW,
  },
  stepperNumber: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  stepperLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.stepperInactive,
    marginHorizontal: 10,
  },
  stepperLabels: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  stepperLabel: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: "center",
    width: "40%",
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  backButton: {
    backgroundColor: COLORS.stepperInactive,
    flex: 0.48,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default AddVehicleForm;