import test from "node:test";
import assert from "node:assert/strict";

import {
  collectFilterOptions,
  filterDisasterRecords,
  matchesDisasterFilters,
} from "../src/utils/filterDisasters.js";

const records = [
  { properties: { 市: "成都市", 灾害体类型: "滑坡", 地震烈度: "Ⅶ" } },
  { properties: { 市: "雅安市", 灾害体类型: "泥石流", 地震烈度: "Ⅷ" } },
  { properties: { 市: " 成都市 ", 灾害体类型: "崩塌", 地震烈度: "Ⅷ" } },
  { properties: { 市: "", 灾害体类型: null, 地震烈度: undefined } },
];

test("未选择条件时保留全部记录", () => {
  assert.equal(filterDisasterRecords(records).length, records.length);
});

test("支持城市、类型和烈度组合筛选", () => {
  assert.equal(
    filterDisasterRecords(records, {
      city: "雅安市",
      type: "泥石流",
      intensity: "Ⅷ",
    }).length,
    1
  );
});

test("筛选时忽略数据字段两端的空格", () => {
  assert.equal(filterDisasterRecords(records, { city: "成都市" }).length, 2);
});

test("空值和缺失字段不会造成筛选异常", () => {
  assert.equal(matchesDisasterFilters({}, { city: "成都市" }), false);
  assert.deepEqual(collectFilterOptions(records, "灾害体类型"), ["崩塌", "滑坡", "泥石流"]);
});

