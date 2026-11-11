# ChargeAfter packages

Two Submilli packages that provide the same `chargeafter.com/...` capabilities.

## `@puyol-labs/chargeafter-demo`

A self-contained fictional fixture for offline agent and policy demonstrations. It makes no HTTP calls and reads no secrets.

- [The package](packages/chargeafter-demo/README.md) contains the fixture implementation, capabilities, documentation, and tests.
- [The operation reference](packages/chargeafter-demo/docs/readme.md) describes the `chargeafter.com/...` capabilities and fictional data.

## `@puyol-labs/chargeafter`

The ChargeAfter API client for a single merchant credential. It reads `CHARGEAFTER_PRIVATE_KEY` inside the package. You set the API host at install time with the required `baseUrl`. The repository contains no credentials.

- [The package](packages/chargeafter/README.md) covers installation and example grants.
- [The operation reference](packages/chargeafter/docs/readme.md) describes operations, errors, and capability fields.

`submilli.toml` declares both packages.
