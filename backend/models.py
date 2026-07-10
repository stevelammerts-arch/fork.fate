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
        return v if v in ("food", "drinks", "bars", "desserts") else "food"


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
    lat: Optional[float] = Field(default=None, ge=-90, le=90)
    lng: Optional[float] = Field(default=None, ge=-180, le=180)
    cuisines: List[str] = Field(default_factory=list, max_length=25)
    price_levels: List[str] = Field(default_factory=list, max_length=6)
    category: str = "food"
    open_now: bool = False
    radius_miles: float = Field(default=50.0, ge=1, le=50)

    @field_validator("zip_code")
    @classmethod
    def _valid_zip(cls, v):
        if v in (None, ""):
            return None
        if not re.fullmatch(r"\d{5}", v.strip()):
            raise ValueError("zip_code must be a 5-digit US ZIP")
        return v.strip()

    @field_validator("category")
    @classmethod
    def _valid_category(cls, v):
        return v if v in ("food", "drinks", "bars", "desserts") else "food"


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
    open_now: Optional[bool] = None
    google_url: str = Field(default="", max_length=600)


class CrawlCreate(BaseModel):
    mode: str = "bars"
    label: str = Field(default="", max_length=40)
    stops: List[CrawlStop] = Field(default_factory=list)

    @field_validator("mode")
    @classmethod
    def _valid_crawl_mode(cls, v):
        return v if v in ("food", "drinks", "bars", "desserts") else "bars"

    @field_validator("stops")
    @classmethod
    def _valid_stops(cls, v):
        if not v or len(v) < 2:
            raise ValueError("A crawl needs at least 2 stops")
        return v[:12]


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

    @field_validator("category")
    @classmethod
    def _valid_category_sc(cls, v):
        return v if v in ("food", "drinks", "bars", "desserts") else "food"


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

    @field_validator("category")
    @classmethod
    def _valid_cat_sub(cls, v):
        return v if v in ("food", "drinks", "bars", "desserts") else "food"

    @field_validator("contact_email")
    @classmethod
    def _valid_email_sub(cls, v):
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", v.strip()):
            raise ValueError("Please enter a valid email address")
        return v.strip()
