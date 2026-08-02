import { useState } from "react";
import { Search, MapPin, Dices, ChevronDown, Store, ArrowRight } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../ui/accordion";
import { useLang } from "../../i18n/i18n";

/**
 * The informational tail of the Home page: "How it works" 3-step explainer,
 * collapsible FAQ (SEO + first-time visitor context) and the "Feature your
 * business" sponsorship band. FAQ open/closed state lives here.
 */
export function HomeInfoSections({ light, onSponsor }) {
  const { t } = useLang();
  const [faqOpen, setFaqOpen] = useState(false);
  return (
    <>
      {/* How it works + FAQ (SEO + first-time visitor context) */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-4 md:px-12" data-testid="how-it-works-section">
        <div className="border-t border-[#E2E4E7] pt-14">
          <div className="rounded-3xl border border-[#E2E4E7] bg-white/95 p-8 shadow-sm backdrop-blur-sm md:p-10">
            <p className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-[#E01E26]">{t("How it works")}</p>
            <h2 className="mt-2 font-serif text-3xl font-medium tracking-tight text-[#0E0E0E] sm:text-4xl">
              {t("Let fate settle the \"where should we eat?\" debate.")}
            </h2>
            <p className="mt-3 max-w-2xl font-sans text-base text-[#6B7075]">
              {t("Fork·Fate is a restaurant roulette for anyone who's ever stared blankly at a food app, unable to decide. Set a couple of filters, shuffle the deck, and land on a real local place to eat, drink, or grab dessert — no endless scrolling, no group-chat deadlock.")}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-[#E2E4E7] bg-white p-6" data-testid="step-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0E0E0E]">
                <Search className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-4 font-serif text-xl text-[#0E0E0E]">{t("1. Pick your craving")}</h3>
              <p className="mt-2 font-sans text-sm text-[#6B7075]">
                {t("Choose Food, Drinks, Bars, Desserts, Shops, Fuel & Go, Explore or Stay — then narrow it down with type chips and toggles like \"Open now\" to match the mood.")}
              </p>
            </div>
            <div className="rounded-3xl border border-[#E2E4E7] bg-white p-6" data-testid="step-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0E0E0E]">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-4 font-serif text-xl text-[#0E0E0E]">{t("2. Set your location")}</h3>
              <p className="mt-2 font-sans text-sm text-[#6B7075]">
                {t("Enter a ZIP code or tap \"Use my location\" and Fork·Fate pulls real, nearby places using live Google data — up to 100 miles out, or 150 for Explore and Stay, since a state park is worth the drive.")}
              </p>
            </div>
            <div className="rounded-3xl border border-[#E2E4E7] bg-white p-6" data-testid="step-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E01E26]">
                <Dices className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-4 font-serif text-xl text-[#0E0E0E]">{t("3. Deal your fate")}</h3>
              <p className="mt-2 font-sans text-sm text-[#6B7075]">
                {t("Hit the button and watch the deck shuffle to reveal your pick — with directions, reviews, delivery links where they apply, and a few more spots to consider if you want a re-roll.")}
              </p>
            </div>
          </div>

          <div className="mt-16 rounded-3xl border border-[#E2E4E7] bg-white/95 p-6 shadow-sm backdrop-blur-sm md:p-8">
          <button
            onClick={() => setFaqOpen((o) => !o)}
            data-testid="faq-toggle"
            aria-expanded={faqOpen}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <h2 className="font-serif text-2xl font-medium tracking-tight text-[#0E0E0E] sm:text-3xl">
              {t("Frequently asked questions")}
            </h2>
            <span className="flex shrink-0 items-center gap-1 font-sans text-sm font-bold text-[#E01E26]">
              {faqOpen ? t("Less") : t("More")}
              <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${faqOpen ? "rotate-180" : ""}`} />
            </span>
          </button>
          {faqOpen && (
          <Accordion type="single" collapsible className="mt-4 w-full animate-in fade-in slide-in-from-top-2 duration-300" data-testid="faq-section">
            {[
              { q: t("How does Fork·Fate pick a place?"), a: t("After you set your filters, Fork·Fate gathers matching local spots and randomly deals one from the deck. Every deal is a fresh shuffle, so you'll discover places you might never have chosen yourself.") },
              { q: t("Is Fork·Fate free to use?"), a: t("Yes — Fork·Fate is completely free. There's no account, no signup, and no paywall. Just open it, shuffle, and go.") },
              { q: t("Do I need to create an account?"), a: t("No login required. You can start spinning the moment the page loads, on your phone or desktop.") },
              { q: t("What are the Explore and Stay tabs?"), a: t("Explore deals you something to DO — state and national parks, hiking and biking trails, fishing spots, waterfalls and scenic overlooks, plus rainy-day picks like museums, bowling, mini golf and escape rooms. Stay deals you somewhere to sleep — campgrounds, RV parks and KOAs, cabins, yurts, lodges and inns. Both search further out than the food tabs, since a park or campsite is usually worth the drive.") },
              { q: t("Why can't I order delivery from every result?"), a: t("Delivery links only appear where they make sense. A restaurant or dessert shop gets DoorDash, Uber Eats and Grubhub links; a hiking trail, campground, thrift store, gas station or bus stop doesn't — so Fork·Fate hides them instead of sending you to a dead end.") },
              { q: t("How do you find nearby places?"), a: t("Fork·Fate uses live Google Places data based on your ZIP code or device location, so results reflect real, currently-listed places around you — restaurants and bars, shops, parks and trails, and campgrounds alike.") },
              { q: t("What's the difference between a crawl and a Fate Passport?"), a: t("A crawl is one outing: fate deals 3–6 stops in a followable route, you hit them in order the same day, check each off and claim a badge. A Fate Passport is collected over time — days, weeks or a whole summer. Fate deals up to 10 stops in any category (parks, breweries, diners, museums, campgrounds), you stamp each one as you actually get there, and when the last stop is stamped your passport opens into a shareable award with a real ink stamp for every stop.") },
              { q: t("How does stamping a passport work — and can people fake it?"), a: t("Tap \"I'm here\" at a stop and your phone's location is checked against the place: get within about half a mile and it's stamped on site. You can always stamp manually if GPS struggles indoors or deep in a park, but those stops are marked self-reported and print as faint stamps on your award. We also reject impossible stamps (two stops 40 miles apart a minute apart), and only passports stamped on site at every stop earn the verified seal or can be posted to the public Passport Wall.") },
              { q: t("Can I add my favorite local spot?"), a: t("Fork·Fate is powered by live Google Places data plus paid local sponsors — no more community-submission form. If you're a business owner, tap \"Sponsor your spot\" to get pinned at the top of every matching search. Not a business? Live places already appear automatically via Google.") },
              { q: t("Can I install Fork·Fate as an app?"), a: t("Yes — tap \"Download app\" to install Fork·Fate as a PWA on your home screen for one-tap access whenever you can't decide.") },
            ].map((item, i) => (
              <AccordionItem key={item.q} value={`faq-${i}`} className="border-[#E2E4E7]" data-testid={`faq-item-${i}`}>
                <AccordionTrigger className="text-left font-serif text-base text-[#0E0E0E] hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="font-sans text-sm text-[#6B7075]">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          )}
          </div>
        </div>
      </section>

      {/* Feature your business (sponsorship visibility band) */}
      <section
        className={`relative z-10 border-t ${light ? "border-[#E7DCC7]" : "border-[#E2E4E7]"}`}
        data-testid="feature-business-band"
      >
        <div className="mx-auto max-w-6xl px-6 py-14 md:px-12">
          <div
            className={`relative overflow-hidden rounded-3xl border p-8 md:p-12 ${light ? "border-[#E2E4E7] bg-white/95 backdrop-blur-sm" : "border-[#E01E26]/40 bg-[#141414]"}`}
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#E01E26]/20 blur-3xl" />
            <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#E01E26]/15 px-3 py-1 font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#E01E26]">
                  <Store className="h-3.5 w-3.5" /> {t("For local businesses")}
                </span>
                <h2 className={`mt-3 font-serif text-3xl font-semibold md:text-4xl ${light ? "text-[#0E0E0E]" : "text-white"}`}>
                  {t("Own the top spot when fate is decided")}
                </h2>
                <p className={`mt-3 font-sans text-sm md:text-base ${light ? "text-[#4B5563]" : "text-[#C7CBD1]"}`}>
                  {t("Sponsored spots appear first when locals shuffle for a place to eat, drink or treat themselves. Fixed monthly price, no bidding, cancel anytime.")}
                </p>
                <div className={`mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-sm ${light ? "text-[#0E0E0E]" : "text-white"}`}>
                  <span className="flex items-baseline gap-1.5"><span className="font-serif text-2xl font-bold">$19</span><span className="text-[#9A9FA5]">/{t("mo")}</span> <span className="text-xs text-[#9A9FA5] line-through">$29</span></span>
                  <span className="text-[#6B7075]">{t("or")}</span>
                  <span className="flex items-baseline gap-1.5"><span className="font-serif text-2xl font-bold">$190</span><span className="text-[#9A9FA5]">/{t("yr")}</span> <span className="text-xs text-[#9A9FA5] line-through">$290</span> <span className="rounded-full bg-[#E01E26] px-2 py-0.5 text-[10px] font-bold">{t("Save $38/yr")}</span></span>
                </div>
              </div>
              <button
                onClick={onSponsor}
                data-testid="feature-business-cta"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#E01E26] px-6 py-3.5 font-sans text-sm font-bold text-white shadow-lg shadow-[#E01E26]/30 transition-colors hover:bg-[#B3141A]"
              >
                {t("Feature your business")} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
