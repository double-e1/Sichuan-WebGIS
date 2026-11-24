const NUMERIC_FIELDS = ["威胁人口", "威胁财产"];

export const DATA_QUALITY_LABELS = {
  EMPTY_GEOMETRY: "空几何",
  INVALID_COORDINATE: "经纬度无效或越界",
  MISSING_NAME: "灾害体名称缺失",
  MISSING_ID: "灾害体编号缺失",
  DUPLICATE_ID: "灾害体编号重复",
  INVALID_NUMBER: "数值字段非法",
  NEGATIVE_NUMBER: "威胁数值为负数",
  SURROUNDING_WHITESPACE: "字段包含首尾空格",
};

function normalizeText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function parseNumericValue(value) {
  if (typeof value === "number") return value;
  const text = normalizeText(value).replaceAll(",", "");
  if (!text) return Number.NaN;
  return Number(text);
}

function escapeCsvCell(value) {
  const text = String(value ?? "").replaceAll("\r", " ").replaceAll("\n", " ");
  return `"${text.replaceAll('"', '""')}"`;
}

function buildDuplicateIdSet(features) {
  const counts = new Map();
  for (const feature of features) {
    const id = normalizeText(feature?.properties?.["灾害体编号"]);
    if (id) counts.set(id, (counts.get(id) || 0) + 1);
  }
  return new Set([...counts].filter(([, count]) => count > 1).map(([id]) => id));
}

function inspectGeometry(feature) {
  const geometry = feature?.geometry;
  if (!geometry || geometry.type !== "Point") {
    return geometry ? "几何类型不是Point" : "geometry为空";
  }
  const coordinates = geometry.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return "点坐标为空";
  }
  return "";
}

function inspectCoordinate(feature) {
  const coordinates = feature?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return "";
  const longitude = Number(coordinates[0]);
  const latitude = Number(coordinates[1]);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return `坐标不是有效数字：${coordinates[0]}, ${coordinates[1]}`;
  }
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    return `坐标越界：${longitude}, ${latitude}`;
  }
  return "";
}

function inspectRecord(feature, index, duplicateIds) {
  const properties = feature?.properties || {};
  const id = normalizeText(properties["灾害体编号"]);
  const name = normalizeText(properties["灾害体名称"]);
  const issueDetails = [];

  const geometryProblem = inspectGeometry(feature);
  if (geometryProblem) {
    issueDetails.push({ code: "EMPTY_GEOMETRY", detail: geometryProblem });
  }

  const coordinateProblem = inspectCoordinate(feature);
  if (coordinateProblem) {
    issueDetails.push({ code: "INVALID_COORDINATE", detail: coordinateProblem });
  }

  if (!name) issueDetails.push({ code: "MISSING_NAME", detail: "灾害体名称为空" });
  if (!id) issueDetails.push({ code: "MISSING_ID", detail: "灾害体编号为空" });
  if (id && duplicateIds.has(id)) {
    issueDetails.push({ code: "DUPLICATE_ID", detail: `重复编号：${id}` });
  }

  const invalidNumericFields = [];
  const negativeNumericFields = [];
  for (const field of NUMERIC_FIELDS) {
    const numericValue = parseNumericValue(properties[field]);
    if (!Number.isFinite(numericValue)) invalidNumericFields.push(field);
    else if (numericValue < 0) negativeNumericFields.push(field);
  }
  if (invalidNumericFields.length) {
    issueDetails.push({
      code: "INVALID_NUMBER",
      detail: `非法数值字段：${invalidNumericFields.join("、")}`,
    });
  }
  if (negativeNumericFields.length) {
    issueDetails.push({
      code: "NEGATIVE_NUMBER",
      detail: `负数值字段：${negativeNumericFields.join("、")}`,
    });
  }

  const whitespaceFields = Object.entries(properties)
    .filter(([, value]) => typeof value === "string" && value !== value.trim())
    .map(([field]) => field);
  if (whitespaceFields.length) {
    issueDetails.push({
      code: "SURROUNDING_WHITESPACE",
      detail: `含首尾空格字段：${whitespaceFields.join("、")}`,
    });
  }

  if (!issueDetails.length) return null;
  const coordinates = feature?.geometry?.coordinates || [];
  return {
    recordNumber: index + 1,
    id,
    name,
    city: normalizeText(properties["市"]),
    county: normalizeText(properties["县"]),
    longitude: coordinates[0] ?? "",
    latitude: coordinates[1] ?? "",
    codes: issueDetails.map((item) => item.code),
    labels: issueDetails.map((item) => DATA_QUALITY_LABELS[item.code]),
    details: issueDetails.map((item) => item.detail),
  };
}

export function analyzeGeoJsonQuality(geoJson) {
  const features = Array.isArray(geoJson?.features) ? geoJson.features : [];
  const duplicateIds = buildDuplicateIdSet(features);
  const counts = Object.fromEntries(Object.keys(DATA_QUALITY_LABELS).map((code) => [code, 0]));
  const issues = [];

  features.forEach((feature, index) => {
    const issue = inspectRecord(feature, index, duplicateIds);
    if (!issue) return;
    issues.push(issue);
    for (const code of issue.codes) counts[code] += 1;
  });

  return {
    totalRecords: features.length,
    cleanRecords: features.length - issues.length,
    problemRecords: issues.length,
    duplicateIdGroups: duplicateIds.size,
    counts,
    issues,
  };
}

export function qualityIssuesToCsv(issues) {
  const headers = [
    "记录序号",
    "灾害体编号",
    "灾害体名称",
    "市",
    "县",
    "经度",
    "纬度",
    "问题类型",
    "问题详情",
  ];
  const rows = [headers.map(escapeCsvCell).join(",")];

  for (const issue of issues || []) {
    rows.push(
      [
        issue.recordNumber,
        issue.id,
        issue.name,
        issue.city,
        issue.county,
        issue.longitude,
        issue.latitude,
        issue.labels.join("；"),
        issue.details.join("；"),
      ]
        .map(escapeCsvCell)
        .join(",")
    );
  }
  return rows.join("\r\n");
}

