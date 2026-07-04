import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FOOD_IMAGES = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?crop=entropy&cs=srgb&fm=jpg&q=85",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?crop=entropy&cs=srgb&fm=jpg&q=85",
  "https://images.unsplash.com/photo-1552611052-33e04de081de?crop=entropy&cs=srgb&fm=jpg&q=85",
];

const CUISINES = [
  "Italian", "Japanese", "Mexican", "Indian", "Chinese", "French",
  "Mediterranean", "Steakhouse", "Seafood", "Burgers", "Vegan", "Cafe", "Thai", "Korean",
];

const fieldCls =
  "rounded-xl border-[#EAE4D9] bg-[#FAF8F5] px-4 py-2.5 text-[#2C2A29] focus:ring-2 focus:ring-[#C84B31] focus:ring-offset-1 focus-visible:ring-[#C84B31]";

export default function AddRestaurantDialog({ onAdded }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    cuisine: "",
    price: "$$",
    rating: 4.5,
    distance: 1.0,
    description: "",
    address: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim() || !form.cuisine) {
      toast.error("Name and cuisine are required");
      return;
    }
    setSaving(true);
    try {
      const image = FOOD_IMAGES[Math.floor(Math.random() * FOOD_IMAGES.length)];
      const payload = {
        ...form,
        rating: parseFloat(form.rating) || 4.5,
        distance: parseFloat(form.distance) || 1.0,
        image,
      };
      const { data } = await axios.post(`${API}/restaurants`, payload);
      toast.success(`${data.name} added to the pool`);
      onAdded?.(data);
      setOpen(false);
      setForm({ name: "", cuisine: "", price: "$$", rating: 4.5, distance: 1.0, description: "", address: "" });
    } catch (e) {
      toast.error("Could not add restaurant");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          data-testid="open-add-restaurant-button"
          className="inline-flex items-center gap-2 rounded-full border border-[#EAE4D9] bg-white px-5 py-2.5 text-sm font-semibold text-[#2C2A29] transition-colors hover:bg-[#EAE4D9]"
        >
          <Plus className="h-4 w-4" /> Add spot
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-[#EAE4D9] bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl font-medium text-[#2C2A29]">
            Add a restaurant
          </DialogTitle>
          <DialogDescription className="font-sans text-sm text-[#7A7571]">
            Add a local spot to your roulette pool.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold tracking-[0.15em] uppercase text-[#7A7571]">Name</Label>
            <Input
              data-testid="add-name-input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. The Corner Bistro"
              className={fieldCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold tracking-[0.15em] uppercase text-[#7A7571]">Cuisine</Label>
              <Select value={form.cuisine} onValueChange={(v) => set("cuisine", v)}>
                <SelectTrigger data-testid="add-cuisine-select" className={fieldCls}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {CUISINES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold tracking-[0.15em] uppercase text-[#7A7571]">Price</Label>
              <Select value={form.price} onValueChange={(v) => set("price", v)}>
                <SelectTrigger data-testid="add-price-select" className={fieldCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="$">$ · Budget</SelectItem>
                  <SelectItem value="$$">$$ · Mid</SelectItem>
                  <SelectItem value="$$$">$$$ · Fancy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold tracking-[0.15em] uppercase text-[#7A7571]">Rating</Label>
              <Input
                data-testid="add-rating-input"
                type="number" step="0.1" min="0" max="5"
                value={form.rating}
                onChange={(e) => set("rating", e.target.value)}
                className={fieldCls}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold tracking-[0.15em] uppercase text-[#7A7571]">Distance (km)</Label>
              <Input
                data-testid="add-distance-input"
                type="number" step="0.1" min="0"
                value={form.distance}
                onChange={(e) => set("distance", e.target.value)}
                className={fieldCls}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold tracking-[0.15em] uppercase text-[#7A7571]">Description</Label>
            <Textarea
              data-testid="add-description-input"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What makes it special?"
              className={`${fieldCls} min-h-[80px]`}
            />
          </div>
        </div>
        <DialogFooter>
          <button
            data-testid="submit-add-restaurant-button"
            onClick={submit}
            disabled={saving}
            className="w-full rounded-full bg-[#C84B31] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#A33B24] disabled:opacity-60"
          >
            {saving ? "Adding…" : "Add to the pool"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
