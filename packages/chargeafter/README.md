# @puyol-labs/chargeafter

Typed operations for one ChargeAfter merchant credential. The package reads
`CHARGEAFTER_PRIVATE_KEY` internally and sends it as a Bearer token. Generated
programs never receive the key.

For now, this package is sandbox-only. The required install-time `baseUrl`
must be `https://api-sandbox.ca-dev.co`. `capabilities.yaml` grants HTTP only
to that sandbox host, so a production `baseUrl` would be denied. Do not use
`https://api.chargeafter.com` until production-host grants exist. A key is
scoped to one merchant.
Read capabilities accept only IDs or date ranges, so reads cannot be filtered
by store. `storeId` is policy-visible for new application and checkout links.

Add the Package to a Blueprint, then use the derived capabilities as the
starting point for grants:

```sh
submilli install puyol-labs/portal-tools @puyol-labs/chargeafter --config baseUrl=https://api-sandbox.ca-dev.co
submilli blueprint add-package @puyol-labs/chargeafter --no-capabilities
submilli blueprint capability list @puyol-labs/chargeafter
```

`blueprint add-package` writes the Package's `secrets.get` and HTTP grants.
Review the caller grants separately. For example, a field-support role can
allow status and funding reads, allow a send-link only for its bound store, and
deny every charge mutation:

```yaml
permissions:
  main:
    - capability: chargeafter.com/links.sendApply
      filter: storeId == ${vars.storeId} and (deliveryMethod == "Sms" or deliveryMethod == "Email")
      action: allow
    - capability: chargeafter.com/charges.settle
      action: deny
```

`settleCharge`, `voidCharge`, and `refundCharge` first fetch the authoritative
charge. They reject amounts outside the authoritative limits before their
operation check or write. A policy denial after that lookup prevents the write.

See [the model-facing documentation](docs/readme.md) for operations, return
values, errors, and a complete example.
