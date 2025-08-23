import React from "react";
import ReservationList from "../../components/screens/Reservation";
import {
  getReservationsParking,
  cancelReservationApi,
} from "../../components/services/reservationApi";

const ReservationsParking = () => {
  return (
    <ReservationList
      fetchReservations={getReservationsParking}
      cancelReservation={cancelReservationApi}
    />
  );
};

export default ReservationsParking;
