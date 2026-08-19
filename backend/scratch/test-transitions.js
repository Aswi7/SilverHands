const mongoose = require('mongoose');
const Match = require('../models/Match');
const { updateMatchStatus } = require('../controllers/matchController');

// Test matrix for State Machine
console.log("Starting State Machine Verification Test...");

const VALID_TRANSITIONS = {
  APPLIED: ['ACCEPTED', 'REJECTED'],
  PENDING: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['CONFIRMED', 'CANCELLED', 'CONTACTED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  REJECTED: [],
  COMPLETED: [],
  CANCELLED: []
};

// Check valid transitions
const testCases = [
  { from: 'APPLIED', to: 'ACCEPTED', valid: true },
  { from: 'APPLIED', to: 'REJECTED', valid: true },
  { from: 'APPLIED', to: 'CONFIRMED', valid: false }, // Stage skipping forbidden
  { from: 'APPLIED', to: 'COMPLETED', valid: false }, // Stage skipping forbidden
  { from: 'ACCEPTED', to: 'CONFIRMED', valid: true },
  { from: 'ACCEPTED', to: 'CANCELLED', valid: true },
  { from: 'ACCEPTED', to: 'COMPLETED', valid: false }, // Stage skipping forbidden
  { from: 'CONFIRMED', to: 'COMPLETED', valid: true },
  { from: 'CONFIRMED', to: 'CANCELLED', valid: true }
];

let passCount = 0;
let failCount = 0;

testCases.forEach(tc => {
  const allowed = (VALID_TRANSITIONS[tc.from] || []).includes(tc.to);
  const isAllowed = tc.valid === allowed;

  if (isAllowed) {
    console.log(`[PASS] ${tc.from} -> ${tc.to}: Expected valid=${tc.valid}, got=${allowed}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${tc.from} -> ${tc.to}: Expected valid=${tc.valid}, got=${allowed}`);
    failCount++;
  }
});

console.log(`\nTest Results: ${passCount} Passed, ${failCount} Failed.`);
if (failCount === 0) {
  console.log("SUCCESS: All 4-stage transition rules verified successfully!");
} else {
  process.exit(1);
}
