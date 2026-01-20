import ReservationList from "../../components/screens/Reservation";
import {
  getReservationsParking,
  acceptReservationApi,
  declineReservationApi,
  cancelReservationParkingApi,
} from "../../components/services/reservationApi";

export default function ReservationsParking() {
  return (
    <ReservationList
      fetchReservations={getReservationsParking}
      acceptReservation={acceptReservationApi}
      declineReservation={declineReservationApi}
      cancelReservation={cancelReservationParkingApi}
      isParking={true}
    />
  );
}