// Converts the raw photos in /photo into resized WebP files in /public/images.
// Usage: node scripts/optimize-photos.mjs  (edit the map below when adding photos)
import sharp from "sharp";
import path from "node:path";
const root = process.cwd();
const map = {
  "012515": "burger-woodboard", "012522": "pasta-ragu", "012532": "dessert-sphere",
  "012551": "dessert-lava-cake", "012559": "spread-terrace", "012607": "burger-double-dark",
  "012614": "pasta-pomodoro", "012622": "dessert-platter", "012637": "chef-corn-skewers",
  "012647": "smoking-chicken-fries", "012654": "pasta-fusilli-mask", "012703": "skewers-glazed",
  "012709": "interior-madness-vibes", "012716": "chef-sliders", "012723": "burrata-berries",
  "012730": "hot-stone-wagyu", "012742": "chef-pasta-skillet", "012751": "interior-joker-mural",
  "012800": "mozzarella-sticks", "012814": "hot-stone-chef", "012823": "interior-shisha-wall",
  "012829": "interior-neon-booths", "012836": "loaded-fries-skillet", "012849": "chef-smoking-dish",
};
for (const [k, name] of Object.entries(map)) {
  const src = path.join(root, "photo", `Screenshot 2026-10-26 ${k}.png`);
  const out = path.join(root, "public", "images", `${name}.webp`);
  const info = await sharp(src).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
  console.log(name, info.width, info.height, Math.round(info.size / 1024) + "KB");
}
