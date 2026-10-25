import type { BranchMenuItem, MenuCategory, MenuItem, ResolvedMenuItem } from "@/lib/types";

/**
 * Applies branch overrides (price and availability) and attaches the category.
 * Without a branch, base prices and availability are used.
 */
export function resolveMenu(
  items: MenuItem[],
  categories: MenuCategory[],
  overrides: BranchMenuItem[],
  branchId?: string | null,
): ResolvedMenuItem[] {
  const catById = new Map(categories.map((c) => [c.id, c]));
  const ovByItem = new Map(overrides.filter((o) => o.branch_id === branchId).map((o) => [o.menu_item_id, o]));
  return items
    .filter((m) => !m.is_archived && m.category_id && catById.has(m.category_id))
    .map((m) => {
      const cat = catById.get(m.category_id!)!;
      const ov = branchId ? ovByItem.get(m.id) : undefined;
      return {
        ...m,
        category: { id: cat.id, name: cat.name, slug: cat.slug },
        effective_price: ov?.price_override ?? m.price,
        effective_available: m.is_available && (ov ? ov.is_available : true),
      };
    });
}

/** Case- and accent-insensitive match on name, descriptions and ingredients. */
export function searchMenu(items: ResolvedMenuItem[], query: string): ResolvedMenuItem[] {
  const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
  const terms = norm(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return items;
  return items.filter((m) => {
    const hay = norm([m.name, m.short_description, m.description, m.category?.name, ...m.ingredients].filter(Boolean).join(" "));
    return terms.every((t) => hay.includes(t));
  });
}

export function groupByCategory(items: ResolvedMenuItem[], categories: MenuCategory[]) {
  return categories
    .map((c) => ({ category: c, items: items.filter((i) => i.category_id === c.id).sort((a, b) => a.display_order - b.display_order) }))
    .filter((g) => g.items.length > 0);
}
