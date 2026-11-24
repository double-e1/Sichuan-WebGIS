import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeGeoJsonQuality,
  qualityIssuesToCsv,
} from "../src/utils/dataQuality.js";

function feature(coordinates, properties = {}) {
  return {
    type: "Feature",
    geometry: coordinates === null ? null : { type: "Point", coordinates },
    properties: {
      灾害体编号: "ID-001",
      灾害体名称: "测试灾害点",
      威胁人口: 10,
      威胁财产: 20,
      ...properties,
    },
  };
}

test("完整有效记录不产生质量问题", () => {
  const result = analyzeGeoJsonQuality({ features: [feature([104, 30])] });
  assert.equal(result.cleanRecords, 1);
  assert.equal(result.problemRecords, 0);
});

test("识别空几何和越界经纬度", () => {
  const result = analyzeGeoJsonQuality({
    features: [feature(null), feature([181, 95], { 灾害体编号: "ID-002" })],
  });
  assert.equal(result.counts.EMPTY_GEOMETRY, 1);
  assert.equal(result.counts.INVALID_COORDINATE, 1);
});

test("识别名称编号缺失和重复编号", () => {
  const result = analyzeGeoJsonQuality({
    features: [
      feature([104, 30], { 灾害体编号: "DUP", 灾害体名称: "" }),
      feature([105, 31], { 灾害体编号: "DUP" }),
      feature([106, 32], { 灾害体编号: " " }),
    ],
  });
  assert.equal(result.counts.MISSING_NAME, 1);
  assert.equal(result.counts.MISSING_ID, 1);
  assert.equal(result.counts.DUPLICATE_ID, 2);
  assert.equal(result.duplicateIdGroups, 1);
});

test("识别非法数值和负数", () => {
  const result = analyzeGeoJsonQuality({
    features: [
      feature([104, 30], { 威胁人口: "未知", 威胁财产: -1 }),
    ],
  });
  assert.equal(result.counts.INVALID_NUMBER, 1);
  assert.equal(result.counts.NEGATIVE_NUMBER, 1);
});

test("识别字符串字段首尾空格", () => {
  const result = analyzeGeoJsonQuality({
    features: [feature([104, 30], { 灾害体名称: " 测试灾害点 " })],
  });
  assert.equal(result.counts.SURROUNDING_WHITESPACE, 1);
});

test("质量问题CSV正确转义特殊字符", () => {
  const result = analyzeGeoJsonQuality({
    features: [feature([104, 30], { 灾害体名称: '异常,"点" ' })],
  });
  const csv = qualityIssuesToCsv(result.issues);
  assert.match(csv, /"异常,""点"""/);
});

