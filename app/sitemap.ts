import type { MetadataRoute } from "next";
import { PAGINATION_ORDER } from "@/lib/nav";

export const dynamic = "force-static";

const SITE_URL = "https://dev-pasaka.github.io/kandra-docs";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = new Set(PAGINATION_ORDER.map((item) => item.href));
  routes.add("/");
  routes.add("/modules");
  routes.add("/recipes");
  routes.add("/philosophy");
  routes.add("/battle-scars");
  routes.add("/reference");

  return Array.from(routes).map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));
}
