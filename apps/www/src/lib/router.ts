import { createMemoryHistory, createRouter, createRoute, createRootRoute } from "@tanstack/react-router";

const socialImage = "https://skeptic-systems.com/social-preview.png";

const rootRoute = createRootRoute({
  component: () => null,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  staticData: {
    title: "Skeptic Systems | Portfolio",
    description: "Skeptic Systems blends infrastructure, modern web, and automation into a single portfolio space.",
    image: socialImage,
  },
});

const imprintRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/imprint",
  staticData: {
    title: "Imprint | Skeptic Systems",
    description: "Legal disclosure and ownership details for the Skeptic Systems website.",
    image: socialImage,
  },
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  staticData: {
    title: "Privacy Policy | Skeptic Systems",
    description: "Transparency around data collection, usage, and retention across Skeptic Systems services.",
    image: socialImage,
  },
});

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects",
  staticData: {
    title: "Projects | Skeptic Systems",
    description: "Pinned GitHub work highlighting infrastructure tooling, automation, and interface experiments.",
    image: socialImage,
  },
});

const projectDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$slug",
  staticData: {
    title: "Project Detail | Skeptic Systems",
    description: "Repository structure, README, and metadata for a selected Skeptic Systems project.",
    image: socialImage,
  },
});

const terminalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terminal",
  staticData: {
    title: "Community Terminal | Skeptic Systems",
    description: "A moderated community feed that lets visitors drop a short terminal-style message.",
    image: socialImage,
  },
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  staticData: {
    title: "Not Found | Skeptic Systems",
    description: "The requested page could not be located across Skeptic Systems.",
    image: socialImage,
  },
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  imprintRoute,
  privacyRoute,
  projectsRoute,
  projectDetailRoute,
  terminalRoute,
  notFoundRoute,
]);

const history = createMemoryHistory({ initialEntries: ["/"] });

export const router = createRouter({
  routeTree,
  history,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
