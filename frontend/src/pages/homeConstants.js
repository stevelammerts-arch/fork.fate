// Pure constants and helpers for the Home page (no React state).

const STREAK_KEY = "ff_streak";
const midnight = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

export function readStreak() {
  try {
    const raw = JSON.parse(localStorage.getItem(STREAK_KEY) || "null");
    if (!raw) return 0;
    const days = Math.round((midnight(new Date()) - midnight(raw.date)) / 86400000);
    return days === 0 || days === 1 ? raw.count : 0;
  } catch { return 0; }
}

export function bumpStreak() {
  try {
    const raw = JSON.parse(localStorage.getItem(STREAK_KEY) || "null");
    let count = 1;
    if (raw) {
      const days = Math.round((midnight(new Date()) - midnight(raw.date)) / 86400000);
      if (days === 0) count = raw.count;
      else if (days === 1) count = raw.count + 1;
    }
    localStorage.setItem(STREAK_KEY, JSON.stringify({ date: new Date().toISOString(), count }));
    return count;
  } catch { return 1; }
}

export const SHUFFLE_INTERVAL_MS = 90;
export const SHUFFLE_DURATION_MS = 1500;
export const RESULT_SPRING = { type: "spring", stiffness: 260, damping: 16 };
export const FLASH_TRANSITION = { duration: 0.08 };
export const HERO_INITIAL = { opacity: 0, y: 20 };
export const HERO_ANIMATE = { opacity: 1, y: 0 };
export const HERO_TRANSITION = { duration: 0.6 };
export const DETAIL_INITIAL = { opacity: 0, y: 10 };
export const DETAIL_ANIMATE = { opacity: 1, y: 0 };
export const DETAIL_TRANSITION = { delay: 0.2 };
export const SPIN_TAP = { scale: 0.96 };

export const REAPER_LINES = [
  "The reaper has spoken.",
  "Fate has been sealed.",
  "The cards have chosen.",
  "Destiny points here.",
  "Your fate is written.",
];
export const reaperLineFor = (r) => REAPER_LINES[(r?.name?.length || 0) % REAPER_LINES.length];

export const FOOD_CUISINES = [
  "Italian", "Mexican", "Tex-Mex", "Chinese", "Japanese", "Sushi", "Indian", "Thai", "Korean", "Vietnamese",
  "Filipino", "Malaysian", "Indonesian", "Chicken Wings", "Fried Chicken", "Burgers", "Steakhouse", "American",
  "Diner", "Comfort Food", "Southern", "Soul Food", "Cajun", "Mediterranean", "Greek", "Spanish", "French",
  "Middle Eastern", "Lebanese", "Turkish", "Ethiopian", "Caribbean", "Cuban", "Peruvian", "Brazilian", "Hawaiian",
  "Seafood", "Poke", "Pizza", "Pasta", "Tacos", "Sandwiches", "Deli", "Ramen", "Noodles", "Pho", "Dumplings",
  "Breakfast", "Brunch", "Salads", "Halal", "Vegan", "Vegetarian", "Gluten Free", "BBQ", "Cafe", "Gastropub",
  "Fine Dining", "Fusion", "Hot Pot", "Dim Sum", "Buffet", "Food Trucks", "Fast Food", "Tapas",
];
export const DRINK_CUISINES = ["Coffee", "Espresso", "Boba Tea", "Tea House", "Smoothie", "Juice Bar", "Milkshakes", "Kombucha", "Cider", "Hot Chocolate", "Matcha", "Lemonade", "Soda Fountain"];
export const DESSERT_CUISINES = ["Ice Cream", "Gelato", "Frozen Yogurt", "Bakery", "Donuts", "Cupcakes", "Candy Shops", "Chocolate", "Crepes", "Cheesecake", "Pie", "Cookies", "Waffles", "Macarons", "Cinnamon Rolls"];
export const BAR_CUISINES = [
  "Brewery", "Beer Garden", "Taproom", "Distillery", "Beer", "Wine", "Winery", "Wine Bar", "Wine Tasting",
  "Champagne Bar", "Cider House", "Cocktails", "Whiskey", "Liquor", "Spirits", "Margaritas", "Tequila Bar",
  "Mezcal Bar", "Tiki", "Pub", "Gastropub", "Sports Bar", "Irish Bar", "Dive Bar", "Rooftop Bar", "Lounge",
  "Speakeasy", "Nightclub", "Karaoke", "Bars", "Cigar Bar", "Hookah Lounge", "Live Music", "Jazz Bar",
  "Piano Bar", "Comedy Club", "Pool", "Darts", "Volleyball", "Music", "Pickle Ball", "Arcade Bar", "Axe Throwing",
  "Mini Golf", "Trivia", "Games", "Bowling", "Tapas Bar",
];
export const CRAWL_TYPES = [
  { key: "pubs", label: "Pubs", mode: "bars", cuisine: "Pub", crawl: "Pub Crawl" },
  { key: "wine", label: "Wineries", mode: "bars", cuisine: "Winery", crawl: "Winery Crawl" },
  { key: "brewery", label: "Breweries", mode: "bars", cuisine: "Brewery", crawl: "Brewery Crawl" },
  { key: "tacos", label: "Tacos", mode: "food", cuisine: "Tacos", crawl: "Taco Crawl" },
  { key: "tapas", label: "Tapas", mode: "food", cuisine: "Tapas", crawl: "Tapas Crawl" },
  { key: "burgers", label: "Burgers", mode: "food", cuisine: "Burgers", crawl: "Burger Crawl" },
];
export const crawlLabelForType = (key) => (CRAWL_TYPES.find((t) => t.key === key)?.crawl) || "Pub Crawl";
