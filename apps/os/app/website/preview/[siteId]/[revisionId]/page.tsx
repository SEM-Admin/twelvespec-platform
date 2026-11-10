import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { websitePreviewForRender } from "../../../../../../../packages/server/src/website";
import {
  WebsiteFooter,
  WebsiteNavigation,
  WebsiteSections,
  WebsiteTheme,
} from "../../../../../../../packages/website-ui/src";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Private website revision preview",
  robots: { index: false, follow: false },
};
export default async function Preview({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string; revisionId: string }>;
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  const { siteId, revisionId } = await params,
    query = await searchParams,
    requestHeaders = new Headers(await headers());
  if (query.workspaceId)
    requestHeaders.set("x-workspace-id", query.workspaceId);
  let website;
  try {
    website = await websitePreviewForRender(requestHeaders, siteId, revisionId);
  } catch {
    notFound();
  }
  return (
    <WebsiteTheme website={website}>
      <p className="web-hint">
        Private revision preview · Links are disabled. Publication is a separate
        action.
      </p>
      <WebsiteNavigation website={website} />
      <main>
        <WebsiteSections website={website} />
      </main>
      <WebsiteFooter website={website} />
    </WebsiteTheme>
  );
}
