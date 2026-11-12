/** Safe shared labels/types only; no provider, database or private runtime dependency. */
export const PRICE_CLASSES=['PUBLISHED_LIST','MSRP','MAP','DISTRIBUTOR_NET','ACCOUNT_NET','NEGOTIATED','MARKET_OBSERVATION','ESTIMATED_LANDED','TWELVESPEC_SELL','ACTUAL_COST'] as const;
export const PRICE_LABELS:Record<typeof PRICE_CLASSES[number],string>={PUBLISHED_LIST:'Published list price',MSRP:'Suggested retail price',MAP:'Minimum advertised price',DISTRIBUTOR_NET:'Distributor net cost',ACCOUNT_NET:'Account-specific net cost',NEGOTIATED:'Negotiated net cost',MARKET_OBSERVATION:'Market observation',ESTIMATED_LANDED:'Estimated landed cost',TWELVESPEC_SELL:'TwelveSpec selling price',ACTUAL_COST:'Historical actual cost'};
export const COST_COMPONENTS=['material_cost','decoration_run_cost','setup','prepress','outsourced_labor','packaging','allocated_freight','other_direct_cost'] as const;
export type CostComponent=typeof COST_COMPONENTS[number];
export const CHARGE_BASES=['PER_ITEM','PER_ORDER','PER_SHIPMENT'] as const;
export type ChargeBasis=typeof CHARGE_BASES[number];
