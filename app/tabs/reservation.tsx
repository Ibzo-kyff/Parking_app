
import ReservationList from "../../components/screens/Reservation";
import { useAuth } from '../../context/AuthContext';
import { getUserReservations, cancelReservationApi } from "../../components/services/reservationApi";

export default function ReservationsUser() {
  return (
    <ReservationList
      fetchReservations={getUserReservations}
      cancelReservation={cancelReservationApi}
      isParking={false}
    />
  );
}