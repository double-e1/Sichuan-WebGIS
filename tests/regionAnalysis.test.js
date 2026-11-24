import test from "node:test";
import assert from "node:assert/strict";
import { point, polygon } from "@turf/turf";

import {
  regionFeaturesToCsv,
  selectPointsWithinRegion,
  summarizeRegionFeatures,
} from "../src/utils/regionAnalysis.js";

const area = polygon([[
  [100, 30],
  [102, 30],
  [102, 32],
  [100, 32],
  [100, 30],
]]);

const records = [
  point([101, 31], {
    灾害体编号: "A-001",
    灾害体名称: "测试滑坡",
    灾害体类型: "滑坡",
    地震烈度: "Ⅷ",
    威胁人口: 12,
    威胁财产: "3.5",
  }),
  point([101.5, 31.5], {
    灾害体编号: "A-002",
    灾害体名称: "测试泥石流",
    灾害体类型: "泥石流",
    地震烈度: "Ⅺ",
    威胁人口: "8",
    威胁财产: null,
  }),
  point([105, 35], {
    灾害体编号: "A-003",
    灾害体类型: "崩塌",
    地震烈度: "Ⅸ",
    威胁人口: 100,
  }),
];

test("仅返回多边形内部的灾害点", () => {
  const selected = selectPointsWithinRegion(records, area);
  assert.equal(selected.length, 2);
  assert.deepEqual(selected.map((item) => item.properties.灾害体编号), ["A-001", "A-002"]);
});

test("位于多边形边界上的灾害点计入统计", () => {
  const boundaryPoint = point([100, 31], { 灾害体编号: "EDGE-001" });
  const selected = selectPointsWithinRegion([boundaryPoint], area);
  assert.equal(selected.length, 1);
});

test("正确汇总类型、烈度、人口、财产和高风险点", () => {
  const selected = selectPointsWithinRegion(records, area);
  const summary = summarizeRegionFeatures(selected);
  assert.equal(summary.total, 2);
  assert.deepEqual(summary.typeCounts, { 滑坡: 1, 泥石流: 1 });
  assert.deepEqual(summary.intensityCounts, { Ⅷ: 1, Ⅺ: 1 });
  assert.equal(summary.threatPopulation, 20);
  assert.equal(summary.threatProperty, 3.5);
  assert.equal(summary.highRiskCount, 2);
});

test("空结果返回零值统计", () => {
  const summary = summarizeRegionFeatures([]);
  assert.equal(summary.total, 0);
  assert.equal(summary.threatPopulation, 0);
  assert.equal(summary.threatProperty, 0);
  assert.equal(summary.highRiskCount, 0);
});

test("CSV正确转义逗号和双引号", () => {
  const csv = regionFeaturesToCsv([
    point([101, 31], { 灾害体名称: '滑坡,"一号"' }),
  ]);
  assert.match(csv, /"滑坡,""一号"""/);
});

