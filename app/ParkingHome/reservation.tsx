import React, { useEffect, useState } from "react";
import axios from "axios";

interface Vehicle {
  id: number;
  marque: string;
  model: string;
  photos: string[];
}

interface Reservation {
  id: number;
  dateDebut: string;
  dateFin: string;
  vehicle: Vehicle;
}

const ParkingReservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les réservations du parking
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const token = localStorage.getItem("token"); // JWT après login
        const res = await axios.get("http://localhost:5000/reservations/parking/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReservations(res.data);
      } catch (err) {
        console.error("Erreur lors du chargement des réservations", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  // Annuler une réservation
  const cancelReservation = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/reservations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReservations(reservations.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Erreur lors de l'annulation", err);
    }
  };

  if (loading) return <p className="text-center text-gray-500">Chargement...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Réservations du Parking</h2>

      {reservations.length === 0 ? (
        <p className="text-gray-500">Aucune réservation trouvée.</p>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="flex items-center justify-between border rounded-xl p-4 shadow-sm"
            >
              {/* Image + infos véhicule */}
              <div className="flex items-center gap-4">
                <img
                  src={reservation.vehicle.photos[0]}
                  alt={reservation.vehicle.marque}
                  className="w-28 h-20 object-cover rounded-lg"
                />
                <div>
                  <h4 className="text-lg font-semibold">
                    {reservation.vehicle.marque} {reservation.vehicle.model}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Du{" "}
                    <b>{new Date(reservation.dateDebut).toLocaleDateString()}</b>{" "}
                    au{" "}
                    <b>{new Date(reservation.dateFin).toLocaleDateString()}</b>
                  </p>
                </div>
              </div>

              {/* Bouton annuler */}
              <button
                onClick={() => cancelReservation(reservation.id)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-full transition"
              >
                Annuler
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParkingReservations;
