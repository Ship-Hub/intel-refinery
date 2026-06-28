const test = require("node:test");
const assert = require("node:assert/strict");

const {
  findMatchingTokenTransfer,
  parseTokenAmountToRaw
} = require("../src/web3/services/paymentProofIntelligence");

test("token amount parser converts decimal token amounts to raw units", () => {
  assert.equal(
    parseTokenAmountToRaw("12.3456", 6).toString(),
    "12345600"
  );
});

test("ERC-20 payment proof matcher validates hash, recipient, sender and amount", () => {
  const result = findMatchingTokenTransfer({
    txHash:
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    expectedFrom:
      "0x1111111111111111111111111111111111111111",
    expectedTo:
      "0x2222222222222222222222222222222222222222",
    expectedAmount:
      "25",
    tokenDecimals:
      6,
    transfers: [
      {
        hash:
          "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        from:
          "0x1111111111111111111111111111111111111111",
        to:
          "0x2222222222222222222222222222222222222222",
        value:
          "25000000"
      }
    ]
  });

  assert.equal(result.checks.transferFound, true);
  assert.equal(result.checks.fromMatches, true);
  assert.equal(result.checks.toMatches, true);
  assert.equal(result.checks.amountMatches, true);
});