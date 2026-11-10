import { request, type Data } from "./types";

export async function websiteCommand<T = unknown>(
  action: string,
  input: Data,
): Promise<T> {
  return (
    await request<{ result: T }>("/api/website", {
      method: "POST",
      body: JSON.stringify({ action, input }),
    })
  ).result;
}
