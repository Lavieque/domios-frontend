import { useEffect, useState } from "react";
import { getPromotion } from "../api/client";
import { promotionTypeLabels, type PromotionDto } from "../api/types";
import { useT } from "../i18n";

interface PromotionBadgeProps {
  promotionId: string;
}

/**
 * Vai buscar a Promotion pelo id só quando o badge existe — evita N pedidos
 * extra em listas grandes de ofertas sem promoção (a maioria).
 */
export function PromotionBadge({ promotionId }: PromotionBadgeProps) {
  const [promotion, setPromotion] = useState<PromotionDto | null>(null);

  const t = useT();
  useEffect(() => {
    let cancelled = false;
    getPromotion(promotionId).then((result) => {
      if (!cancelled) {
        setPromotion(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [promotionId]);

  const title = promotion
    ? `${promotionTypeLabels[promotion.type]} — ${promotion.description}`
    : t.ui.promotion.loading;

  return (
    <span className="promotion-badge" title={title}>
      {t.ui.promotion.badge}
    </span>
  );
}
