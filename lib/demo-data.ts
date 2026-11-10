export type DemoBusiness = {
  id: string;
  name: string;
  slug: string;
  loyalty_goal: number;
  loyalty_reward: string;
  primary_color: string;
  accent_color: string;
  public_id: string;
  appearance: {
    background: string;
    text: string;
    button: string;
    earned: string;
    pending: string;
    stamp_icon: "heart" | "star" | "cup" | "dot";
    stamp_shape: "circle" | "rounded" | "square";
    font: "Manrope" | "DM Sans" | "Georgia";
    logo: string;
  };
};

export type DemoProduct = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  category: string | null;
};

export type DemoCustomer = {
  id: string;
  business_id: string;
  full_name: string;
  phone: string;
  stamps: number;
  qr_token: string;
};

export type DemoPurchase = {
  id: string;
  business_id: string;
  customer_id: string;
  amount: number;
  purchased_at: string;
};

export type DemoRedemption = {
  id: string;
  business_id: string;
  customer_id: string;
  reward: string;
  redeemed_at: string;
};

export type DemoData = {
  businesses: DemoBusiness[];
  active_business_id: string;
  products: DemoProduct[];
  customers: DemoCustomer[];
  purchases: DemoPurchase[];
  redemptions: DemoRedemption[];
};

export type DemoWorkspace = {
  business: DemoBusiness;
  products: DemoProduct[];
  customers: DemoCustomer[];
  purchases: DemoPurchase[];
  redemptions: DemoRedemption[];
};

export const DEMO_STORAGE_KEY = "smartlink-hub-demo-v1";

const initialDemoData: DemoData = {
  businesses: [
    {
      id: "demo-business",
      name: "La Estación Café",
      slug: "la-estacion-cafe",
      loyalty_goal: 10,
      loyalty_reward: "Una bebida gratis",
      primary_color: "#FF6B5B",
      accent_color: "#FFF0E9",
      public_id: "fl-la-estacion-cafe-7k4m",
      appearance: { background: "#FFF6EE", text: "#3A1F3D", button: "#FF6B5B", earned: "#FF6B5B", pending: "#F3DDD4", stamp_icon: "heart", stamp_shape: "circle", font: "Manrope", logo: "" },
    },
  ],
  active_business_id: "demo-business",
  products: [
    {
      id: "demo-product-americano",
      business_id: "demo-business",
      name: "Café americano",
      description: "Espresso doble y agua caliente.",
      price: 45,
      is_available: true,
      category: "Café",
    },
    {
      id: "demo-product-latte",
      business_id: "demo-business",
      name: "Latte vainilla",
      description: "Espresso, leche y vainilla.",
      price: 65,
      is_available: true,
      category: "Café",
    },
    {
      id: "demo-product-croissant",
      business_id: "demo-business",
      name: "Croissant",
      description: "Hojaldre horneado.",
      price: 42,
      is_available: true,
      category: "Panadería",
    },
  ],
  customers: [
    {
      id: "demo-customer-01",
      business_id: "demo-business",
      full_name: "Cliente de prueba 01",
      phone: "DEMO-0001",
      stamps: 6,
      qr_token: "demo-qr-0001",
    },
    {
      id: "demo-customer-02",
      business_id: "demo-business",
      full_name: "Cliente de prueba 02",
      phone: "DEMO-0002",
      stamps: 10,
      qr_token: "demo-qr-0002",
    },
  ],
  purchases: [],
  redemptions: [],
};

const isHexColor = (value: unknown): value is string =>
  typeof value === "string" && /^#[\da-f]{6}$/i.test(value);

function normalizeBusiness(value: unknown, fallback: DemoBusiness): DemoBusiness | null {
  if (!value || typeof value !== "object") return null;
  const business = value as Partial<DemoBusiness>;
  if (
    typeof business.id !== "string" ||
    typeof business.name !== "string" ||
    typeof business.slug !== "string"
  ) {
    return null;
  }
  const appearance = business.appearance && typeof business.appearance === "object"
    ? business.appearance as Partial<DemoBusiness["appearance"]> : {};
  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    loyalty_goal: Number.isInteger(business.loyalty_goal) && Number(business.loyalty_goal) >= 2 && Number(business.loyalty_goal) <= 50
      ? Number(business.loyalty_goal)
      : fallback.loyalty_goal,
    loyalty_reward: typeof business.loyalty_reward === "string" ? business.loyalty_reward : fallback.loyalty_reward,
    primary_color: isHexColor(business.primary_color) ? business.primary_color : fallback.primary_color,
    accent_color: isHexColor(business.accent_color) ? business.accent_color : fallback.accent_color,
    public_id: typeof business.public_id === "string" && business.public_id ? business.public_id : `fl-${business.id}`,
    appearance: {
      background: isHexColor(appearance.background) ? appearance.background : fallback.appearance.background,
      text: isHexColor(appearance.text) ? appearance.text : fallback.appearance.text,
      button: isHexColor(appearance.button) ? appearance.button : fallback.appearance.button,
      earned: isHexColor(appearance.earned) ? appearance.earned : fallback.appearance.earned,
      pending: isHexColor(appearance.pending) ? appearance.pending : fallback.appearance.pending,
      stamp_icon: ["heart", "star", "cup", "dot"].includes(String(appearance.stamp_icon)) ? appearance.stamp_icon! : fallback.appearance.stamp_icon,
      stamp_shape: ["circle", "rounded", "square"].includes(String(appearance.stamp_shape)) ? appearance.stamp_shape! : fallback.appearance.stamp_shape,
      font: ["Manrope", "DM Sans", "Georgia"].includes(String(appearance.font)) ? appearance.font! : fallback.appearance.font,
      logo: typeof appearance.logo === "string" ? appearance.logo : "",
    },
  };
}

export function createInitialDemoData(): DemoData {
  return JSON.parse(JSON.stringify(initialDemoData)) as DemoData;
}

export function getActiveDemoWorkspace(data: DemoData): DemoWorkspace {
  const business = data.businesses.find((item) => item.id === data.active_business_id) ?? data.businesses[0];
  return {
    business,
    products: data.products.filter((item) => item.business_id === business.id),
    customers: data.customers.filter((item) => item.business_id === business.id),
    purchases: data.purchases.filter((item) => item.business_id === business.id),
    redemptions: data.redemptions.filter((item) => item.business_id === business.id),
  };
}

export function getDemoBusiness(data: DemoData, businessId: string) {
  return data.businesses.find((item) => item.id === businessId) ?? null;
}

export function createDemoBusiness(data: DemoData, name: string): DemoData {
  const cleanName = name.trim();
  if (!cleanName) return data;
  const baseSlug = cleanName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "negocio-demo";
  let slug = baseSlug;
  let suffix = 2;
  while (data.businesses.some((business) => business.slug === slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  const business: DemoBusiness = {
    id: `demo-business-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: cleanName,
    slug,
    loyalty_goal: 10,
    loyalty_reward: "Una bebida gratis",
    primary_color: "#FF6B5B",
    accent_color: "#FFF0E9",
    public_id: `fl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    appearance: { ...initialDemoData.businesses[0].appearance },
  };
  return {
    ...data,
    businesses: [...data.businesses, business],
    active_business_id: business.id,
  };
}

export function readDemoData(): DemoData {
  if (typeof window === "undefined") return createInitialDemoData();

  try {
    const saved = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!saved) return createInitialDemoData();

    const parsed = JSON.parse(saved) as Record<string, unknown>;
    const legacyBusiness = parsed.business;
    const rawBusinesses = Array.isArray(parsed.businesses)
      ? parsed.businesses
      : legacyBusiness ? [legacyBusiness] : [];
    const fallbackBusiness = initialDemoData.businesses[0];
    const businesses = rawBusinesses
      .map((item) => normalizeBusiness(item, fallbackBusiness))
      .filter((item): item is DemoBusiness => item !== null);
    if (!businesses.length) return createInitialDemoData();

    const activeIdCandidate = typeof parsed.active_business_id === "string"
      ? parsed.active_business_id
      : businesses[0].id;
    const activeBusinessId = businesses.some((item) => item.id === activeIdCandidate)
      ? activeIdCandidate
      : businesses[0].id;

    const normalizeRows = <T extends { id: string; business_id: string }>(
      rows: unknown,
      defaultBusinessId: string,
    ): T[] => {
      if (!Array.isArray(rows)) return [];
      return rows.filter((row): row is T => {
        if (!row || typeof row !== "object") return false;
        const value = row as Partial<T>;
        const businessId = typeof value.business_id === "string" ? value.business_id : defaultBusinessId;
        return typeof value.id === "string" && businesses.some((business) => business.id === businessId);
      }).map((row) => ({
        ...row,
        business_id: typeof row.business_id === "string" ? row.business_id : activeBusinessId,
      }));
    };

    return {
      businesses,
      active_business_id: activeBusinessId,
      products: normalizeRows<DemoProduct>(parsed.products, activeBusinessId),
      customers: normalizeRows<DemoCustomer>(parsed.customers, activeBusinessId).map((customer) => ({
        ...customer,
        qr_token: typeof customer.qr_token === "string" && customer.qr_token
          ? customer.qr_token : `c-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`,
      })),
      purchases: normalizeRows<DemoPurchase>(parsed.purchases, activeBusinessId),
      redemptions: normalizeRows<DemoRedemption>(parsed.redemptions, activeBusinessId),
    };
  } catch {
    return createInitialDemoData();
  }
}

export function saveDemoData(data: DemoData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
}

export function resetDemoData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_STORAGE_KEY);
}
