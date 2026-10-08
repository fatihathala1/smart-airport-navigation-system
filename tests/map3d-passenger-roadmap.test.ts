import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { PassengerRoadmap, parseGateNumber } from "../src/components/map3d/PassengerRoadmap";

test("passenger roadmap starts as a closed panel under its map button", () => {
  const html = renderToStaticMarkup(createElement(PassengerRoadmap));

  assert.match(html, /class="passenger-map-guide"/);
  assert.match(html, /<button[^>]*aria-expanded="false"[^>]*aria-controls="passenger-roadmap"/);
  assert.match(html, /<section[^>]*id="passenger-roadmap"[^>]*hidden=""/);
  assert.doesNotMatch(html, /href="#passenger-roadmap"/);
});

test("passenger roadmap retains the three departure stages and no longer says routes are missing", () => {
  const html = renderToStaticMarkup(createElement(PassengerRoadmap, { routeReady: true, gates: [1, 2, 3] }));

  assert.match(html, /id="passenger-roadmap"/);
  assert.match(html, /Departure 1/);
  assert.match(html, /Departure 4/);
  assert.match(html, /naik ke lantai 2/i);
  assert.match(html, /Selamat menikmati keberangkatan Anda/);
  assert.doesNotMatch(html, /belum terhubung ke peta/i);
  assert.doesNotMatch(html, /belum tersedia/i);
});

test("gate number is read from free text on the ticket", () => {
  assert.equal(parseGateNumber("5"), 5);
  assert.equal(parseGateNumber("Gate 12"), 12);
  assert.equal(parseGateNumber("G05"), 5);
  assert.equal(parseGateNumber("gate"), null);
  assert.equal(parseGateNumber("0"), null);
});
