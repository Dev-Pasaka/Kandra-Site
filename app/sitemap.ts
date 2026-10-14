import type { MetadataRoute } from "next";
import { PAGINATION_ORDER } from "@/lib/nav";
import { getPosts, getTags } from "@/lib/blog";
import { SITE_URL } from "@/lib/site-config";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = new Set(PAGINATION_ORDER.map((item) => item.href));
  routes.add("/");
  routes.add("/modules");
  routes.add("/recipes");
  routes.add("/philosophy");
  routes.add("/battle-scars");
  routes.add("/reference");
  routes.add("/blog");
  for (const t of await getTags()) routes.add(`/blog/tags/${t.slug}`);

  const posts = await getPosts();
  const postDates = new Map(posts.map((p) => [`/blog/${p.slug}`, new Date(`${p.date}T00:00:00Z`)]));
  for (const path of postDates.keys()) routes.add(path);

  return Array.from(routes).map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: postDates.get(path) ?? new Date(),
  }));
}
