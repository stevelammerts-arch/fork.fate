"""Pydantic request/response models for Fork·Fate."""
import re
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


class Restaurant(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    cuisine: str
    price: str  # "$", "$$", "$$$"
    rating: float = 4.5
    distance: float = 1.0  # km
    description: str = ""
    address: str = ""
    image: str = ""
    sponsored: bool = False
    category: str = "food"  # "food" | "drinks"
    google_url: str = ""
    doordash_url: str = ""
    ubereats_url: str = ""
    grubhub_url: str = ""
    order_url: str = ""
    open_now: bool = True
    status: str = "approved"  # "approved" | "pending" (community submissions await review)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RestaurantCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    cuisine: str = Field(min_length=1, max_length=60)
    price: str = Field(default="$$", max_length=4)
    rating: float = Field(default=4.5, ge=0, le=5)
    distance: float = Field(default=1.0, ge=0, le=100)
    description: str = Field(default="", max_length=1000)
    address: str = Field(default="", max_length=300)
    image: str = Field(default="", max_length=1000)
    sponsored: bool = False
    category: str = "food"

    @field_validator("category")
    @classmethod
    def _valid_category(cls, v):
        return v if v in ("food", "drinks", "bars", "desserts", "shops", "fuel", "explore", "stay") else "food"


class SpinRequest(BaseModel):
    cuisines: List[str] = []
    prices: List[str] = []
    max_distance: Optional[float] = None


class ReportCreate(BaseModel):
    restaurant_id: str = Field(min_length=1, max_length=100)
    restaurant_name: str = Field(default="", max_length=160)
    reason: str = Field(default="No longer in service", max_length=300)


class SponsorshipRequest(BaseModel):
    business_name: str = Field(min_length=1, max_length=160)
    contact_email: str = Field(min_length=3, max_length=160)
    category: str = Field(default="food", max_length=20)
    message: str = Field(default="", max_length=1000)

    @field_validator("contact_email")
    @classmethod
    def _valid_email(cls, v):
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", v.strip()):
            raise ValueError("Please enter a valid email address")
        return v.strip()


class PlacesSearchRequest(BaseModel):
    zip_code: Optional[str] = None
    place_query: Optional[str] = Field(default=None, max_length=120)  # free text: "Omaha Nebraska", "Yellowstone National Park", etc.
    lat: Optional[float] = Field(default=None, ge=-90, le=90)
    lng: Optional[float] = Field(default=None, ge=-180, le=180)
    cuisines: List[str] = Field(default_factory=list, max_length=25)
    price_levels: List[str] = Field(default_factory=list, max_length=6)
    category: str = "food"
    open_now: bool = False
    radius_miles: float = Field(default=50.0, ge=1, le=150)

    @field_validator("zip_code")
    @classmethod
    def _valid_zip(cls, v):
        if v in (None, ""):
            return None
        if not re.fullmatch(r"\d{5}", v.strip()):
            raise ValueError("zip_code must be a 5-digit US ZIP")
        return v.strip()

    @field_validator("place_query")
    @classmethod
    def _clean_place_query(cls, v):
        if v is None:
            return None
        v = v.strip()
        return v or None

    @field_validator("category")
    @classmethod
    def _valid_category(cls, v):
        return v if v in ("food", "drinks", "bars", "desserts", "shops", "fuel", "explore", "stay") else "food"


class AdminLogin(BaseModel):
    password: str = Field(min_length=1, max_length=200)


class CrawlStop(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = ""
    name: str = Field(default="", max_length=200)
    cuisine: str = Field(default="", max_length=80)
    price: str = Field(default="", max_length=8)
    rating: Optional[float] = None
    distance: Optional[float] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    open_now: Optional[bool] = None
    google_url: str = Field(default="", max_length=600)

    @field_validator("google_url")
    @classmethod
    def _safe_url(cls, v):
        # Only allow http(s) links — blocks javascript:/data: and other unsafe schemes.
        return v if isinstance(v, str) and re.match(r"^https?://", v.strip(), re.I) else ""


class CrawlCreate(BaseModel):
    mode: str = "bars"
    label: str = Field(default="", max_length=40)
    stops: List[CrawlStop] = Field(default_factory=list)

    @field_validator("mode")
    @classmethod
    def _valid_crawl_mode(cls, v):
        return v if v in ("food", "drinks", "bars", "desserts", "shops", "fuel") else "bars"

    @field_validator("stops")
    @classmethod
    def _valid_stops(cls, v):
        if not v or len(v) < 2:
            raise ValueError("A crawl needs at least 2 stops")
        return v[:12]


class CrawlCompletionCreate(BaseModel):
    """A single crew's finished-crawl result submitted to the leaderboard (opt-in)."""
    team_name: str = Field(default="", max_length=40)
    stops: int = Field(ge=1, le=12)
    mode: str = "bars"
    label: str = Field(default="", max_length=40)
    code: Optional[str] = Field(default=None, max_length=12)
    duration_seconds: Optional[int] = Field(default=None, ge=1, le=172800)
    verified: bool = False  # True only when every stop was GPS auto-checked-in
    distance: Optional[float] = Field(default=None, ge=0, le=1000)  # total route miles (for speed sanity check)

    @field_validator("team_name")
    @classmethod
    def _clean_team(cls, v):
        v = (v or "").strip()
        return v[:40] if v else "Anonymous Crew"

    @field_validator("mode")
    @classmethod
    def _valid_completion_mode(cls, v):
        return v if v in ("food", "drinks", "bars", "desserts", "shops", "fuel") else "bars"

    @field_validator("code")
    @classmethod
    def _clean_code(cls, v):
        v = (v or "").strip().upper()
        return v[:12] if v else None


class CrawlCheckinCreate(BaseModel):
    """A single stop check-in during a live crawl.

    Recorded server-side so leaderboard verification can eventually be derived
    from real arrivals instead of a client-supplied `verified` flag. Rows are
    ephemeral — a TTL index on `expire_at` drops them automatically.
    """
    stop_id: str = Field(default="", max_length=100)
    stop_index: int = Field(default=0, ge=0, le=11)
    lat: Optional[float] = Field(default=None, ge=-90, le=90)
    lng: Optional[float] = Field(default=None, ge=-180, le=180)
    source: str = "gps"  # "gps" (auto, leaderboard-eligible) | "manual"

    @field_validator("source")
    @classmethod
    def _valid_source(cls, v):
        return v if v in ("gps", "manual") else "manual"


class PassportCreate(BaseModel):
    """A multi-day quest: N stops you stamp over days or weeks."""
    mode: str = "explore"
    label: str = Field(default="", max_length=40)
    stops: List[CrawlStop] = Field(default_factory=list)

    @field_validator("mode")
    @classmethod
    def _valid_passport_mode(cls, v):
        return v if v in ("food", "drinks", "bars", "desserts", "shops", "fuel", "explore", "stay") else "explore"

    @field_validator("stops")
    @classmethod
    def _valid_passport_stops(cls, v):
        if not v or len(v) < 3:
            raise ValueError("A passport needs at least 3 stops")
        return v[:10]


class PassportStamp(BaseModel):
    stop_id: str = Field(min_length=1, max_length=100)
    lat: Optional[float] = Field(default=None, ge=-90, le=90)
    lng: Optional[float] = Field(default=None, ge=-180, le=180)
    accuracy: Optional[float] = Field(default=None, ge=0, le=100000)  # metres, from the browser
    source: str = "gps"  # "gps" (verified on site) | "manual"
    photo: Optional[str] = None  # data URL, resized client-side

    @field_validator("source")
    @classmethod
    def _valid_stamp_source(cls, v):
        return v if v in ("gps", "manual") else "manual"

    @field_validator("photo")
    @classmethod
    def _valid_photo(cls, v):
        if v is None:
            return None
        if not v.startswith(("data:image/jpeg;base64,", "data:image/png;base64,", "data:image/webp;base64,")):
            raise ValueError("Photo must be a JPEG, PNG or WebP data URL")
        # ~1.4 MB of base64 ≈ 1 MB of image; the client resizes to well under this.
        if len(v) > 1_400_000:
            raise ValueError("Photo is too large — try a smaller image")
        return v


class PassportPhoto(BaseModel):
    photo: str

    @field_validator("photo")
    @classmethod
    def _valid_photo(cls, v):
        return PassportStamp._valid_photo(v)


class PassportHolder(BaseModel):
    """The ID page: the traveller's own portrait and the name on the passport."""
    name: str = Field(default="", max_length=32)
    photo: Optional[str] = None

    @field_validator("photo")
    @classmethod
    def _valid_photo(cls, v):
        return PassportStamp._valid_photo(v)


class Coupon(BaseModel):
    """Optional coupon a sponsor can attach to their venue card.

    Shown as a tap-to-reveal on the winning fate card AND on the 3 alternates,
    with a copyable code and clear expiry. All fields optional so we can render
    a partial coupon (e.g. code + description only).
    """
    model_config = ConfigDict(extra="ignore")

    code: str = Field(min_length=1, max_length=32)
    description: str = Field(min_length=1, max_length=140)
    # "percent" | "fixed" | "free_item" | "bogo" | "custom"
    discount_type: str = Field(default="percent", max_length=20)
    discount_value: float = Field(default=0, ge=0, le=100000)
    terms: str = Field(default="", max_length=500)
    expires_at: Optional[str] = Field(default=None, max_length=40)  # ISO date

    @field_validator("discount_type")
    @classmethod
    def _valid_discount_type(cls, v):
        return v if v in ("percent", "fixed", "free_item", "bogo", "custom") else "custom"


class SponsorCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    cuisine: str = Field(min_length=1, max_length=60)
    price: str = Field(default="$$", max_length=4)
    category: str = "food"
    address: str = Field(default="", max_length=300)
    description: str = Field(default="", max_length=1000)
    image: str = Field(default="", max_length=1000)
    rating: float = Field(default=4.7, ge=0, le=5)
    distance: float = Field(default=0.5, ge=0, le=100)
    active: bool = True
    coupon: Optional[Coupon] = None
    # "local" — occupies fate-deck slots (locals only, protects the hidden-gem brand).
    # "chain_coupon_only" — national chain; NEVER appears as a slot in the reveal,
    # only surfaces as a bonus coupon strip beside the local winner.
    tier: str = Field(default="local", max_length=20)

    @field_validator("category")
    @classmethod
    def _valid_category_sc(cls, v):
        return v if v in ("food", "drinks", "bars", "desserts", "shops", "fuel", "explore", "stay") else "food"

    @field_validator("tier")
    @classmethod
    def _valid_tier_sc(cls, v):
        return v if v in ("local", "chain_coupon_only") else "local"


class SponsorUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=160)
    cuisine: Optional[str] = Field(default=None, max_length=60)
    price: Optional[str] = Field(default=None, max_length=4)
    category: Optional[str] = None
    address: Optional[str] = Field(default=None, max_length=300)
    description: Optional[str] = Field(default=None, max_length=1000)
    image: Optional[str] = Field(default=None, max_length=1000)
    rating: Optional[float] = Field(default=None, ge=0, le=5)
    distance: Optional[float] = Field(default=None, ge=0, le=100)
    active: Optional[bool] = None
    coupon: Optional[Coupon] = None
    tier: Optional[str] = Field(default=None, max_length=20)


class SponsorClick(BaseModel):
    sponsor_id: str


class SponsorSubscribe(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    cuisine: str = Field(min_length=1, max_length=60)
    price: str = Field(default="$$", max_length=4)
    category: str = "food"
    address: str = Field(default="", max_length=300)
    description: str = Field(default="", max_length=1000)
    image: str = Field(default="", max_length=1000)
    website: str = Field(default="", max_length=300)
    contact_email: str = Field(min_length=3, max_length=160)
    origin: str = Field(min_length=1, max_length=300)
    plan: str = Field(default="monthly", max_length=10)
    # "local" (fate-deck slots) or "chain_coupon_only" (bonus coupon strip only).
    tier: str = Field(default="local", max_length=20)
    # Chain sponsors surface ONLY through their coupon, so it's required for them
    # (enforced in the subscribe route, not here, to keep the model reusable).
    coupon: Optional[Coupon] = None

    @field_validator("plan")
    @classmethod
    def _valid_plan(cls, v):
        return v if v in ("monthly", "yearly") else "monthly"

    @field_validator("tier")
    @classmethod
    def _valid_tier_sub(cls, v):
        return v if v in ("local", "chain_coupon_only") else "local"

    @field_validator("category")
    @classmethod
    def _valid_cat_sub(cls, v):
        return v if v in ("food", "drinks", "bars", "desserts", "shops", "fuel", "explore", "stay") else "food"

    @field_validator("contact_email")
    @classmethod
    def _valid_email_sub(cls, v):
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", v.strip()):
            raise ValueError("Please enter a valid email address")
        return v.strip()



class BetaSignup(BaseModel):
    email: str = Field(max_length=200)
    name: Optional[str] = Field(default="", max_length=120)

    @field_validator("email")
    @classmethod
    def _valid_beta_email(cls, v):
        v = (v or "").strip()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", v):
            raise ValueError("Please enter a valid email address")
        return v


class MerchNotify(BaseModel):
    email: str = Field(max_length=200)
    product_key: str = Field(default="", max_length=80)
    design: str = Field(default="", max_length=100)

    @field_validator("email")
    @classmethod
    def _valid_merch_email(cls, v):
        v = (v or "").strip()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", v):
            raise ValueError("Please enter a valid email address")
        return v
