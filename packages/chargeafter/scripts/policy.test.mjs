import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const bin = process.env.SUBMILLI_BIN ?? "submilli";
const cwd = new URL("../../..", import.meta.url).pathname;
function run(args, env) { return spawnSync(bin, args, { cwd, env: { ...process.env, ...env }, encoding: "utf8" }); }

test("real package enforces caller policy in an isolated local store", async () => {
    const home = await mkdtemp(join(tmpdir(), "chargeafter-policy-"));
    try {
        const env = { SUBMILLI_HOME: home };
        const published = run(["build", "publish-local", "--deny-warnings", "-p", "@puyol-labs/chargeafter", "--config", "baseUrl=https://api-sandbox.ca-dev.co"], env);
        assert.equal(published.status, 0, published.stderr);
        const blueprint = join(home, "policy.yaml");
        await writeFile(blueprint, `kind: blueprint
name: chargeafter-policy
packages:
  - '@puyol-labs/chargeafter'
variables:
  storeId:
    required: true
default: deny
permissions:
  main:
    - capability: chargeafter.com/links.sendApply
      filter: storeId == \${vars.storeId} and deliveryMethod == "Email"
      action: allow
    - capability: chargeafter.com/charges.get
      action: allow
    - capability: chargeafter.com/charges.settle
      action: deny
  '@puyol-labs/chargeafter':
    - capability: http.get
      filter: host == "api-sandbox.ca-dev.co"
      action: allow
    - capability: http.post
      filter: host == "api-sandbox.ca-dev.co"
      action: allow
    - capability: http.patch
      filter: host == "api-sandbox.ca-dev.co"
      action: allow
    - capability: secrets.get
      filter: name == "CHARGEAFTER_PRIVATE_KEY"
      action: allow
secrets:
  CHARGEAFTER_PRIVATE_KEY:
    store: chargeafter_test
`);
        const script = join(home, "real.ts");
        await writeFile(script, `import { sendApplyLink } from "@puyol-labs/chargeafter";
function denied(capability: string, action: () => void): void { try { action(); } catch (error) { assert(error.name === "PermissionDeniedError" && error.message.includes(capability), "wrong denial"); return; } assert(false, "expected denial"); }
function main(): string { denied("chargeafter.com/links.sendApply", () => { sendApplyLink({ consumer: { firstName: "Ada", lastName: "Morris", email: "ada@example.test" }, deliveryMethod: "Email", storeId: "hooli", channel: "E_COMMERCE" }); }); try { sendApplyLink({ consumer: { firstName: "Ada", lastName: "Morris", email: "ada@example.test" }, deliveryMethod: "Email", storeId: "pied_piper", channel: "E_COMMERCE" }); } catch (error) { assert(error.name === "ChargeAfterError" && error.message.includes("CHARGEAFTER_PRIVATE_KEY"), "expected missing key before HTTP"); return "ok"; } assert(false, "expected missing key"); return "unreachable"; }`);
        const lintReal = run(["blueprint", "lint", "--deny-warnings", blueprint], env);
        assert.equal(lintReal.status, 0, lintReal.stderr);
        const missingVariable = run(["run", "--blueprint", blueprint, script], env);
        assert.notEqual(missingVariable.status, 0, "required blueprint variable must reject an unbound run");
        const real = run(["run", "--blueprint", blueprint, "--var", "storeId=pied_piper", script], env);
        assert.equal(real.status, 0, real.stderr);
    } finally { await rm(home, { recursive: true, force: true }); }
});
