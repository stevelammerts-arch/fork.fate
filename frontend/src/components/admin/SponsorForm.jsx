import { Plus, Ticket } from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

// Keep in sync with BecomeSponsorDialog's CATEGORIES — this list was missing shops
// and fuel, so an admin could not create a sponsor for either.
const CATEGORIES = ["food", "drinks", "bars", "desserts", "shops", "fuel", "explore", "stay"];
const PRICES = ["$", "$$", "$$$", "$$$$"];
const DISCOUNT_TYPES = [
  { v: "percent", label: "% off" },
  { v: "fixed", label: "$ off" },
  { v: "free_item", label: "Free item" },
  { v: "bogo", label: "BOGO" },
  { v: "custom", label: "Other" },
];

export function SponsorForm({ form, set, saving, addSponsor }) {
  const coupon = form.coupon || {};
  const setCoupon = (k, v) => set("coupon", { ...coupon, [k]: v });
  const hasCoupon = !!(coupon.code || coupon.description);
  return (
    <section className="h-fit rounded-3xl border border-[#E2E4E7] bg-white p-6" data-testid="add-sponsor-form">
      <h2 className="font-serif text-xl text-[#0E0E0E]">Add a sponsor</h2>
      <p className="mt-1 font-sans text-sm text-[#6B7075]">Sponsored spots are pinned to the top of every matching search with a badge.</p>
      <div className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="s-name">Business name</Label>
          <Input id="s-name" data-testid="sponsor-name-input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Olive & Ember" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger data-testid="sponsor-category-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Price</Label>
            <Select value={form.price} onValueChange={(v) => set("price", v)}>
              <SelectTrigger data-testid="sponsor-price-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRICES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-cuisine">Cuisine / type</Label>
          <Input id="s-cuisine" data-testid="sponsor-cuisine-input" value={form.cuisine} onChange={(e) => set("cuisine", e.target.value)} placeholder="e.g. Italian, Cocktails, Ice Cream" />
          <p className="text-xs text-[#8A8F95]">Tip: match a cuisine chip name so it shows when that filter is on.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-addr">Address</Label>
          <Input id="s-addr" data-testid="sponsor-address-input" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Main St" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-img">Image URL <span className="text-[#B8BCC2]">(optional)</span></Label>
          <Input id="s-img" data-testid="sponsor-image-input" value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="https://…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-desc">Description</Label>
          <Textarea id="s-desc" data-testid="sponsor-description-input" value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Short tagline shown on the card" />
        </div>

        <div className="rounded-2xl border border-dashed border-[#F0A24E] bg-[#FFFCF3] p-4" data-testid="sponsor-coupon-block">
          <div className="mb-3 flex items-center gap-2">
            <Ticket className="h-4 w-4 text-[#B26A12]" />
            <span className="font-sans text-sm font-bold uppercase tracking-[0.14em] text-[#B26A12]">Coupon (optional · Coupon tier)</span>
          </div>
          <p className="mb-3 font-sans text-xs text-[#8A5210]">Adds a tap-to-reveal deal to this sponsor's fate card and its 3 alternates. Leave blank to skip.</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-code">Code</Label>
              <Input id="c-code" data-testid="coupon-code-input" value={coupon.code || ""} onChange={(e) => setCoupon("code", e.target.value.toUpperCase())} placeholder="FATE10" maxLength={32} />
            </div>
            <div className="space-y-1.5">
              <Label>Discount type</Label>
              <Select value={coupon.discount_type || "percent"} onValueChange={(v) => setCoupon("discount_type", v)}>
                <SelectTrigger data-testid="coupon-type-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DISCOUNT_TYPES.map((d) => <SelectItem key={d.v} value={d.v}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-value">Value</Label>
              <Input id="c-value" data-testid="coupon-value-input" type="number" min="0" value={coupon.discount_value ?? ""} onChange={(e) => setCoupon("discount_value", e.target.value === "" ? 0 : parseFloat(e.target.value))} placeholder="10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-exp">Expires <span className="text-[#B8BCC2]">(YYYY-MM-DD)</span></Label>
              <Input id="c-exp" data-testid="coupon-expiry-input" value={coupon.expires_at || ""} onChange={(e) => setCoupon("expires_at", e.target.value)} placeholder="2026-12-31" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <Label htmlFor="c-desc">Short description</Label>
            <Input id="c-desc" data-testid="coupon-description-input" value={coupon.description || ""} onChange={(e) => setCoupon("description", e.target.value)} placeholder="10% off any pizza" maxLength={140} />
          </div>
          <div className="mt-3 space-y-1.5">
            <Label htmlFor="c-terms">Fine print <span className="text-[#B8BCC2]">(optional)</span></Label>
            <Textarea id="c-terms" data-testid="coupon-terms-input" value={coupon.terms || ""} onChange={(e) => setCoupon("terms", e.target.value)} rows={2} placeholder="Dine-in only · not combinable" />
          </div>
          {hasCoupon && (
            <button
              type="button"
              onClick={() => set("coupon", null)}
              data-testid="coupon-clear-button"
              className="mt-3 font-sans text-xs font-semibold text-[#B26A12] underline underline-offset-2 hover:text-[#8A5210]"
            >
              Clear coupon
            </button>
          )}
        </div>

        <button
          onClick={addSponsor}
          disabled={saving}
          data-testid="add-sponsor-button"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E01E26] py-3 text-sm font-bold text-white transition-colors hover:bg-[#B3141A] disabled:opacity-70"
        >
          <Plus className="h-4 w-4" /> {saving ? "Adding…" : "Add sponsor"}
        </button>
      </div>
    </section>
  );
}
