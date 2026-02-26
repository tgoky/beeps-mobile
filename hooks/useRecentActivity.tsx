import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";
import { useServiceRequests } from "./useProducers";
import { useStudios } from "./useStudios";
import { useUserCollaborations } from "./useUserProfile";

// This matches the type expected by CustomMapView
interface MapActivity {
  id: string;
  type: "studio_visit" | "collaboration";
  name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  avatarUrl?: string;
  sessionId?: string;
  details?: { label: string; value: string }[];
}

export function useRecentMapActivity() {
  const { user } = useAuth();

  // 1. Fetch all raw data
  const { data: collaborations } = useUserCollaborations(user?.id);
  const { data: requests } = useServiceRequests(user?.id);
  const { data: studios } = useStudios(); // We need this to look up Lat/Long for studioIds

  const activities = useMemo(() => {
    const mapItems: MapActivity[] = [];

    // --- A. Process Collaborations ---
    if (collaborations && studios) {
      collaborations.forEach((collab) => {
        // Try to find the studio location for this collab
        const studio = studios.find((s) => s.id === collab.studioId);

        // Only show on map if we have coordinates (Real data!)
        if (studio && studio.latitude && studio.longitude) {
          mapItems.push({
            id: `collab-${collab.id}`,
            type: "collaboration",
            name: collab.title || "Untitled Collab",
            latitude: studio.latitude,
            longitude: studio.longitude,
            timestamp: new Date(collab.createdAt).toLocaleDateString(),
            avatarUrl: collab.imageUrl, // Or the creator's avatar
            sessionId: collab.id,
            details: [
              { label: "Genre", value: collab.genre || "General" },
              { label: "Status", value: collab.status },
            ],
          });
        }
      });
    }

    // --- B. Process Service Requests (Studio/Producer Bookings) ---
    if (requests) {
      requests.forEach((req) => {
        // Only show active/completed sessions
        if (req.status === "ACCEPTED" || req.status === "COMPLETED") {
          // Logic: Does this producer have a studio we know about?
          // (In a real app, you might want to join the studio table in your SQL query)
          // For now, we'll try to find a studio owned by this producer in our loaded studios list
          const producerStudio = studios?.find(
            (s) => s.ownerId === req.producerId,
          );

          if (
            producerStudio &&
            producerStudio.latitude &&
            producerStudio.longitude
          ) {
            mapItems.push({
              id: `req-${req.id}`,
              type: "studio_visit",
              name: req.projectTitle || "Studio Session",
              latitude: producerStudio.latitude,
              longitude: producerStudio.longitude,
              timestamp: new Date(
                req.updatedAt || req.createdAt,
              ).toLocaleDateString(),
              avatarUrl: req.producer?.avatar, // Show producer's face
              sessionId: req.id,
              details: [
                {
                  label: "Producer",
                  value: req.producer?.username || "Unknown",
                },
                {
                  label: "Budget",
                  value: req.budget ? `$${req.budget}` : "N/A",
                },
              ],
            });
          }
        }
      });
    }

    return mapItems;
  }, [collaborations, requests, studios]);

  return { data: activities };
}
