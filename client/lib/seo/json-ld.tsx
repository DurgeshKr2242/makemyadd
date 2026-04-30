/**
 * JSON-LD structured-data helpers.
 *
 * The shapes follow schema.org. Google's Rich Results Test
 * (https://search.google.com/test/rich-results) is the source of
 * truth for what's currently indexed.
 *
 * Every builder returns a plain object that becomes the body of a
 * <script type="application/ld+json"> tag emitted by <JsonLd>.
 *
 * Server component — never imported into client code.
 */
import "server-only";
import type { TemplateConfig } from "@/lib/templates/types";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://adcreator.in";

interface JsonLdBase {
  "@context": "https://schema.org";
  "@type": string;
}

export interface WebSiteSchema extends JsonLdBase {
  "@type": "WebSite";
  name: string;
  url: string;
  description: string;
  inLanguage: string[];
  potentialAction: {
    "@type": "SearchAction";
    target: { "@type": "EntryPoint"; urlTemplate: string };
    "query-input": string;
  };
}

export interface OrganizationSchema extends JsonLdBase {
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  sameAs: string[];
  contactPoint: {
    "@type": "ContactPoint";
    contactType: "customer support";
    email: string;
    areaServed: "IN";
    availableLanguage: string[];
  };
}

export interface ProductSchema extends JsonLdBase {
  "@type": "Product";
  name: string;
  description: string;
  brand: { "@type": "Brand"; name: string };
  offers: {
    "@type": "Offer";
    priceCurrency: "INR";
    price: string;
    availability: "https://schema.org/InStock";
    url: string;
  };
}

export interface BreadcrumbListSchema extends JsonLdBase {
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

export interface ItemListSchema extends JsonLdBase {
  "@type": "ItemList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    item: {
      "@type": "CreativeWork";
      name: string;
      url: string;
      genre: string;
      inLanguage: string[];
    };
  }>;
}

export function buildWebSite(): WebSiteSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AdCreator",
    url: BASE_URL,
    description:
      "Generate professional ad creatives in Hindi, Tamil, Telugu, and English in under 30 seconds.",
    inLanguage: ["en", "hi", "ta", "te"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/templates?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildOrganization(): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AdCreator",
    url: BASE_URL,
    logo: `${BASE_URL}/icon-512.png`,
    sameAs: ["https://github.com/DurgeshKr2242/makemyadd"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "hello@adcreator.in",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi", "Tamil", "Telugu"],
    },
  };
}

export interface PricingPlan {
  name: string;
  description: string;
  price: string; // numeric, no currency symbol
  href: string;
}

export function buildProductPlans(
  plans: readonly PricingPlan[],
): ProductSchema[] {
  return plans.map((p) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: `AdCreator ${p.name}`,
    description: p.description,
    brand: { "@type": "Brand", name: "AdCreator" },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: p.price,
      availability: "https://schema.org/InStock",
      url: `${BASE_URL}${p.href}`,
    },
  }));
}

export function buildBreadcrumbs(
  items: readonly { name: string; path: string }[],
): BreadcrumbListSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${BASE_URL}${it.path}`,
    })),
  };
}

export function buildTemplatesItemList(
  templates: readonly TemplateConfig[],
): ItemListSchema {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: templates.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "CreativeWork",
        name: t.name,
        url: `${BASE_URL}/templates#${t.id}`,
        genre: t.category,
        inLanguage: ["en", "hi", "ta", "te"],
      },
    })),
  };
}

/** Server component that emits one or more JSON-LD scripts. Pass an
 *  array if multiple schemas live on the same page. */
export function JsonLd({ schemas }: { schemas: readonly object[] }) {
  return (
    <>
      {schemas.map((schema, i) => (
        <script
          // biome-ignore lint/suspicious/noArrayIndexKey: stable per-render
          key={i}
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is the canonical pattern for structured data
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />
      ))}
    </>
  );
}
