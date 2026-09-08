"use client";

import { useState, useEffect } from "react";
import CalendarView, { CalendarReservation } from "./CalendarView";
import ReservationModal from "./ReservationModal";
import NegotiationModal from "./NegotiationModal";
import { useRouter } from "next/navigation";

export default function DashboardCalendarSection({
  reservations,
}: {
  reservations: CalendarReservation[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<CalendarReservation | null>(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          setUserEmail(data.email || '');
          console.log("📧 Email utilisateur:", data.email);
        } else {
          console.error("❌ Erreur session:", res.status);
        }
      } catch (error) {
        console.error('❌ Erreur récupération session:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  function handleEventClick(id: string) {
    const r = reservations.find((res) => res.id === id) ?? null;
    setSelected(r);
    setIsReservationModalOpen(true);
  }

  function handleCloseReservationModal() {
    setIsReservationModalOpen(false);
    setSelected(null);
  }

  function handleNegotiate() {
    setIsReservationModalOpen(false);
    setIsNegotiationModalOpen(true);
  }

  function handleCloseNegotiationModal() {
    setIsNegotiationModalOpen(false);
  }

  function handleEdit(id: string) {
    setIsReservationModalOpen(false);
    router.push(`/reserve?edit=${id}`);
  }

  async function handleDelete(id: string) {
    if (!confirm("Voulez-vous vraiment supprimer cette réservation ?")) return;
    
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur lors de la suppression");
        return;
      }
      
      setIsReservationModalOpen(false);
      router.refresh();
    } catch (error) {
      alert("Erreur lors de la suppression");
    }
  }

  // ✅ Vérification du propriétaire
  const isOwner = selected && userEmail 
    ? selected.requesterEmail?.toLowerCase() === userEmail.toLowerCase()
    : false;

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div>
      <CalendarView 
        reservations={reservations} 
        onEventClick={handleEventClick}
        userEmail={userEmail}
      />

      <ReservationModal
        reservation={selected}
        isOpen={isReservationModalOpen}
        onClose={handleCloseReservationModal}
        onEdit={isOwner ? handleEdit : undefined}
        onDelete={isOwner ? handleDelete : undefined}
        onNegotiate={!isOwner ? handleNegotiate : undefined}
        isOwner={isOwner}
      />

      <NegotiationModal
        reservation={selected}
        isOpen={isNegotiationModalOpen}
        onClose={handleCloseNegotiationModal}
      />
    </div>
  );
}