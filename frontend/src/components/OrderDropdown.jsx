import { ShoppingBag, ChevronDown, ExternalLink, UtensilsCrossed } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { useLang } from "../i18n/i18n";

// A single "Order / Delivery" button that opens a dropdown of delivery options
// (DoorDash, Uber Eats, Grubhub) plus the restaurant's own order/search link.
// Only renders options whose URL is present on the card.
export function OrderDropdown({ card, onOpen, label, className = "", triggerTestId = "order-dropdown-trigger" }) {
  const { t } = useLang();
  const options = [
    { key: "doordash", url: card.doordash_url, label: "DoorDash" },
    { key: "ubereats", url: card.ubereats_url, label: "Uber Eats" },
    { key: "grubhub", url: card.grubhub_url, label: "Grubhub" },
    { key: "order", url: card.order_url, label: t("Restaurant / order online") },
  ].filter((o) => !!o.url);

  if (options.length === 0) return null;

  const open = (url, key) => {
    if (onOpen) onOpen(key);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid={triggerTestId}
          onClick={(e) => e.stopPropagation()}
          className={className || "inline-flex items-center gap-2 rounded-full bg-[#E01E26] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#B3141A]"}
        >
          <ShoppingBag className="h-4 w-4" /> {label || t("Order / Delivery")}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52" data-testid="order-dropdown-content">
        {options.map((o) => (
          <DropdownMenuItem
            key={o.key}
            data-testid={`order-option-${o.key}`}
            onSelect={(e) => { e.preventDefault(); open(o.url, o.key); }}
            className="flex cursor-pointer items-center gap-2 font-semibold"
          >
            {o.key === "order" ? <UtensilsCrossed className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
            {o.label}
            <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-60" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
