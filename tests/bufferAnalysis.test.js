import test from "node:test";
import assert from "node:assert/strict";
import { point } from "@turf/turf";

import {
  calculateBufferAreaSquareKilometers,
  createDisasterBuffer,
  normalizeBufferRadius,
} from "../src/utils/bufferAnalysis.js";
import { selectPointsWithinRegion } from "../src/utils/regionAnalysis.js";

const center = point([104.066, 30.572], { 灾害体编号: "CENTER-001" });

test("生成有效的1公里灾害点缓冲区", () => {
  const result = createDisasterBuffer(center, 1);
  assert.equal(result.geometry.type, "Polygon");
  const area = calculateBufferAreaSquareKilometers(result);
  assert.ok(area > 3 && area < 3.3);
});

test("缓冲区包含近距离点并排除远距离点", () => {
  const result = createDisasterBuffer(center, 1);
  const nearPoint = point([104.071, 30.572], { id: "near" });
  const farPoint = point([104.2, 30.7], { id: "far" });
  const selected = selectPointsWithinRegion([nearPoint, farPoint], result);
  assert.deepEqual(selected.map((item) => item.properties.id), ["near"]);
});

test("拒绝零值、负数和超大缓冲半径", () => {
  assert.throws(() => normalizeBufferRadius(0), RangeError);
  assert.throws(() => normalizeBufferRadius(-1), RangeError);
  assert.throws(() => normalizeBufferRadius(51), RangeError);
});

test("拒绝非点几何执行缓冲分析", () => {
  assert.throws(
    () => createDisasterBuffer({ type: "Feature", geometry: { type: "LineString" } }, 1),
    TypeError
  );
});

