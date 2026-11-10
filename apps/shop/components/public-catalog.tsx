"use client";

import { useEffect, useState } from "react";
import { WebsiteProductCard } from "../../../packages/website-ui/src";
import type { PublicWebsiteProduct } from "../../../packages/contracts/src/website";

type Result = {
  products: PublicWebsiteProduct[];
  page: number;
  total: number;
  totalPages: number;
  facets: { categories: string[]; brands: string[] };
};
export function PublicCatalog({
  query,
  collection,
}: {
  query: Record<string, string>;
  collection?: string;
}) {
  const [filters, setFilters] = useState(() => ({
    search: query.search ?? "",
    category: query.category ?? "",
    brand: query.brand ?? "",
    moq: query.moq ?? "",
    method: query.method ?? "",
    sort: query.sort ?? "featured",
  }));
  const [page, setPage] = useState(1),
    [result, setResult] = useState<Result | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const queryKey = JSON.stringify(query);
  useEffect(() => {
    const input = JSON.parse(queryKey) as Record<string, string>;
    setFilters({
      search: input.search ?? "",
      category: input.category ?? "",
      brand: input.brand ?? "",
      moq: input.moq ?? "",
      method: input.method ?? "",
      sort: input.sort ?? "featured",
    });
    setPage(1);
  }, [queryKey, collection]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      void fetch(
        `/api/catalog/public?${new URLSearchParams({ ...filters, page: String(page), pageSize: "12", ...(collection ? { collection } : {}) })}`,
        {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        },
      )
        .then(async (response) => {
          if (!response.ok)
            throw new Error("Approved products could not load.");
          const data = (await response.json()) as Result;
          setResult(data);
          setError("");
        })
        .catch((error) => {
          if (!controller.signal.aborted)
            setError(
              error instanceof Error ? error.message : "Catalog unavailable.",
            );
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [filters, page, collection]);
  const change = (key: keyof typeof filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  return (
    <main className="web-section" id="catalog-grid">
      <h1>{collection ? "Curated collection" : "Find your canvas."}</h1>
      <p>
        Approved products for your next project. Configure your selection and
        request a reviewed quote.
      </p>
      <div className="web-catalog-filters">
        <label>
          Search catalog
          <input
            type="search"
            value={filters.search}
            onChange={(e) => change("search", e.target.value)}
          />
        </label>
        <label>
          Category
          <select
            value={filters.category}
            onChange={(e) => change("category", e.target.value)}
          >
            <option value="">All categories</option>
            {result?.facets.categories.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Brand
          <select
            value={filters.brand}
            onChange={(e) => change("brand", e.target.value)}
          >
            <option value="">All brands</option>
            {result?.facets.brands.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Maximum minimum order
          <select
            value={filters.moq}
            onChange={(e) => change("moq", e.target.value)}
          >
            <option value="">Any quantity</option>
            <option value="1">1 unit</option>
            <option value="12">12 units</option>
            <option value="24">24 units</option>
            <option value="100">100 units</option>
          </select>
        </label>
        <label>
          Sort products
          <select
            value={filters.sort}
            onChange={(e) => change("sort", e.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="name">Name A–Z</option>
            <option value="moq">Lowest minimum</option>
          </select>
        </label>
      </div>
      {error && <p role="alert">{error}</p>}
      {loading && <p role="status">Loading approved products…</p>}
      {result && (
        <>
          <p className="product-count">
            {result.total} products
            {filters.search && <> for “{filters.search}”</>}
          </p>
          <div className="web-products" aria-busy={loading}>
            {result.products.map((product) => (
              <WebsiteProductCard key={product.id} product={product} />
            ))}
          </div>
          {!result.total && (
            <p>No products match. Try another search or category.</p>
          )}
          <div className="web-actions">
            <button
              className="web-button web-secondary"
              disabled={loading || page === 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous catalog page
            </button>
            <span>
              Page {page} of {result.totalPages}
            </span>
            <button
              className="web-button web-secondary"
              disabled={loading || page >= result.totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next catalog page
            </button>
          </div>
        </>
      )}
    </main>
  );
}
