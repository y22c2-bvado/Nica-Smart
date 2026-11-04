
import { useEffect, useState } from "react";
import { getSeasonalPromotion } from "../utils/seasonalPromotions";

export default function useSeasonalPromotion() {
  const [campaign, setCampaign] = useState(
    () => getSeasonalPromotion()
  );

  useEffect(() => {
    const update = () => {
      setCampaign((previous) => {
        const current = getSeasonalPromotion();
        return previous?.id === current.id
          ? previous
          : current;
      });
    };

    // Revisión periódica por si cambia el día
    const timer = window.setInterval(update, 60000);

    // Actualizar al regresar a la pestaña
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return campaign;
}
