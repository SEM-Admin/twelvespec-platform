# Configuration service

Safe JSON AST: `and`/`or` items, `not` item, and `eq`/`ne`/`gte`/`lte`/`in` with declared fields. Trees have depth/node/child limits, cycle detection, no source execution, and contradiction analysis for conjunctions. All authoritative cart/quote code should use `validateConfiguration(product.data, variant.data, input, template?.data)`.

Commands include `create_template`, `update_template` (a new revision), `review`, `approve`, `archive`, `save_rule`, `simulate`, `save_print_zone`, `configure`, `assign_template`, and `rollback_template`. Template assignment defaults to a side-effect-free dry run and returns eligible and rejected products. Application requires an idempotency key and stores a rollback manifest. Revert fails if a subsequent product edit would be overwritten.

Validation covers actual variant identity, color/size, integer quantities, MOQ, supported methods/locations and dependent rules. Missing constraints do not imply checkout eligibility; local results are quote-only. Product/template versions and the configuration hash are captured in each saved configuration.
