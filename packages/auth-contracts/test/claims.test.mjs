import assert from "node:assert/strict";
import test from "node:test";

import * as authContracts from "../dist/index.js";

test("exports the access-token claim validator contract", () => {
  assert.equal(typeof authContracts.validateAccessTokenClaims, "function");
});
