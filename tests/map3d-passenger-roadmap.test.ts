import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { PassengerRoadmap } from "../src/components/map3d/PassengerRoadmap";

test("passenger roadmap starts as a closed panel under its map button", () => {
  const html = renderToStaticMarkup(createElement(PassengerRoadmap));

  assert.match(html, /class="passenger-map-guide"/);
  assert.match(html, /<button[^>]*aria-expanded="false"[^>]*aria-controls="passenger-roadmap"/);
  assert.match(html, /<section[^>]*id="passenger-roadmap"[^>]*hidden=""/);
  assert.doesNotMatch(html, /href="#passenger-roadmap"/);
});

test("passenger roadmap retains the three departure stages without promising a floor-two route", () => {
  const html = renderToStaticMarkup(createElement(PassengerRoadmap));

  assert.match(html, /id="passenger-roadmap"/);
  assert.match(html, /Departure 1/);
  assert.match(html, /Departure 4/);
  assert.match(html, /naik ke lantai 2/i);
  assert.match(html, /Selamat menikmati keberangkatan Anda/);
  assert.match(html, /belum terhubung ke peta/i);
});
