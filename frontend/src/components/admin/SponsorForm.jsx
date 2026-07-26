import { Plus } from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const CATEGORIES = ["food", "drinks", "bars", "desserts"];
const PRICES = ["$", "$$", "$$$", "$$$$"];

export function SponsorForm({ form, set, saving, addSponsor }) {
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
