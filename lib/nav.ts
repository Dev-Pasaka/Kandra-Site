export interface NavItem {
  title: string;
  href: string;
  children?: NavItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const TUTORIAL_PAGES: NavItem[] = [
  { title: "01. Modeling, before any code", href: "/tutorial/01-modeling" },
  { title: "02. Project setup", href: "/tutorial/02-project-setup" },
  { title: "03. Entities", href: "/tutorial/03-entities" },
  { title: "04. Installing the plugin", href: "/tutorial/04-plugin-install" },
  { title: "05. Routes", href: "/tutorial/05-routes" },
  { title: "06. Denormalization: todos assigned to me", href: "/tutorial/06-denormalization" },
  { title: "07. Concurrency: optimistic locking", href: "/tutorial/07-concurrency" },
  { title: "08. Soft delete and undo", href: "/tutorial/08-soft-delete-and-trash" },
  { title: "09. Counters: completion stats", href: "/tutorial/09-counters" },
  { title: "10. Caching the hot path", href: "/tutorial/10-caching" },
  { title: "11. Observability", href: "/tutorial/11-observability" },
  { title: "12. Testing", href: "/tutorial/12-testing" },
  { title: "13. Migrations", href: "/tutorial/13-migrations" },
  { title: "14. Running it and shipping it", href: "/tutorial/14-running-and-shipping" },
  { title: "15. What we didn't do, on purpose", href: "/tutorial/15-what-we-didnt-do" },
];

export const PHILOSOPHY_PAGES: NavItem[] = [
  { title: "Atomicity", href: "/philosophy/atomicity" },
  { title: "Consistency", href: "/philosophy/consistency" },
  { title: "Schema safety", href: "/philosophy/schema-safety" },
  { title: "Denormalization", href: "/philosophy/denormalization" },
  { title: "Testing", href: "/philosophy/testing" },
];

export const MODULE_PAGES: NavItem[] = [
  { title: "kandra-bom", href: "/modules/kandra-bom" },
  { title: "kandra-core", href: "/modules/kandra-core" },
  { title: "kandra-runtime", href: "/modules/kandra-runtime" },
  { title: "kandra-codegen", href: "/modules/kandra-codegen" },
  { title: "kandra-ktor", href: "/modules/kandra-ktor" },
  { title: "kandra-koin", href: "/modules/kandra-koin" },
  { title: "kandra-kodein", href: "/modules/kandra-kodein" },
  { title: "kandra-migrate", href: "/modules/kandra-migrate" },
  { title: "kandra-multidc", href: "/modules/kandra-multidc" },
  { title: "kandra-jakarta", href: "/modules/kandra-jakarta" },
  { title: "kandra-test", href: "/modules/kandra-test" },
];

export const RECIPE_PAGES: NavItem[] = [
  { title: "Lookup tables", href: "/recipes/lookup-tables" },
  { title: "Time-series data", href: "/recipes/time-series" },
  { title: "Soft delete", href: "/recipes/soft-delete" },
  { title: "Counters", href: "/recipes/counters" },
  { title: "Optimistic locking", href: "/recipes/optimistic-locking" },
  { title: "Multi-table writes", href: "/recipes/multi-table-writes" },
  { title: "Caching", href: "/recipes/caching" },
  { title: "Migrations", href: "/recipes/migrations" },
  { title: "Multi-DC deployment", href: "/recipes/multi-dc-deployment" },
  { title: "Social feed capstone", href: "/recipes/social-feed-capstone" },
];

export const BATTLE_SCAR_PAGES: NavItem[] = [
  { title: "Clustering keys & lookup tables", href: "/battle-scars/clustering-keys-and-lookup-tables" },
  { title: "The batch-scope shadowing saga", href: "/battle-scars/batch-scope-shadowing" },
  { title: "Cache invalidation", href: "/battle-scars/cache-invalidation" },
  { title: "Codegen collection types", href: "/battle-scars/codegen-collection-types" },
  { title: "Migrations: checksums & locking", href: "/battle-scars/migration-safety" },
  { title: "Testing the untestable: LWT & fakes", href: "/battle-scars/testing-lwt-and-fakes" },
  { title: "Early-days hardening", href: "/battle-scars/early-hardening" },
];

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Start here",
    items: [
      { title: "Why Kandra", href: "/why" },
      { title: "Foundations", href: "/foundations" },
      { title: "Getting started", href: "/getting-started" },
    ],
  },
  {
    title: "Tutorial",
    items: [{ title: "Overview", href: "/tutorial" }, ...TUTORIAL_PAGES],
  },
  {
    title: "Philosophy",
    items: [{ title: "Overview", href: "/philosophy" }, ...PHILOSOPHY_PAGES],
  },
  {
    title: "Modules",
    items: [{ title: "Overview", href: "/modules" }, ...MODULE_PAGES],
  },
  {
    title: "Recipes",
    items: [{ title: "Overview", href: "/recipes" }, ...RECIPE_PAGES],
  },
  {
    title: "Reference",
    items: [{ title: "API reference", href: "/reference" }],
  },
  {
    title: "Battle scars",
    items: [{ title: "Overview", href: "/battle-scars" }, ...BATTLE_SCAR_PAGES],
  },
  {
    title: "Project",
    items: [
      { title: "Changelog", href: "/changelog" },
      { title: "FAQ", href: "/faq" },
    ],
  },
];

function flattenForPagination(): NavItem[] {
  const order: NavItem[] = [
    { title: "Home", href: "/" },
    { title: "Why Kandra", href: "/why" },
    { title: "Foundations", href: "/foundations" },
    { title: "Getting started", href: "/getting-started" },
    { title: "Tutorial overview", href: "/tutorial" },
    ...TUTORIAL_PAGES,
    { title: "Philosophy overview", href: "/philosophy" },
    ...PHILOSOPHY_PAGES,
    { title: "Modules overview", href: "/modules" },
    ...MODULE_PAGES,
    { title: "Recipes overview", href: "/recipes" },
    ...RECIPE_PAGES,
    { title: "Battle scars overview", href: "/battle-scars" },
    ...BATTLE_SCAR_PAGES,
    { title: "Changelog", href: "/changelog" },
    { title: "FAQ", href: "/faq" },
  ];
  return order;
}

export const PAGINATION_ORDER = flattenForPagination();

export function getPrevNext(pathname: string): { prev: NavItem | null; next: NavItem | null } {
  const idx = PAGINATION_ORDER.findIndex((item) => item.href === pathname);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? PAGINATION_ORDER[idx - 1] : null,
    next: idx < PAGINATION_ORDER.length - 1 ? PAGINATION_ORDER[idx + 1] : null,
  };
}
