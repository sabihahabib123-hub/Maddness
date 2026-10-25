/**
 * SAMPLE CONTENT. Everything here is placeholder data for development and for
 * the first Supabase seed (scripts/generate-seed-sql.mjs turns it into
 * supabase/seed.sql). Replace it through /admin before launch.
 *
 * What is and is not real:
 *  - Photos in /public/images were supplied with the project. Most show the
 *    MADNESS venue and team; confirm usage rights for each before launch.
 *  - Dish names, descriptions, ingredients and prices are SAMPLES written to
 *    match the photos. They are flagged `is_sample: true` and shown with a
 *    "Sample" badge. Allergens are left empty and unverified on purpose.
 *  - Branch details come from public sources named in `source_note` and are
 *    flagged `is_verified: false` until the business confirms them.
 *  - No delivery links, reviews or Google review URLs are seeded, because none
 *    have been confirmed.
 *
 * This file must not use the "@/" path alias: it is also imported by a Node
 * script with native TypeScript type stripping.
 */
import type {
  Branch,
  BranchMenuItem,
  CustomerFeedback,
  DeliveryLink,
  GalleryImage,
  HeroSlide,
  MenuCategory,
  MenuItem,
  SiteSettings,
} from "../types";

const T = "2026-10-26T00:00:00.000Z";
const id = (prefix: string, n: number) => `${prefix}-0000-4000-8000-${String(n).padStart(12, "0")}`;
const ts = { created_at: T, updated_at: T };

export const seedBranches: Branch[] = [
  {
    id: id("b0000000", 1),
    name: "MADNESS Bluewaters",
    slug: "bluewaters",
    address: "Bluewaters Island, Dubai",
    area: "Bluewaters",
    city: "Dubai",
    phone: "+971 4 422 4500",
    email: null,
    hours_note: "12 PM to 1 AM. Walk-ins only, no reservations.",
    opening_hours: (["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const).map((day) => ({ day, opens: "12:00", closes: "01:00" })),
    latitude: null,
    longitude: null,
    directions_url: "https://goo.gl/maps/3So9kcQNgcGJfzi88",
    google_review_url: null,
    image_url: "/images/interior-neon-booths.webp",
    is_active: true,
    is_verified: false,
    source_note: "From the @madness.uae Instagram bio (checked 26 Oct 2026): phone, 12PM to 1AM, no reservation, map link. Full street address still needed.",
    display_order: 1,
    ...ts,
  },
  {
    id: id("b0000000", 2),
    name: "MADNESS Jumeirah",
    slug: "jumeirah",
    address: "609 Jumeira St, Umm Suqeim 1, Dubai",
    area: "Umm Suqeim",
    city: "Dubai",
    phone: "+971 4 340 0103",
    email: null,
    hours_note: "Opening hours to be confirmed.",
    opening_hours: [],
    latitude: null,
    longitude: null,
    directions_url: "https://www.google.com/maps/search/?api=1&query=609%20Jumeira%20St%2C%20Umm%20Suqeim%201%2C%20Dubai",
    google_review_url: null,
    image_url: "/images/interior-joker-mural.webp",
    is_active: true,
    is_verified: false,
    source_note: "Address and phone from madnessmadeindubai.shop (not confirmed as official). Instagram lists a Jumeirah highlight. Hours unknown.",
    display_order: 2,
    ...ts,
  },
];

export const seedCategories: MenuCategory[] = [
  { id: id("c0000000", 1), name: "Starters", slug: "starters", description: "Small plates to kick things off.", display_order: 1, is_active: true, ...ts },
  { id: id("c0000000", 2), name: "Salads", slug: "salads", description: null, display_order: 2, is_active: true, ...ts },
  { id: id("c0000000", 3), name: "Main Dishes", slug: "main-dishes", description: null, display_order: 3, is_active: true, ...ts },
  { id: id("c0000000", 4), name: "Burgers", slug: "burgers", description: null, display_order: 4, is_active: true, ...ts },
  { id: id("c0000000", 5), name: "Pasta", slug: "pasta", description: null, display_order: 5, is_active: true, ...ts },
  { id: id("c0000000", 6), name: "Desserts", slug: "desserts", description: null, display_order: 6, is_active: true, ...ts },
];

type ItemSeed = Pick<MenuItem, "name" | "slug" | "short_description" | "description" | "price" | "image_url" | "image_alt" | "ingredients"> & {
  cat: number;
  featured?: boolean;
};

const items: ItemSeed[] = [
  {
    cat: 1, featured: true, name: "Smoking Popcorn Chicken & Fries", slug: "smoking-popcorn-chicken-fries", price: 52,
    image_url: "/images/smoking-chicken-fries.webp", image_alt: "Glazed popcorn chicken piled on fries in a tall glass, set over a bowl of rolling dry-ice fog",
    short_description: "Sticky glazed chicken over fries, served in a cloud of smoke.",
    description: "Crispy popcorn chicken tossed in a sticky glaze, stacked over golden fries and brought to the table on a bed of dry-ice fog.",
    ingredients: ["Chicken", "Fries", "Sticky glaze", "Spring onion", "Sesame seeds"],
  },
  {
    cat: 1, name: "Glazed Chicken Skewers", slug: "glazed-chicken-skewers", price: 48,
    image_url: "/images/skewers-glazed.webp", image_alt: "Lacquered chicken skewers on a banana leaf with a pot of yellow dipping sauce",
    short_description: "Lacquered skewers with a bright, creamy dip.",
    description: "Chargrilled skewers brushed with a sweet and savoury glaze, finished with herbs and served with a creamy dipping sauce.",
    ingredients: ["Chicken", "Glaze", "Herbs", "Dipping sauce"],
  },
  {
    cat: 1, featured: true, name: "Parmesan Mozzarella Sticks", slug: "parmesan-mozzarella-sticks", price: 39,
    image_url: "/images/mozzarella-sticks.webp", image_alt: "Golden mozzarella sticks dusted with grated cheese and chilli, with a dip on the side",
    short_description: "Crisp outside, molten inside, buried in parmesan.",
    description: "Breaded mozzarella fried until golden, showered with parmesan, chives and chilli, with a creamy dip.",
    ingredients: ["Mozzarella", "Breadcrumbs", "Parmesan", "Chives", "Chilli", "Dip"],
  },
  {
    cat: 1, name: "Loaded Fries Skillet", slug: "loaded-fries-skillet", price: 42,
    image_url: "/images/loaded-fries-skillet.webp", image_alt: "Cast-iron skillet of fries covered in melted cheese, minced beef and diced tomato",
    short_description: "Fries, molten cheese and seasoned beef in cast iron.",
    description: "A cast-iron skillet of fries smothered in melted cheese, seasoned minced beef, tomato and herbs.",
    ingredients: ["Fries", "Cheese sauce", "Minced beef", "Tomato", "Herbs"],
  },
  {
    cat: 1, name: "Street Corn Skewers", slug: "street-corn-skewers", price: 32,
    image_url: "/images/chef-corn-skewers.webp", image_alt: "A masked MADNESS chef holding a plate of charred corn skewers",
    short_description: "Charred corn on sticks, dressed to impress.",
    description: "Grilled corn cut into rounds, skewered and finished with seasoning and sauce.",
    ingredients: ["Corn", "Seasoning", "Sauce"],
  },
  {
    cat: 2, name: "Burrata & Berries", slug: "burrata-berries", price: 58,
    image_url: "/images/burrata-berries.webp", image_alt: "Burrata surrounded by raspberries, grapes and basil with a balsamic drizzle",
    short_description: "Creamy burrata, fresh berries, basil and balsamic.",
    description: "Soft burrata with raspberries, pomegranate, grapes and basil, finished with a balsamic glaze.",
    ingredients: ["Burrata", "Raspberries", "Pomegranate", "Grapes", "Basil", "Balsamic glaze"],
  },
  {
    cat: 3, featured: true, name: "Hot Stone Wagyu", slug: "hot-stone-wagyu", price: 145,
    image_url: "/images/hot-stone-wagyu.webp", image_alt: "Thin slices of marbled beef being seared on a smoking hot stone at the table",
    short_description: "Marbled beef you sear yourself on a smoking stone.",
    description: "Thinly sliced marbled beef served raw with a volcanic hot stone, so you can sear each slice at the table. Comes with a dipping sauce.",
    ingredients: ["Wagyu beef", "Dipping sauce"],
  },
  {
    cat: 4, featured: true, name: "Double Trouble Burger", slug: "double-trouble-burger", price: 68,
    image_url: "/images/burger-double-dark.webp", image_alt: "Double beef burger with melted cheese, house sauce and frisée lettuce on a brioche bun",
    short_description: "Two patties, double cheese, house sauce.",
    description: "Two beef patties with melted cheese, smashed avocado, frisée and a rich house sauce in a toasted sesame brioche bun.",
    ingredients: ["Beef patties", "Cheese", "Avocado", "Frisée", "House sauce", "Sesame brioche bun"],
  },
  {
    cat: 4, name: "Woodboard Cheeseburger", slug: "woodboard-cheeseburger", price: 59,
    image_url: "/images/burger-woodboard.webp", image_alt: "Cheeseburger with crispy onions and jalapeños served on stacked wooden rounds",
    short_description: "Melted cheese, crispy onions and a jalapeño kick.",
    description: "A juicy beef patty with melted cheese, crispy fried onions, jalapeños and lettuce in a glossy brioche bun.",
    ingredients: ["Beef patty", "Cheese", "Crispy onions", "Jalapeños", "Lettuce", "Brioche bun"],
  },
  {
    cat: 4, name: "Slider Duo", slug: "slider-duo", price: 49,
    image_url: "/images/chef-sliders.webp", image_alt: "A masked chef in a leather booth presenting two mini burgers",
    short_description: "Two mini burgers, one big attitude.",
    description: "A pair of mini beef sliders with cheese and sauce on soft buns.",
    ingredients: ["Beef", "Cheese", "Sauce", "Mini buns"],
  },
  {
    cat: 5, featured: true, name: "Pink Sauce Fusilli", slug: "pink-sauce-fusilli", price: 62,
    image_url: "/images/pasta-fusilli-mask.webp", image_alt: "Long fusilli in a creamy pink sauce lifted from a foil parcel, a clown mask in the background",
    short_description: "Creamy tomato fusilli served straight from the foil.",
    description: "Long fusilli in a silky tomato and cream sauce, baked and served in its foil parcel.",
    ingredients: ["Fusilli", "Tomato", "Cream", "Parmesan"],
  },
  {
    cat: 5, name: "Tagliatelle Ragù", slug: "tagliatelle-ragu", price: 72,
    image_url: "/images/pasta-ragu.webp", image_alt: "Tagliatelle twirled with slow-cooked meat ragù, grated cheese and thyme",
    short_description: "Slow-cooked ragù, ribbons of pasta, plenty of cheese.",
    description: "Fresh tagliatelle with a slow-cooked meat ragù, finished with grated cheese and thyme.",
    ingredients: ["Tagliatelle", "Meat ragù", "Grated cheese", "Thyme"],
  },
  {
    cat: 5, name: "Tagliatelle Pomodoro", slug: "tagliatelle-pomodoro", price: 55,
    image_url: "/images/pasta-pomodoro.webp", image_alt: "Tagliatelle in a bright tomato sauce topped with fresh basil and parmesan shavings",
    short_description: "Bright tomato sauce, fresh basil, parmesan.",
    description: "Tagliatelle tossed in a simple tomato sauce with fresh basil and shaved parmesan.",
    ingredients: ["Tagliatelle", "Tomato sauce", "Basil", "Parmesan"],
  },
  {
    cat: 5, name: "Skillet Pasta", slug: "skillet-pasta", price: 66,
    image_url: "/images/chef-pasta-skillet.webp", image_alt: "A masked chef in black gloves holding a skillet of creamy pasta",
    short_description: "Creamy pasta, served sizzling in the pan.",
    description: "Creamy pasta finished with cheese and herbs, served in a hot skillet.",
    ingredients: ["Pasta", "Cream sauce", "Cheese", "Herbs"],
  },
  {
    cat: 6, featured: true, name: "Chocolate Lava Cake", slug: "chocolate-lava-cake", price: 42,
    image_url: "/images/dessert-lava-cake.webp", image_alt: "Chocolate fondant with vanilla ice cream, cherry compote and a spun-sugar garnish",
    short_description: "Molten chocolate, vanilla ice cream, cherries.",
    description: "A warm chocolate fondant with a molten centre, vanilla ice cream, cherry compote and spun sugar.",
    ingredients: ["Dark chocolate", "Vanilla ice cream", "Cherry compote", "Spun sugar"],
  },
  {
    cat: 6, name: "Berry Sphere", slug: "berry-sphere", price: 48,
    image_url: "/images/dessert-sphere.webp", image_alt: "Glazed red dessert sphere with fresh berries, crumble and an amber sugar lattice",
    short_description: "Glossy berry mousse dome with crumble and sugar lace.",
    description: "A berry-glazed mousse dome with fresh berries, crumble and a caramel lattice.",
    ingredients: ["Berry mousse", "Fresh berries", "Crumble", "Caramel"],
  },
];

export const seedMenuItems: MenuItem[] = items.map(({ cat, featured, ...rest }, i) => ({
  id: id("d0000000", i + 1),
  category_id: id("c0000000", cat),
  ...rest,
  gallery_urls: [],
  allergens: [],
  allergens_verified: false,
  dietary_labels: [],
  is_available: true,
  is_featured: Boolean(featured),
  is_archived: false,
  is_sample: true,
  display_order: i + 1,
  ...ts,
}));

export const seedBranchMenuItems: BranchMenuItem[] = [];

export const seedDeliveryLinks: DeliveryLink[] = [];

export const seedFeedback: CustomerFeedback[] = [];

const slide = (n: number, image_url: string, image_alt: string, heading: string): HeroSlide => ({
  id: id("e0000000", n),
  image_url,
  image_alt,
  heading,
  subheading: "Unleash your appetite. Discover a different kind of dining experience.",
  primary_label: "Explore the menu",
  primary_href: "/menu",
  secondary_label: "Order now",
  secondary_href: "/#order",
  display_order: n,
  is_active: true,
  ...ts,
});

export const seedHeroSlides: HeroSlide[] = [
  slide(1, "/images/burger-double-dark.webp", "Double cheeseburger with dripping sauce against a black background", "Welcome to the madness."),
  slide(2, "/images/smoking-chicken-fries.webp", "Glazed chicken over fries served on rolling dry-ice fog", "Served with a little smoke."),
  slide(3, "/images/hot-stone-wagyu.webp", "Beef slices searing on a smoking hot stone beside a clown mask", "Hot stone. Hotter vibes."),
  slide(4, "/images/interior-neon-booths.webp", "Leather booths under pink neon signs inside MADNESS", "Step inside the madness."),
];

const g = (n: number, image_url: string, alt: string, placement: GalleryImage["placement"]): GalleryImage => ({
  id: id("f0000000", n),
  image_url,
  alt,
  caption: null,
  placement,
  display_order: n,
  is_active: true,
  ...ts,
});

export const seedGallery: GalleryImage[] = [
  g(1, "/images/chef-corn-skewers.webp", "Masked chef tasting a corn skewer", "home"),
  g(2, "/images/interior-madness-vibes.webp", "Purple neon sign reading Madness Vibes between two playing-card panels", "home"),
  g(3, "/images/hot-stone-chef.webp", "Masked chef pressing beef onto a hot stone in front of a neon bar", "home"),
  g(4, "/images/pasta-fusilli-mask.webp", "Creamy fusilli lifted from a foil parcel", "home"),
  g(5, "/images/interior-joker-mural.webp", "Large painted villain mural above tufted red booths", "home"),
  g(6, "/images/chef-smoking-dish.webp", "Masked chef seated behind a smoking dish under magenta light", "home"),
  g(7, "/images/loaded-fries-skillet.webp", "Loaded fries in a cast-iron skillet on a bed of gears", "home"),
  g(8, "/images/chef-sliders.webp", "Masked chef presenting two sliders", "home"),
  g(9, "/images/interior-neon-booths.webp", "Neon slogans above a long leather banquette", "about"),
  g(10, "/images/interior-shisha-wall.webp", "Illuminated shelves of copper shisha pipes beside a graffiti wall", "about"),
  g(11, "/images/chef-pasta-skillet.webp", "Masked chef holding a skillet of pasta", "about"),
  g(12, "/images/interior-madness-vibes.webp", "Madness Vibes neon sign", "about"),
];

export const seedSettings: SiteSettings = {
  site_name: "MADNESS",
  tagline: "Unleash your appetite.",
  footer_blurb: "A themed restaurant in the UAE where bold food meets comic-book chaos.",
  instagram_url: "https://www.instagram.com/madness.uae/",
  tiktok_url: null,
  facebook_url: null,
  contact_email: null,
  contact_phone: null,
  google_reviews_url: null,
  home_about_heading: "Not just a meal. An experience.",
  home_about_body:
    "At MADNESS, dinner comes with a show. Masked chefs, neon on every wall and plates that arrive smoking, sizzling or stacked sky high. Come hungry and leave with a story.",
  home_about_image: "/images/chef-smoking-dish.webp",
  about_intro: "MADNESS is a villain-themed restaurant where every plate is a little bit of theatre.",
  about_story:
    "This is where the MADNESS story goes: how it started, who is behind it and what drives the team. Replace this paragraph in Admin, Content, with details supplied by the restaurant.",
  about_philosophy:
    "Bold flavours, generous portions and presentation that makes the whole table reach for their phones. Replace with the kitchen's own words.",
  about_atmosphere:
    "Tufted leather booths, neon slogans, graffiti murals and a team in masks who stay in character. It is loud, playful and a little bit unhinged, in the best way.",
  show_sample_notice: true,
};
