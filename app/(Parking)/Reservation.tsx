import ReservationList from "../../components/screens/Reservation";
import {
  getReservationsParking,
  acceptReservationApi,
  declineReservationApi,
} from "../../components/services/reservationApi";

export default function ReservationsParking() {
  return (
    <ReservationList
      fetchReservations={getReservationsParking}
      acceptReservation={acceptReservationApi}
      declineReservation={declineReservationApi}
      isParking={true}
    />
  );
}