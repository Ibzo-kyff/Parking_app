import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import ReservationList from "../../components/screens/Reservation";
import { getUserReservations, cancelReservationApi } from "../../components/services/reservationApi";
import Header from "../Header";

const ReservationsUser = () => {
  return (
      
    <ReservationList
      fetchReservations={getUserReservations}
      cancelReservation={cancelReservationApi}
    />
      
  );
};
const styles = StyleSheet.create({
  container: {  backgroundColor: '#f4f3f3', padding: 20, flex: 1},

})
export default ReservationsUser;