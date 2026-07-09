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

const DRINK_IMAGES = [
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?crop=entropy&cs=srgb&fm=jpg&q=85",
  "https://images.unsplash.com/photo-1558857563-b371033873b8?crop=entropy&cs=srgb&fm=jpg&q=85",
  "https://images.unsplash.com/photo-1502741224143-90386d7f8c82?crop=entropy&cs=srgb&fm=jpg&q=85",
];

const BAR_IMAGES = [
  "https://images.unsplash.com/photo-1436076863939-06870fe779c2?crop=entropy&cs=srgb&fm=jpg&q=85",
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?crop=entropy&cs=srgb&fm=jpg&q=85",
  "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?crop=entropy&cs=srgb&fm=jpg&q=85",
];

const DESSERT_IMAGES = [
  "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?crop=entropy&cs=srgb&fm=jpg&q=85",
  "https://images.unsplash.com/photo-1509440159596-0249088772ff?crop=entropy&cs=srgb&fm=jpg&q=85",
  "https://images.unsplash.com/photo-1488900128323-21503983a07e?crop=entropy&cs=srgb&fm=jpg&q=85",
];

const CUISINES = [
  "Italian", "Japanese", "Mexican", "Indian", "Chinese", "French", "Chicken Wings", "Deli", "Breakfast",
  "Mediterranean", "Steakhouse", "Seafood", "Burgers", "Vegan", "Cafe", "Thai", "Korean",
];
const DRINK_CUISINES = ["Coffee", "Boba Tea", "Smoothie"];
const DESSERT_CUISINES = ["Ice Cream", "Candy Shops", "Bakery", "Frozen Yogurt"];
const BAR_CUISINES = [
  "Beer", "Wine", "Cocktails", "Liquor", "Spirits", "Whiskey", "Margaritas", "Tiki", "Sports Bar", "Irish Bar", "Bars",
  "Pool", "Darts", "Volleyball", "Music", "Pickle Ball", "Games", "Bowling",
];

const fieldCls =
  "rounded-xl border-[#E2E4E7] bg-[#F5F6F7] px-4 py-2.5 text-[#0E0E0E] focus:ring-2 focus:ring-[#E01E26] focus:ring-offset-1 focus-visible:ring-[#E01E26]";

export default function AddRestaurantDialog({ onAdded, mode = "food" }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const cuisineOptions = mode === "food" ? CUISINES : mode === "drinks" ? DRINK_CUISINES : mode === "bars" ? BAR_CUISINES : DESSERT_CUISINES;
  const [form, setForm] = useState({
    name: "",
    cuisine: "",
    price: "$$",
    rating: 4.5,
    distance: 1.0,
    description: "",
    address: "",
    sponsored: false,
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim() || !form.cuisine) {
      toast.error("Name and cuisine are required");
      return;
    }
    setSaving(true);
    try {
      const pool = mode === "food" ? FOOD_IMAGES : mode === "drinks" ? DRINK_IMAGES : mode === "bars" ? BAR_IMAGES : DESSERT_IMAGES;
      const image = pool[Math.floor(Math.random() * pool.length)];
      const payload = {
        ...form,
        rating: parseFloat(form.rating) || 4.5,
        distance: parseFloat(form.distance) || 1.0,
        image,
        category: mode,
      };
      const { data } = await axios.post(`${API}/restaurants`, payload);
      toast.success(`Thanks! "${data.name}" was submitted for review and will appear once approved.`);
      setOpen(false);
      setForm({ name: "", cuisine: "", price: "$$", rating: 4.5, distance: 1.0, description: "", address: "", sponsored: false });
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
          className="inline-flex items-center gap-2 rounded-full border border-[#E2E4E7] bg-white px-3 py-2.5 text-sm font-semibold text-[#0E0E0E] transition-colors hover:bg-[#E2E4E7] sm:px-5"
        >
          <Plus className="h-4 w-4" /> <span>Add spot</span>
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-[#E2E4E7] bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl font-medium text-[#0E0E0E]">
            Add a restaurant
          </DialogTitle>
          <DialogDescription className="font-sans text-sm text-[#6B7075]">
            Suggest a local spot. New submissions are quickly reviewed before joining the roulette pool.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold tracking-[0.15em] uppercase text-[#6B7075]">Name</Label>
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
              <Label className="text-xs font-bold tracking-[0.15em] uppercase text-[#6B7075]">Cuisine</Label>
              <Select value={form.cuisine} onValueChange={(v) => set("cuisine", v)}>
                <SelectTrigger data-testid="add-cuisine-select" className={fieldCls}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {cuisineOptions.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold tracking-[0.15em] uppercase text-[#6B7075]">Price</Label>
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
              <Label className="text-xs font-bold tracking-[0.15em] uppercase text-[#6B7075]">Rating</Label>
              <Input
                data-testid="add-rating-input"
                type="number" step="0.1" min="0" max="5"
                value={form.rating}
                onChange={(e) => set("rating", e.target.value)}
                className={fieldCls}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold tracking-[0.15em] uppercase text-[#6B7075]">Distance (km)</Label>
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
            <Label className="text-xs font-bold tracking-[0.15em] uppercase text-[#6B7075]">Description</Label>
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
            className="w-full rounded-full bg-[#E01E26] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#B3141A] disabled:opacity-60"
          >
            {saving ? "Submitting…" : "Submit for review"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
