import assert from "node:assert/strict";
import test from "node:test";
import {
  distanceFromT1Origin,
  geographicToT1Model,
  isUsableT1Position,
  T1_GEO_CALIBRATION,
} from "../src/lib/map3d/passenger-geolocation";
import { T1_METERS_PER_MODEL_UNIT } from "../src/lib/map3d/distance-calibration";

test("T1 origin uses the same calibrated model transform as exterior data", () => {
  const point = geographicToT1Model({
    latitude: T1_GEO_CALIBRATION.origin.latitude,
    longitude: T1_GEO_CALIBRATION.origin.longitude,
  });

  assert.ok(Math.abs(point[0] - -0.27) < 0.02);
  assert.ok(Math.abs(point[1] - -2.12) < 0.02);
});

test("nearby GPS movement agrees with the calibrated route distance", () => {
  const origin = T1_GEO_CALIBRATION.origin;
  const start = geographicToT1Model({ latitude: origin.latitude, longitude: origin.longitude });
  const aboutOneHundredMetersEast = geographicToT1Model({
    latitude: origin.latitude,
    longitude: origin.longitude + 100 / (111_320 * Math.cos((origin.latitude * Math.PI) / 180)),
  });
  const modelDistance = Math.hypot(
    (aboutOneHundredMetersEast[0] - start[0]) * T1_METERS_PER_MODEL_UNIT[0],
    (aboutOneHundredMetersEast[1] - start[1]) * T1_METERS_PER_MODEL_UNIT[2],
  );

  assert.ok(Math.abs(modelDistance - 100) < 0.01);
});

test("only accurate readings near Terminal 1 are used on the indoor map", () => {
  const origin = T1_GEO_CALIBRATION.origin;
  assert.ok(isUsableT1Position({ latitude: origin.latitude, longitude: origin.longitude }, 25));
  assert.equal(isUsableT1Position({ latitude: origin.latitude, longitude: origin.longitude }, 500), false);
  assert.equal(isUsableT1Position({ latitude: -7.2575, longitude: 112.7521 }, 10), false);
  assert.ok(distanceFromT1Origin({ latitude: -7.2575, longitude: 112.7521 }) > 1_200);
});
