// // app/(Parking)/gestion.tsx
// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   SafeAreaView,
//   Image,
//   Animated,
//   NativeSyntheticEvent,
//   NativeScrollEvent,
//   ActivityIndicator,
//   Modal,
//   ScrollView,
//   Dimensions,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { getParkingManagementData, setAuthToken } from '../../components/services/back';
// import { useAuth } from '../../context/AuthContext';
// import { useRouter } from 'expo-router';
// import Svg, { Circle, G, Rect, Text as SvgText } from 'react-native-svg';

// // Types adaptés à votre backend
// type Vehicule = {
//   id: string;
//   marqueRef: {
//     name: string;
//   };
//   model: string;
//   status: string;
//   photos: string[];
//   prix: number;
//   forSale: boolean;
//   forRent: boolean;
//   stats?: {
//     vues: number;
//     reservations: number;
//     favoris: number;
//     reservationsActives: number;
//   };
//   nextReservation?: {
//     type: string;
//     date: string;
//     client: string;
//   };
//   // NOUVEAUX CHAMPS POUR LES DÉTAILS
//   dureeGarantie?: number;
//   mileage?: number;
//   fuelType?: string;
//   carteGrise?: boolean;
//   assurance?: boolean;
//   vignette?: boolean;
//   description?: string;
// };

// type ParkingData = {
//   parking: {
//     id: string;
//     name: string;
//     address: string;
//     phone: string;
//     logo: string;
//   };
//   statistics: {
//     total: number;
//     vendus: number;
//     enLocation: number;
//     disponibles: number;
//     enMaintenance: number;
//     indisponibles: number;
//     totalVues: number;
//     totalReservations: number;
//     totalFavoris: number;
//     reservationsActives: number;
//     monthlySales: number;
//     monthlyRentals: number;
//   };
//   vehicles: Vehicule[];
//   charts: {
//     monthlyData: {
//       labels: string[];
//       sales: number[];
//       rentals: number[];
//     };
//     statusDistribution: {
//       labels: string[];
//       data: number[];
//     };
//   };
// };

// const { width: SCREEN_WIDTH } = Dimensions.get('window');

// const MonParkingScreen: React.FC = () => {
//   const { authState, refreshAuth } = useAuth();
//   const [parkingData, setParkingData] = useState<ParkingData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedBottomFilter, setSelectedBottomFilter] = useState('Tous');
//   const [sticky, setSticky] = useState(false);
//   const [graphType, setGraphType] = useState<'pie' | 'bar'>('pie');
//   const [menuVisible, setMenuVisible] = useState(false);

//   const scrollY = useRef(new Animated.Value(0)).current;
//   const router = useRouter();

//   useEffect(() => {
//     const fetchParkingData = async () => {
//       setLoading(true);
//       try {
//         if (authState.accessToken) {
//           console.log('🔑 Token présent, récupération données...');
//           setAuthToken(authState.accessToken);
//           const data = await getParkingManagementData();
          
//           // DEBUG: Vérifier la structure des données
//           console.log('✅ Données parking reçues:', {
//             parking: data.parking,
//             nbVehicles: data.vehicles?.length,
//             statistics: data.statistics
//           });
          
//           // DEBUG: Vérifier le premier véhicule pour voir tous les champs
//           if (data.vehicles && data.vehicles.length > 0) {
//             console.log('🚗 Premier véhicule complet:', data.vehicles[0]);
//             console.log('📋 Champs disponibles:', Object.keys(data.vehicles[0]));
//           }
          
//           setParkingData(data);
//         } else {
//           console.warn('❌ Token absent');
//         }
//       } catch (error: any) {
//         console.error('❌ Erreur API gestion parking:', {
//           message: error.message,
//           status: error.response?.status,
//           data: error.response?.data
//         });
        
//         if (error.response?.status === 403) {
//           console.log("🔄 Tentative de rafraîchissement...");
//           const success = await refreshAuth();
//           if (success && authState.accessToken) {
//             setAuthToken(authState.accessToken);
//             const data = await getParkingManagementData();
//             setParkingData(data);
//           } else {
//             console.error('❌ Rafraîchissement échoué');
//           }
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (authState.accessToken) {
//       fetchParkingData();
//     } else {
//       console.error('❌ Token absent, requête non effectuée');
//       setLoading(false);
//     }
//   }, [authState.accessToken]);

//   // Calcul des statistiques basées sur les données du backend
//   const totalVoitures = parkingData?.statistics.total || 0;
  
//   // Calcul basé sur les véhicules réels du parking
//   const calculateStatisticsFromVehicles = () => {
//     if (!parkingData?.vehicles) {
//       return {
//         voituresVente: 0,
//         voituresLocation: 0,
//         voituresReservation: 0
//       };
//     }

//     const vehicles = parkingData.vehicles;
    
//     const voituresVente = vehicles.filter(v => v.forSale === true && v.status !== 'ACHETE').length;
//     const voituresLocation = vehicles.filter(v => v.forRent === true && v.status !== 'EN_LOCATION').length;
//     const voituresReservation = vehicles.reduce((total, v) => 
//       total + (v.stats?.reservationsActives || 0), 0
//     );

//     return {
//       voituresVente,
//       voituresLocation,
//       voituresReservation
//     };
//   };

//   const { voituresVente, voituresLocation, voituresReservation } = calculateStatisticsFromVehicles();

//   // Calcul des pourcentages pour le graphique
//   const pourcentageLocation = totalVoitures ? (voituresLocation / totalVoitures) * 100 : 0;
//   const pourcentageVente = totalVoitures ? (voituresVente / totalVoitures) * 100 : 0;
//   const pourcentageReservation = totalVoitures ? (voituresReservation / totalVoitures) * 100 : 0;

//   // Ajustement pour que la somme fasse 100%
//   const totalPourcentage = pourcentageLocation + pourcentageVente + pourcentageReservation;
//   const adjustedPourcentageLocation = totalPourcentage > 0 ? (pourcentageLocation / totalPourcentage) * 100 : 0;
//   const adjustedPourcentageVente = totalPourcentage > 0 ? (pourcentageVente / totalPourcentage) * 100 : 0;
//   const adjustedPourcentageReservation = totalPourcentage > 0 ? (pourcentageReservation / totalPourcentage) * 100 : 0;

//   const size = 180;
//   const strokeWidth = 20;
//   const radius = (size - strokeWidth) / 2;
//   const circumference = 2 * Math.PI * radius;

//   const segments = [
//     { 
//       value: adjustedPourcentageLocation, 
//       color: '#FD6A00', 
//       label: 'En location', 
//       count: voituresLocation,
//       originalPercentage: pourcentageLocation
//     },
//     { 
//       value: adjustedPourcentageVente, 
//       color: '#FFD1A3', 
//       label: 'En vente', 
//       count: voituresVente,
//       originalPercentage: pourcentageVente
//     },
//     { 
//       value: adjustedPourcentageReservation, 
//       color: '#f1f1f1', 
//       label: 'En réservation', 
//       count: voituresReservation,
//       originalPercentage: pourcentageReservation
//     },
//   ];

//   // Filtrage des voitures selon votre backend
//   const filteredVoitures = parkingData?.vehicles.filter(v => {
//     if (selectedBottomFilter === 'En vente') return v.forSale === true && v.status !== 'ACHETE';
//     if (selectedBottomFilter === 'En location') return v.forRent === true && v.status !== 'EN_LOCATION';
//     if (selectedBottomFilter === 'Tous') return true;
//     return true;
//   }).filter(v =>
//     v.marqueRef.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     v.model.toLowerCase().includes(searchQuery.toLowerCase())
//   ) || [];

//   const getImageSource = (forSale: boolean, forRent: boolean) => {
//     if (forRent) return require('../../assets/images/location.jpeg');
//     if (forSale) return require('../../assets/images/vente.png');
//     return require('../../assets/images/disponible.png');
//   };

//   const getStatusLabel = (forSale: boolean, forRent: boolean, status: string) => {
//     if (status && status !== 'DISPONIBLE') {
//       switch (status) {
//         case 'EN_LOCATION': return 'En location';
//         case 'ACHETE': return 'Vendu';
//         case 'DISPONIBLE': return 'Disponible';
//         case 'EN_MAINTENANCE': return 'Maintenance';
//         case 'INDISPONIBLE': return 'Indisponible';
//         default: return status;
//       }
//     }
    
//     if (forSale && forRent) return 'Vente & Location';
//     if (forSale) return 'En vente';
//     if (forRent) return 'En location';
//     return 'Disponible';
//   };

//   // FONCTION AMÉLIORÉE : Afficher les détails supplémentaires
//   const renderAdditionalDetails = (vehicule: Vehicule) => {
//     const details = [];
    
//     if (vehicule.mileage) {
//       details.push(`${vehicule.mileage.toLocaleString()} km`);
//     }
    
//     if (vehicule.fuelType) {
//       details.push(vehicule.fuelType);
//     }
    
//     if (vehicule.dureeGarantie) {
//       details.push(`Garantie ${vehicule.dureeGarantie} mois`);
//     }
    
//     if (details.length > 0) {
//       return (
//         <Text style={styles.additionalDetails}>
//           {details.join(' • ')}
//         </Text>
//       );
//     }
    
//     return null;
//   };

//   const handleScroll = Animated.event(
//     [{ nativeEvent: { contentOffset: { y: scrollY } } }],
//     {
//       useNativeDriver: false,
//       listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
//         setSticky(event.nativeEvent.contentOffset.y > 300);
//       },
//     }
//   );

//   // FONCTION POUR VOIR LES DÉTAILS COMPLETS
//   const handleVoiturePress = (vehicule: Vehicule) => {
//     console.log('🚗 Navigation vers détails:', vehicule);
//     router.push({
//       pathname: "/(Clients)/CreateListingScreen",
//       params: { 
//         vehicule: JSON.stringify(vehicule),
//         isParkingView: 'true'
//       }
//     });
//   };

//   const renderBottomButtons = () => (
//     <View style={styles.bottomButtonsContainer}>
//       {['Tous', 'En vente', 'En location'].map(filter => (
//         <TouchableOpacity
//           key={filter}
//           style={[styles.bottomButton, selectedBottomFilter === filter && styles.bottomButtonActive]}
//           onPress={() => setSelectedBottomFilter(filter)}
//         >
//           <Text style={[styles.bottomButtonText, selectedBottomFilter === filter && styles.bottomButtonTextActive]}>
//             {filter}
//           </Text>
//         </TouchableOpacity>
//       ))}
//     </View>
//   );

//   const renderBarChart = () => {
//     const monthlyData = parkingData?.charts?.monthlyData;
//     if (!monthlyData) return null;

//     // Afficher seulement les 4 derniers mois
//     const numMonths = 4;
//     const displayedLabels = monthlyData.labels.slice(-numMonths);
//     const displayedSales = monthlyData.sales.slice(-numMonths);
//     const displayedRentals = monthlyData.rentals.slice(-numMonths);

//     const maxValue = Math.max(...displayedSales, ...displayedRentals, 1);
//     const chartHeight = 150;
//     const barWidth = 25;
//     const spacing = 15;
//     const totalWidth = displayedLabels.length * (barWidth * 2 + spacing);
//     const chartPadding = 20;
//     const yLabelWidth = 5; // Espace supplémentaire pour les labels Y

//     return (
//       <View style={styles.barChartContainer}>
//         <ScrollView 
//           horizontal 
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={{ paddingHorizontal: chartPadding }}
//         >
//           <Svg width={totalWidth + chartPadding * 2 + yLabelWidth} height={chartHeight + 60}>
//             {/* Lignes horizontales et labels Y */}
//             <G x={yLabelWidth}>
//               {[0, 25, 50, 75, 100].map((percent, index) => {
//                 const y = chartHeight - (percent / 100) * chartHeight;
//                 const labelValue = Math.round((percent / 100) * maxValue);
//                 return (
//                   <G key={index}>
//                     <Rect
//                       x={chartPadding}
//                       y={y}
//                       width={totalWidth}
//                       height={1}
//                       fill="#e0e0e0"
//                     />
//                     <SvgText
//                       x={chartPadding - 5}
//                       y={y + 3}
//                       textAnchor="end"
//                       fontSize="10"
//                       fill="#666"
//                     >
//                       {labelValue}
//                     </SvgText>
//                   </G>
//                 );
//               })}
//             </G>

//             {/* Barres et labels */}
//             <G x={yLabelWidth}>
//               {displayedLabels.map((label, index) => {
//                 const x = index * (barWidth * 2 + spacing) + chartPadding;
//                 const salesHeight = (displayedSales[index] / maxValue) * chartHeight;
//                 const rentalsHeight = (displayedRentals[index] / maxValue) * chartHeight;

//                 return (
//                   <G key={index}>
//                     <Rect
//                       x={x}
//                       y={chartHeight - salesHeight}
//                       width={barWidth}
//                       height={salesHeight}
//                       fill="#FD6A00"
//                       rx={4}
//                     />
//                     <Rect
//                       x={x + barWidth + 2}
//                       y={chartHeight - rentalsHeight}
//                       width={barWidth}
//                       height={rentalsHeight}
//                       fill="#FFD1A3"
//                       rx={4}
//                     />
                    
//                     <SvgText
//                       x={x + barWidth / 2}
//                       y={chartHeight - salesHeight - 5}
//                       textAnchor="middle"
//                       fontSize="10"
//                       fontWeight="bold"
//                       fill={displayedSales[index] === 0 ? "#999" : "#333"}
//                     >
//                       {displayedSales[index]}
//                     </SvgText>
                    
//                     <SvgText
//                       x={x + barWidth * 1.5 + 2}
//                       y={chartHeight - rentalsHeight - 5}
//                       textAnchor="middle"
//                       fontSize="10"
//                       fontWeight="bold"
//                       fill={displayedRentals[index] === 0 ? "#999" : "#333"}
//                     >
//                       {displayedRentals[index]}
//                     </SvgText>
                    
//                     <SvgText
//                       x={x + barWidth}
//                       y={chartHeight + 20}
//                       textAnchor="middle"
//                       fontSize="10"
//                       fill="#666"
//                     >
//                       {label}
//                     </SvgText>
//                   </G>
//                 );
//               })}
//             </G>
//           </Svg>
//         </ScrollView>
        
//         <View style={styles.chartLegend}>
//           <View style={styles.legendItem}>
//             <View style={[styles.legendColor, { backgroundColor: '#FD6A00' }]} />
//             <Text style={styles.legendText}>Ventes</Text>
//           </View>
//           <View style={styles.legendItem}>
//             <View style={[styles.legendColor, { backgroundColor: '#FFD1A3' }]} />
//             <Text style={styles.legendText}>Locations</Text>
//           </View>
//         </View>
//       </View>
//     );
//   };

//   const renderGraphContainer = () => {
//     let startAngle = -90;
//     const monthlyData = parkingData?.charts?.monthlyData;

//     return (
//       <View style={styles.graphContainer}>
//         <View style={styles.graphHeader}>
//           <Text style={styles.graphTitle}>
//             {graphType === 'pie' ? 'Résumé voitures' : 'Ventes & Locations mensuelles'}
//           </Text>
//           <TouchableOpacity style={styles.settingsIcon} onPress={() => setMenuVisible(true)}>
//             <Ionicons name="options-outline" size={24} color="#FD6A00" />
//           </TouchableOpacity>
//         </View>

//         <Modal transparent visible={menuVisible} animationType="fade">
//           <TouchableOpacity style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
//             <View style={styles.menuContainer}>
//               <TouchableOpacity style={styles.menuItem} onPress={() => { setGraphType('pie'); setMenuVisible(false); }}>
//                 <Text style={graphType === 'pie' ? styles.menuItemActiveText : styles.menuItemText}>Résumé voitures</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.menuItem} onPress={() => { setGraphType('bar'); setMenuVisible(false); }}>
//                 <Text style={graphType === 'bar' ? styles.menuItemActiveText : styles.menuItemText}>Ventes / Locations</Text>
//               </TouchableOpacity>
//             </View>
//           </TouchableOpacity>
//         </Modal>

//         {graphType === 'pie' ? (
//           <View style={styles.pieWrapper}>
//             <View style={{ alignItems: 'center', justifyContent: 'center' }}>
//               <Svg width={size} height={size}>
//                 <G rotation="-90" originX={size / 2} originY={size / 2}>
//                   {segments.map((segment, index) => {
//                     const arc = (segment.value / 100) * circumference;
//                     const circle = (
//                       <Circle
//                         key={index}
//                         stroke={segment.color}
//                         fill="transparent"
//                         strokeWidth={strokeWidth}
//                         strokeDasharray={`${arc} ${circumference - arc}`}
//                         strokeDashoffset={-(startAngle / 360) * circumference}
//                         r={radius}
//                         cx={size / 2}
//                         cy={size / 2}
//                       />
//                     );
//                     startAngle += (segment.value / 100) * 360;
//                     return circle;
//                   })}
//                 </G>
//               </Svg>
//               <View style={styles.centerText}>
//                 <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{totalVoitures}</Text>
//                 <Text style={{ fontSize: 12, color: '#666' }}>Voitures</Text>
//                 <Text style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
//                   {voituresVente + voituresLocation} actives
//                 </Text>
//               </View>
//             </View>

//             <View style={styles.statsLegendRight}>
//               {segments.map((segment, index) => (
//                 <View key={index} style={styles.legendItem}>
//                   <View style={[styles.legendCircle, { backgroundColor: segment.color }]} />
//                   <View style={{ flexDirection: 'column' }}>
//                     <Text style={styles.legendPercentage}>
//                       {segment.originalPercentage.toFixed(0)}%
//                     </Text>
//                     <Text style={styles.legendStatus}>{segment.label}</Text>
//                   </View>
//                   <Text style={styles.legendCount}>{segment.count}</Text>
//                 </View>
//               ))}
//             </View>
//           </View>
//         ) : (
//           renderBarChart()
//         )}
//       </View>
//     );
//   };

//   if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color="#FD6A00" style={{ marginTop: 50 }} /></SafeAreaView>;
//   if (!parkingData) return <SafeAreaView style={styles.container}><Text style={styles.errorText}>Aucune donnée de parking disponible</Text></SafeAreaView>;

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.searchContainerSticky}>
//         <Ionicons name="search" size={20} color="#666" style={{ marginRight: 10 }} />
//         <TextInput
//           style={styles.searchInputLeft}
//           placeholder="Rechercher une voiture..."
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//         />
//       </View>

//       {sticky && <View style={styles.stickyFloatingButtons}>{renderBottomButtons()}</View>}

//       <ScrollView onScroll={handleScroll} scrollEventThrottle={16}>
//         <View style={styles.headerRow}>
//           <Text style={styles.title}>Gérer vos voitures</Text>
//           <TouchableOpacity style={styles.addButton} onPress={() => router.push('../(ParkingDetail)/AjoutParking')}>
//             <Ionicons name="add-circle" size={24} color="#FD6A00" />
//             <Text style={styles.addText}>Ajouter</Text>
//           </TouchableOpacity>
//         </View>

//         <Text style={styles.total}>Total des voitures : {totalVoitures}</Text>

//         {renderGraphContainer()}

//         {!sticky && renderBottomButtons()}

//         <View style={{ marginTop: 20 }}>
//           {filteredVoitures.length === 0 ? (
//             <View style={styles.emptyState}>
//               <Ionicons name="car-outline" size={50} color="#ccc" />
//               <Text style={styles.emptyStateText}>
//                 {selectedBottomFilter === 'Tous' 
//                   ? 'Aucune voiture dans votre parking' 
//                   : `Aucune voiture ${selectedBottomFilter.toLowerCase()}`
//                 }
//               </Text>
//             </View>
//           ) : (
//             filteredVoitures.map(voiture => (
//               <TouchableOpacity 
//                 key={voiture.id} 
//                 style={styles.voitureCard}
//                 onPress={() => handleVoiturePress(voiture)}
//               >
//                 <View style={styles.voitureInfo}>
//                   <Image
//                     source={voiture.photos && voiture.photos.length > 0 ? { uri: voiture.photos[0] } : getImageSource(voiture.forSale, voiture.forRent)}
//                     style={styles.voitureImageClickable}
//                     defaultSource={getImageSource(voiture.forSale, voiture.forRent)}
//                   />
//                   <View style={styles.voitureDetails}>
//                     <Text style={styles.voitureName}>
//                       {voiture.marqueRef.name} {voiture.model}
//                     </Text>
//                     <Text style={styles.voitureStatus}>
//                       {getStatusLabel(voiture.forSale, voiture.forRent, voiture.status)}
//                     </Text>
//                     <Text style={styles.voiturePrice}>{voiture.prix.toLocaleString()} FCFA</Text>
                    
//                     {/* AFFICHER LES DÉTAILS SUPPLÉMENTAIRES */}
//                     {renderAdditionalDetails(voiture)}
                    
//                     {voiture.stats && voiture.stats.reservationsActives > 0 && (
//                       <Text style={styles.reservationActive}>
//                         {voiture.stats.reservationsActives} réservation(s) active(s)
//                       </Text>
//                     )}
                    
//                     {voiture.nextReservation && (
//                       <Text style={styles.nextReservation}>
//                         Prochaine réservation: {new Date(voiture.nextReservation.date).toLocaleDateString()}
//                       </Text>
//                     )}
//                   </View>
//                 </View>
//               </TouchableOpacity>
//             ))
//           )}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 20 },
//   headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
//   title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
//   addButton: { flexDirection: 'row', alignItems: 'center' },
//   addText: { marginLeft: 5, color: '#FD6A00', fontWeight: 'bold' },
//   total: { fontSize: 14, color: '#666', marginTop: 8 },
//   searchContainerSticky: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f1f1f1',
//     borderRadius: 25,
//     paddingHorizontal: 8,
//     marginBottom: 10,
//     height: 50,
//   },
//   searchInputLeft: { flex: 1, fontSize: 14, color: '#333' },
//   stickyFloatingButtons: { 
//     position: 'absolute', 
//     top: 70, 
//     left: 20, 
//     right: 20, 
//     flexDirection: 'row', 
//     justifyContent: 'space-around', 
//     zIndex: 1000, 
//     backgroundColor: 'white', 
//     padding: 10, 
//     borderRadius: 25, 
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   bottomButtonsContainer: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-around', 
//     marginTop: 20, 
//     flexWrap: 'wrap' 
//   },
//   bottomButton: { 
//     paddingVertical: 12, 
//     paddingHorizontal: 15, 
//     borderRadius: 25, 
//     backgroundColor: '#FFD1A3', 
//     margin: 5,
//     minWidth: 100,
//     alignItems: 'center',
//   },
//   bottomButtonActive: { backgroundColor: '#FD6A00' },
//   bottomButtonText: { color: '#FD6A00', fontWeight: 'bold', fontSize: 12 },
//   bottomButtonTextActive: { color: '#fff' },
//   voitureCard: { 
//     marginBottom: 12, 
//     padding: 12, 
//     backgroundColor: '#fff', 
//     borderRadius: 10, 
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.2,
//     shadowRadius: 1,
//   },
//   voitureInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   voitureImageClickable: { 
//     width: 100, 
//     height: 80, 
//     borderRadius: 10, 
//     resizeMode: 'cover' 
//   },
//   voitureDetails: {
//     flex: 1,
//     marginLeft: 10,
//   },
//   voitureName: { 
//     fontSize: 18, 
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   voitureStatus: { 
//     fontSize: 14, 
//     color: '#666',
//     marginTop: 2,
//   },
//   voiturePrice: { 
//     fontSize: 16, 
//     fontWeight: 'bold', 
//     color: '#FD6A00',
//     marginTop: 4,
//   },
//   // NOUVEAU STYLE POUR LES DÉTAILS SUPPLÉMENTAIRES
//   additionalDetails: {
//     fontSize: 12,
//     color: '#666',
//     marginTop: 4,
//     fontStyle: 'italic',
//   },
//   reservationActive: {
//     fontSize: 12, 
//     color: '#666', 
//     fontWeight: 'bold',
//     marginTop: 2,
//   },
//   nextReservation: {
//     fontSize: 12, 
//     color: '#666',
//     marginTop: 2,
//   },
//   errorText: { 
//     textAlign: 'center', 
//     marginTop: 50, 
//     color: '#666', 
//     fontSize: 16 
//   },
//   centerText: { 
//     position: 'absolute', 
//     top: '40%', 
//     left: 0, 
//     right: 0, 
//     alignItems: 'center' 
//   },
//   graphContainer: { 
//     backgroundColor: '#fff', 
//     borderRadius: 15, 
//     padding: 15, 
//     marginTop: 20, 
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   graphHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   pieWrapper: { 
//     flexDirection: 'row', 
//     alignItems: 'center', 
//     justifyContent: 'center' 
//   },
//   graphTitle: { 
//     fontSize: 16, 
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   settingsIcon: { 
//     padding: 5,
//   },
//   modalOverlay: { 
//     flex: 1, 
//     backgroundColor: 'rgba(0,0,0,0.3)', 
//     justifyContent: 'center', 
//     alignItems: 'center' 
//   },
//   menuContainer: { 
//     backgroundColor: '#fff', 
//     borderRadius: 15, 
//     padding: 15, 
//     width: 200,
//     elevation: 5,
//   },
//   menuItem: { 
//     paddingVertical: 12,
//     paddingHorizontal: 10,
//     borderRadius: 8,
//   },
//   menuItemText: { 
//     fontSize: 14, 
//     color: '#333' 
//   },
//   menuItemActiveText: { 
//     fontSize: 14, 
//     color: '#FD6A00', 
//     fontWeight: 'bold' 
//   },
//   statsLegendRight: { 
//     marginLeft: 20 
//   },
//   legendItem: { 
//     flexDirection: 'row', 
//     alignItems: 'center', 
//     marginBottom: 12,
//     width: 120,
//   },
//   legendCircle: { 
//     width: 12, 
//     height: 12, 
//     borderRadius: 6, 
//     marginRight: 8 
//   },
//   legendPercentage: { 
//     fontSize: 12, 
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   legendStatus: { 
//     fontSize: 10, 
//     color: '#666' 
//   },
//   legendCount: { 
//     marginLeft: 'auto', 
//     fontSize: 12, 
//     fontWeight: 'bold', 
//     color: '#FD6A00' 
//   },
//   barChartContainer: {
//     height: 220,
//   },
//   chartLegend: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginTop: 15,
//     paddingHorizontal: 15,
//   },
//   legendColor: {
//     width: 12,
//     height: 12,
//     borderRadius: 2,
//     marginRight: 5,
//   },
//   legendText: {
//     fontSize: 12,
//     color: '#666',
//   },
//   emptyState: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 40,
//   },
//   emptyStateText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//   },
// });

// export default MonParkingScreen;


import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getParkingManagementData, setAuthToken } from '../../components/services/back';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Vehicule = {
  id: string;
  marqueRef: { name: string };
  model: string;
  status: string;
  photos: string[];
  prix: number;
  forSale: boolean;
  forRent: boolean;
  stats?: { vues: number; reservations: number; favoris: number; reservationsActives: number };
  nextReservation?: { type: string; date: string; client: string };
  dureeGarantie?: number;
  mileage?: number;
  fuelType?: string;
};

type ParkingData = {
  parking: { id: string; name: string; address: string; phone: string; logo: string };
  statistics: {
    total: number; vendus: number; enLocation: number; disponibles: number;
    enMaintenance: number; indisponibles: number; totalVues: number;
    totalReservations: number; totalFavoris: number; reservationsActives: number;
    monthlySales: number; monthlyRentals: number;
  };
  vehicles: Vehicule[];
  charts: {
    monthlyData: { labels: string[]; sales: number[]; rentals: number[] };
    statusDistribution: { labels: string[]; data: number[] };
  };
};

const MonParkingScreen: React.FC = () => {
  const { authState, refreshAuth } = useAuth();
  const [parkingData, setParkingData] = useState<ParkingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedBottomFilter, setSelectedBottomFilter] = useState('Tous');
  const [graphType, setGraphType] = useState<'pie' | 'bar'>('pie');
  const [menuVisible, setMenuVisible] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const handleSearchSubmit = () => {
    if (searchQuery.trim().length > 0) {
      setDebouncedQuery(searchQuery.trim());
    }
  };

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setDebouncedQuery('');
    }
  }, [searchQuery]);

  // Chargement des données
  useEffect(() => {
    const fetchParkingData = async () => {
      setLoading(true);
      try {
        if (authState.accessToken) {
          setAuthToken(authState.accessToken);
          const data = await getParkingManagementData();
          setParkingData(data);
        }
      } catch (error: any) {
        if (error.response?.status === 403) {
          const success = await refreshAuth();
          if (success && typeof success === 'string') {
            setAuthToken(success);
            try {
              const data = await getParkingManagementData();
              setParkingData(data);
            } catch (retryError) {
              console.error('Erreur après rafraîchissement:', retryError);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };
    if (authState.accessToken) fetchParkingData();
    else setLoading(false);
  }, [authState.accessToken]);

  // Statistiques
  const totalVoitures = parkingData?.statistics.total || 0;
  const calculateStatisticsFromVehicles = () => {
    if (!parkingData?.vehicles) return { voituresVente: 0, voituresLocation: 0, voituresAvecReservations: 0, localResCount: 0 };
    const vehicles = parkingData.vehicles;
    const voituresVente = vehicles.filter(v => v.forSale === true && v.status !== 'ACHETE').length;
    const voituresLocation = vehicles.filter(v => v.forRent === true && v.status !== 'EN_LOCATION').length;
    const localResCount = vehicles.reduce((sum, v) => sum + (v.stats?.reservationsActives || v.stats?.reservations || 0), 0);
    const voituresAvecReservations = vehicles.filter(v => (v.stats?.reservationsActives || 0) > 0 || (v.stats?.reservations || 0) > 0).length;
    return { voituresVente, voituresLocation, voituresAvecReservations, localResCount };
  };
  const { voituresVente, voituresLocation, voituresAvecReservations, localResCount } = calculateStatisticsFromVehicles();
  const voituresActives = voituresVente + voituresLocation;
  const voituresReservation = localResCount || parkingData?.statistics.reservationsActives || parkingData?.statistics.totalReservations || 0;

  // Données pour le donut
  const totalActivite = voituresLocation + voituresVente + voituresAvecReservations || 1;
  const pourcentageLocation = (voituresLocation / totalActivite) * 100;
  const pourcentageVente = (voituresVente / totalActivite) * 100;
  const pourcentageReservation = (voituresAvecReservations / totalActivite) * 100;
  const size = 180;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const segments = [
    { value: pourcentageLocation, color: '#FF6B35', label: 'En location', count: voituresLocation },
    { value: pourcentageVente, color: '#FFD166', label: 'En vente', count: voituresVente },
    { value: pourcentageReservation, color: '#E8E8E8', label: 'Avec réservations', count: voituresAvecReservations },
  ];

  // Liste principale filtrée par le sélecteur (pas par la recherche)
  const filteredVoitures = parkingData?.vehicles.filter(v => {
    if (selectedBottomFilter === 'En vente') return v.forSale === true && v.status !== 'ACHETE';
    if (selectedBottomFilter === 'En location') return v.forRent === true && v.status !== 'EN_LOCATION';
    return true;
  }) || [];

  // Résultats pour la modale (après délai)
  const modalResults = parkingData?.vehicles.filter(v => {
    const query = debouncedQuery.toLowerCase().trim();
    if (!query) return false;
    const marque = v.marqueRef?.name?.toLowerCase() || '';
    const model = v.model?.toLowerCase() || '';
    return marque.includes(query) || model.includes(query);
  }) || [];

  // Fonctions utilitaires (inchangées)
  const getImageSource = (forSale: boolean, forRent: boolean) => {
    if (forRent) return require('../../assets/images/location.jpeg');
    if (forSale) return require('../../assets/images/vente.png');
    return require('../../assets/images/disponible.png');
  };
  const getStatusLabel = (forSale: boolean, forRent: boolean, status: string) => {
    if (status && status !== 'DISPONIBLE') {
      const statusMap: Record<string, string> = {
        'EN_LOCATION': 'En location', 'ACHETE': 'Vendu', 'DISPONIBLE': 'Disponible',
        'EN_MAINTENANCE': 'Maintenance', 'INDISPONIBLE': 'Indisponible',
      };
      return statusMap[status] || status;
    }
    if (forSale && forRent) return 'Vente & Location';
    if (forSale) return 'En vente';
    if (forRent) return 'En location';
    return 'Disponible';
  };
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'EN_LOCATION': '#FF6B35', 'ACHETE': '#4CAF50', 'DISPONIBLE': '#4CAF50',
      'EN_MAINTENANCE': '#FFC107', 'INDISPONIBLE': '#9E9E9E',
    };
    return colorMap[status] || '#666';
  };
  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, any> = {
      'EN_LOCATION': 'key-outline', 'ACHETE': 'checkmark-circle-outline',
      'DISPONIBLE': 'car-outline', 'EN_MAINTENANCE': 'construct-outline',
      'INDISPONIBLE': 'close-circle-outline',
    };
    return iconMap[status] || 'car-outline';
  };
  const renderAdditionalDetails = (vehicule: Vehicule) => {
    const details = [];
    if (vehicule.mileage) details.push(`${vehicule.mileage.toLocaleString()} km`);
    if (vehicule.fuelType) details.push(vehicule.fuelType);
    if (vehicule.dureeGarantie) details.push(`Garantie ${vehicule.dureeGarantie} mois`);
    if (details.length === 0) return null;
    return (
      <View style={styles.additionalDetailsContainer}>
        {details.map((detail, idx) => (
          <View key={idx} style={styles.detailBadge}>
            <Ionicons name="information-circle-outline" size={10} color="#666" />
            <Text style={styles.detailText}>{detail}</Text>
          </View>
        ))}
      </View>
    );
  };

  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
  };

  const handleVoiturePress = (vehicule: Vehicule) => {
    clearSearch();
    router.push({
      pathname: "/(Clients)/CreateListingScreen",
      params: { vehicule: JSON.stringify(vehicule), isParkingView: 'true' }
    });
  };

  const VehicleCard = ({ vehicule }: { vehicule: Vehicule }) => (
    <TouchableOpacity style={styles.voitureCard} onPress={() => handleVoiturePress(vehicule)} activeOpacity={0.9}>
      <Image
        source={vehicule.photos?.[0] ? { uri: vehicule.photos[0] } : getImageSource(vehicule.forSale, vehicule.forRent)}
        style={styles.voitureImage}
        defaultSource={getImageSource(vehicule.forSale, vehicule.forRent)}
      />
      <View style={styles.voitureContent}>
        <View style={styles.voitureHeader}>
          <Text style={styles.voitureName}>{vehicule.marqueRef.name} {vehicule.model}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(vehicule.status) + '20' }]}>
            <Ionicons name={getStatusIcon(vehicule.status)} size={10} color={getStatusColor(vehicule.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(vehicule.status) }]}>
              {getStatusLabel(vehicule.forSale, vehicule.forRent, vehicule.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.voiturePrice}>{vehicule.prix.toLocaleString()} FCFA</Text>
        {renderAdditionalDetails(vehicule)}
        {vehicule.stats && vehicule.stats.reservationsActives > 0 && (
          <View style={styles.reservationBadge}>
            <Ionicons name="calendar-outline" size={14} color="#FF6B35" />
            <Text style={styles.reservationText}>{vehicule.stats.reservationsActives} réservation(s) active(s)</Text>
          </View>
        )}
        {vehicule.nextReservation && (
          <Text style={styles.nextReservation}>
            Prochaine réservation: {new Date(vehicule.nextReservation.date).toLocaleDateString()}
          </Text>
        )}
      </View>
      <View style={styles.cardArrow}><Ionicons name="chevron-forward" size={20} color="#ccc" /></View>
    </TouchableOpacity>
  );

  // Gestion du scroll (plus de sticky)
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <View style={styles.statIconContainer}><Ionicons name={icon} size={24} color={color} /></View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  // Graphiques
  const renderDonutChart = () => {
    let startAngle = -90;
    return (
      <View style={styles.donutContainer}>
        <View style={styles.donutChartWrapper}>
          <Svg width={size} height={size}>
            <Circle cx={size/2} cy={size/2} r={radius} stroke="#E8E8E8" strokeWidth={strokeWidth} fill="transparent" />
            {segments.map((segment, idx) => {
              if (segment.value === 0) return null;
              const arc = (segment.value/100)*circumference;
              const circle = (
                <Circle key={idx} stroke={segment.color} fill="transparent" strokeWidth={strokeWidth}
                  strokeDasharray={`${arc} ${circumference-arc}`}
                  strokeDashoffset={-(startAngle/360)*circumference} strokeLinecap="round"
                  r={radius} cx={size/2} cy={size/2} />
              );
              startAngle += (segment.value/100)*360;
              return circle;
            })}
          </Svg>
          <View style={styles.donutCenterText}>
            <Text style={styles.donutCenterNumber}>{totalVoitures}</Text>
            <Text style={styles.donutCenterLabel}>Voitures</Text>
            <View style={styles.donutActiveBadge}><Text style={styles.donutActiveText}>{voituresActives} actives</Text></View>
          </View>
        </View>
        <View style={styles.donutLegend}>
          {segments.map((seg, idx) => (
            <View key={idx} style={styles.donutLegendItem}>
              <View style={[styles.donutLegendColor, { backgroundColor: seg.color }]} />
              <Text style={styles.donutLegendLabel}>{seg.label}</Text>
              <Text style={styles.donutLegendPercentage}>{Math.round(seg.value)}%</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderBarChart = () => {
    const monthlyData = parkingData?.charts?.monthlyData;
    if (!monthlyData || !monthlyData.labels) return null;
    
    // Déterminer le mois actuel pour l'affichage (robuste face aux locales/polices)
    const currentMonthNum = new Date().getMonth();
    const frMonths = ["jan", "fev", "mar", "avr", "mai", "juin", "juil", "aou", "sep", "oct", "nov", "dec"];
    const frMonthsLong = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];
    
    const removeAccents = (str: string) => {
      return str.replace(/[éèêë]/g, 'e').replace(/[àâä]/g, 'a').replace(/[îï]/g, 'i').replace(/[ôö]/g, 'o').replace(/[ûüù]/g, 'u').replace(/[ç]/g, 'c');
    };

    let currentMonthAbsIndex = monthlyData.labels.findIndex(label => {
      const norm = removeAccents(label.toLowerCase());
      return norm.includes(frMonths[currentMonthNum]) || norm.includes(frMonthsLong[currentMonthNum]);
    });

    if (currentMonthAbsIndex === -1) {
      currentMonthAbsIndex = monthlyData.labels.length - 1; // Fallback au dernier si on ne trouve pas
    }

    const itemsToShow = 6;
    let startIndex = Math.max(0, currentMonthAbsIndex - itemsToShow + 1);
    let endIndex = currentMonthAbsIndex + 1;

    // Ordre chronologique: de gauche à droite
    let displayedLabels = monthlyData.labels.slice(startIndex, endIndex);
    let displayedSales = monthlyData.sales.slice(startIndex, endIndex);
    let displayedRentals = monthlyData.rentals.slice(startIndex, endIndex);

    const maxValue = Math.max(...displayedSales, ...displayedRentals, 1);
    const chartHeight = 150;
    const barWidth = 30;
    const spacing = 20;
    const totalWidth = displayedLabels.length * (barWidth * 2 + spacing);

    return (
      <View style={styles.barChartContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:20}}>
          <View style={{width: totalWidth + 60, height: chartHeight + 80}}>
            {[0, 25, 50, 75, 100].map((percent, i) => {
              // y est décalé de 20 (marginTop du row)
              const y = 20 + chartHeight - (percent / 100) * chartHeight;
              const labelValue = Math.round((percent / 100) * maxValue);
              return (
                <View key={i} style={[styles.chartGridLine, {top: y, width: totalWidth + 40, left: 20}]}>
                  <Text style={styles.chartGridLabel}>{labelValue}</Text>
                </View>
              );
            })}
            <View style={{flexDirection: 'row', marginTop: 20, marginLeft: 20}}>
              {displayedLabels.map((label, idx) => {
                const isCurrentMonth = idx === displayedLabels.length - 1;
                const salesHeight = (displayedSales[idx] / maxValue) * chartHeight;
                const rentalsHeight = (displayedRentals[idx] / maxValue) * chartHeight;
                return (
                  <View key={idx} style={{width: barWidth * 2 + spacing, alignItems: 'center'}}>
                    <View style={{flexDirection: 'row', alignItems: 'flex-end', height: chartHeight}}>
                      <View style={[styles.bar, {height: salesHeight, backgroundColor: '#FF6B35', width: barWidth, marginRight: 4}]}>
                        {displayedSales[idx] > 0 && <Text style={styles.barLabel}>{displayedSales[idx]}</Text>}
                      </View>
                      <View style={[styles.bar, {height: rentalsHeight, backgroundColor: '#FFD166', width: barWidth}]}>
                        {displayedRentals[idx] > 0 && <Text style={styles.barLabel}>{displayedRentals[idx]}</Text>}
                      </View>
                    </View>
                    <Text style={[styles.barXLabel, isCurrentMonth && styles.currentMonthLabel]}>
                      {label}{isCurrentMonth && <Text style={styles.currentMonthIndicator}> ●</Text>}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}><View style={[styles.legendColor, {backgroundColor:'#FF6B35'}]} /><Text style={styles.legendText}>Ventes</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendColor, {backgroundColor:'#FFD166'}]} /><Text style={styles.legendText}>Locations</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendColor, {backgroundColor:'transparent'}]} /><Text style={styles.legendText}>● Mois actuel</Text></View>
        </View>
      </View>
    );
  };

  const renderGraphContainer = () => (
    <View style={styles.graphContainer}>
      <View style={styles.graphHeader}>
        <Text style={styles.graphTitle}>{graphType === 'pie' ? 'Résumé voitures' : 'Ventes et locations mensuelle'}</Text>
        <TouchableOpacity onPress={()=>setMenuVisible(true)}><Ionicons name="options-outline" size={22} color="#FF6B35" /></TouchableOpacity>
      </View>
      {menuVisible && (
        <TouchableOpacity style={styles.modalOverlay} onPress={()=>setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={()=>{setGraphType('pie'); setMenuVisible(false);}}>
              <Ionicons name="pie-chart-outline" size={20} color={graphType==='pie'?'#FF6B35':'#666'} />
              <Text style={[styles.menuItemText, graphType==='pie'&&styles.menuItemActiveText]}>Résumé voitures</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={()=>{setGraphType('bar'); setMenuVisible(false);}}>
              <Ionicons name="bar-chart-outline" size={20} color={graphType==='bar'?'#FF6B35':'#666'} />
              <Text style={[styles.menuItemText, graphType==='bar'&&styles.menuItemActiveText]}>Ventes / Locations</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
      {graphType === 'pie' ? renderDonutChart() : renderBarChart()}
    </View>
  );

  if (loading) return (
    <View style={styles.container}>
      <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#FF6B35" /><Text style={styles.loadingText}>Chargement...</Text></View>
    </View>
  );
  if (!parkingData) return (
    <View style={styles.container}>
      <View style={styles.errorContainer}><Ionicons name="car-outline" size={80} color="#ccc" /><Text style={styles.errorText}>Aucune donnée</Text><TouchableOpacity style={styles.retryButton} onPress={()=>setLoading(true)}><Text style={styles.retryButtonText}>Réessayer</Text></TouchableOpacity></View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Champ de recherche toujours visible */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une voiture..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Modale de recherche (slide depuis le bas) */}
      <Modal
        visible={debouncedQuery.length > 0}
        animationType="slide"
        transparent={true}
        onRequestClose={clearSearch}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={clearSearch}>
          <View style={styles.modalContentContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalResults.length} résultat(s) pour "{debouncedQuery}"
              </Text>
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalResultsList}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
              {modalResults.length === 0 ? (
                <View style={styles.modalEmptyState}>
                  <Ionicons name="car-outline" size={60} color="#ccc" />
                  <Text style={styles.modalEmptyText}>Aucun véhicule trouvé</Text>
                </View>
              ) : (
                modalResults.map(vehicule => <VehicleCard key={vehicule.id} vehicule={vehicule} />)
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Contenu principal (plus de barre sticky) */}
      <Animated.ScrollView onScroll={handleScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Gestion de votre parking</Text>
          <TouchableOpacity style={styles.addButton} onPress={()=>router.push('../(ParkingDetail)/AjoutParking')}>
            <Ionicons name="add-circle" size={24} color="#FF6B35" /><Text style={styles.addText}>Ajouter</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsGrid}>
          <StatCard title="Total véhicules" value={totalVoitures} icon="car-outline" color="#FF6B35" />
          <StatCard title="En vente" value={voituresVente} icon="cash-outline" color="#FF6B35" />
          <StatCard title="En location" value={voituresLocation} icon="key-outline" color="#FF6B35" />
          <StatCard title="Réservations" value={voituresReservation} icon="calendar-outline" color="#FF6B35" />
        </View>
        {renderGraphContainer()}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Vos véhicules</Text>
          <View style={styles.filterButtons}>
            {['Tous','En vente','En location'].map(filter=>(
              <TouchableOpacity key={filter} style={[styles.filterButton, selectedBottomFilter===filter && styles.filterButtonActive]} onPress={()=>setSelectedBottomFilter(filter)}>
                <Text style={[styles.filterButtonText, selectedBottomFilter===filter && styles.filterButtonTextActive]}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.vehiclesList}>
          {filteredVoitures.length===0 ? (
            <View style={styles.emptyState}><Ionicons name="car-outline" size={60} color="#ccc" /><Text style={styles.emptyStateTitle}>Aucune voiture</Text><Text style={styles.emptyStateText}>Aucun véhicule ne correspond au filtre</Text></View>
          ) : (
            filteredVoitures.map(v=> <VehicleCard key={v.id} vehicule={v} />)
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
 
  scrollContent: { paddingBottom:30 },
  loadingContainer: { flex:1, justifyContent:'center', alignItems:'center' },
  loadingText: { marginTop:15, fontSize:16, color:'#666' },
  errorContainer: { flex:1, justifyContent:'center', alignItems:'center', padding:20 },
  errorText: { marginTop:20, fontSize:18, color:'#666', marginBottom:20 },
  retryButton: { backgroundColor:'#FF6B35', paddingHorizontal:30, paddingVertical:12, borderRadius:25 },
  retryButtonText: { color:'#fff', fontWeight:'600' },
  
  searchContainer: { flexDirection:'row', alignItems:'center', backgroundColor:'#fff', borderRadius:15, paddingHorizontal:15, marginHorizontal:20, marginTop:40, marginBottom:10, height:50, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:3, zIndex: 10 },
  searchInput: { flex:1, marginLeft:10, fontSize:16, color:'#333' },

  modalBackdrop: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  modalContentContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT - 100,
    minHeight: 200,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  modalResultsList: { paddingHorizontal: 20, paddingTop: 10 },
  modalEmptyState: { alignItems: 'center', paddingVertical: 60 },
  modalEmptyText: { fontSize: 16, color: '#999', marginTop: 15 },

  headerSection: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingTop:20, paddingBottom:10 },
  title: { fontSize:20, fontWeight:'bold', color:'#333' },
  addButton: { flexDirection:'row', alignItems:'center', backgroundColor:'#FFF5F0', paddingHorizontal:15, paddingVertical:10, borderRadius:25 },
  addText: { marginLeft:5, color:'#FF6B35', fontWeight:'600' },
  statsGrid: { flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', paddingHorizontal:20, marginTop:10 },
  statCard: { width:(SCREEN_WIDTH-60)/2, backgroundColor:'#fff', borderRadius:15, padding:15, marginBottom:15, borderTopWidth:3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:3 },
  statIconContainer: { marginBottom:10 },
  statValue: { fontSize:28, fontWeight:'bold', color:'#333' },
  statTitle: { fontSize:13, color:'#999', marginTop:5 },
  graphContainer: { backgroundColor:'#fff', borderRadius:20, padding:20, marginHorizontal:20, marginTop:10, marginBottom:20, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:3, zIndex: 1 },
  graphHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  graphTitle: { fontSize:16, fontWeight:'600', color:'#333' },
  modalOverlay: { position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center', zIndex: 100 },
  menuContainer: { backgroundColor:'#fff', borderRadius:15, padding:10, width:200 },
  menuItem: { flexDirection:'row', alignItems:'center', paddingVertical:12, paddingHorizontal:15, borderRadius:10 },
  menuItemText: { fontSize:14, color:'#666', marginLeft:10 },
  menuItemActiveText: { color:'#FF6B35', fontWeight:'600' },
  donutContainer: { alignItems:'center', paddingVertical:10 },
  donutChartWrapper: { position:'relative', alignItems:'center', justifyContent:'center' },
  donutCenterText: { position:'absolute', alignItems:'center', justifyContent:'center', top:0, left:0, right:0, bottom:0 },
  donutCenterNumber: { fontSize:28, fontWeight:'bold', color:'#333' },
  donutCenterLabel: { fontSize:12, color:'#666', marginTop:2 },
  donutActiveBadge: { backgroundColor:'#F0F0F0', paddingHorizontal:10, paddingVertical:3, borderRadius:12, marginTop:6 },
  donutActiveText: { fontSize:10, color:'#666', fontWeight:'500' },
  donutLegend: { flexDirection:'row', justifyContent:'center', flexWrap:'wrap', marginTop:20, gap:20 },
  donutLegendItem: { flexDirection:'row', alignItems:'center' },
  donutLegendColor: { width:10, height:10, borderRadius:5, marginRight:6 },
  donutLegendLabel: { fontSize:12, color:'#666', marginRight:4 },
  donutLegendPercentage: { fontSize:12, fontWeight:'600', color:'#333' },
  barChartContainer: { marginTop:10 },
  chartGridLine: { position:'absolute', borderTopWidth:1, borderTopColor:'#F0F0F0', justifyContent:'flex-end', alignItems:'flex-start' },
  chartGridLabel: { position:'absolute', left:-25, top:-8, fontSize:10, color:'#999' },
  bar: { borderRadius:8, justifyContent:'flex-end', alignItems:'center', overflow:'hidden' },
  barLabel: { fontSize:10, color:'#fff', fontWeight:'bold', marginBottom:4 },
  barXLabel: { marginTop:8, fontSize:12, color:'#666', textAlign:'center' },
  currentMonthLabel: { color:'#FF6B35', fontWeight:'600' },
  currentMonthIndicator: { fontSize:8, color:'#FF6B35' },
  chartLegend: { flexDirection:'row', justifyContent:'center', marginTop:20, flexWrap:'wrap', gap:15 },
  legendItem: { flexDirection:'row', alignItems:'center' },
  legendColor: { width:10, height:10, borderRadius:2, marginRight:6 },
  legendText: { fontSize:12, color:'#666' },
  filterSection: { paddingHorizontal:20, marginTop:10, marginBottom:15 },
  sectionTitle: { fontSize:18, fontWeight:'600', color:'#333', marginBottom:15 },
  filterButtons: { flexDirection:'row' },
  filterButton: { paddingHorizontal:20, paddingVertical:10, borderRadius:25, backgroundColor:'#F0F0F0', marginRight:10 },
  filterButtonActive: { backgroundColor:'#FF6B35' },
  filterButtonText: { fontSize:14, color:'#666' },
  filterButtonTextActive: { color:'#fff', fontWeight:'600' },
  vehiclesList: { paddingHorizontal:20 },
  voitureCard: { flexDirection:'row', backgroundColor:'#fff', borderRadius:15, padding:15, marginBottom:15, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:3 },
  voitureImage: { width:100, height:100, borderRadius:12, resizeMode:'cover' },
  voitureContent: { flex:1, marginLeft:12 },
  voitureHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap' },
  voitureName: { fontSize:16, fontWeight:'bold', color:'#333', flex:1 },
  statusBadge: { flexDirection:'row', alignItems:'center', paddingHorizontal:8, paddingVertical:4, borderRadius:12, marginLeft:8, gap:4 },
  statusText: { fontSize:11, fontWeight:'600' },
  voiturePrice: { fontSize:18, fontWeight:'bold', color:'#FF6B35', marginTop:6 },
  additionalDetailsContainer: { flexDirection:'row', flexWrap:'wrap', marginTop:8, gap:8 },
  detailBadge: { flexDirection:'row', alignItems:'center', backgroundColor:'#F8F9FA', paddingHorizontal:8, paddingVertical:4, borderRadius:12, gap:4 },
  detailText: { fontSize:11, color:'#666' },
  reservationBadge: { flexDirection:'row', alignItems:'center', marginTop:8, gap:6 },
  reservationText: { fontSize:12, color:'#FF6B35' },
  nextReservation: { fontSize:12, color:'#999', marginTop:4 },
  cardArrow: { justifyContent:'center', marginLeft:8 },
  emptyState: { alignItems:'center', justifyContent:'center', paddingVertical:60 },
  emptyStateTitle: { fontSize:18, fontWeight:'600', color:'#666', marginTop:15 },
  emptyStateText: { fontSize:14, color:'#999', marginTop:8, textAlign:'center' },
});

export default MonParkingScreen;