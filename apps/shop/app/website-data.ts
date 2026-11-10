import { cache } from "react";
import { headers } from "next/headers";
import { websiteIdentity } from "../../../packages/server/src/website";
import { readPublishedWebsite } from "../../../packages/marketing/src/website/repository";

/** Request-scoped only: never share a customer's private store identity across requests. */
export const publishedWebsite = cache(
  async (path: string, storeId?: string) => {
    const identity = await websiteIdentity(new Headers(await headers()));
    const scoped = await readPublishedWebsite(identity, path, storeId);
    return scoped ?? (storeId ? readPublishedWebsite(identity, "/") : null);
  },
);
