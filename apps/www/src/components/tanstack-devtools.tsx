"use client";

import { useEffect, useMemo } from "react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/router-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { usePathname, useSearchParams } from "next/navigation";

import { router } from "@/lib/router";

export function TanstackDevtools() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();

  const nextLocation = useMemo(() => {
    const search = searchParams?.toString() ?? "";
    return search.length > 0 ? `${pathname}?${search}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    void router
      .navigate({
        to: nextLocation,
        replace: true,
        params: true,
        search: true,
      })
      .catch(() => {
        // We only mirror Next.js navigation for devtools, so swallow errors that stem from
        // paths not represented in the synthetic route tree.
      });
  }, [nextLocation]);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <TanStackDevtools
      config={{
        position: "bottom-right",
        defaultOpen: false,
      }}
      plugins={[
        {
          id: "router",
          name: "Router",
          render: <TanStackRouterDevtoolsPanel router={router} />,
        },
        {
          id: "query",
          name: "Query",
          render: <ReactQueryDevtoolsPanel />,
        },
      ]}
    />
  );
}
