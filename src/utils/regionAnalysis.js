import { featureCollection, pointsWithinPolygon } from "@turf/turf";

const HIGH_RISK_INTENSITIES = new Set(["Ⅷ", "Ⅸ", "Ⅹ", "VIII", "IX", "X"]);

function toFiniteNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number.parseFloat(String(value ?? "").replaceAll(",", "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeLabel(value, fallback = "未标注") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function countByProperty(features, propertyName) {
  const counts = {};
  for (const feature of features) {
    const label = normalizeLabel(feature?.properties?.[propertyName]);
    counts[label] = (counts[label] || 0) + 1;
  }
  return counts;
}

export function selectPointsWithinRegion(features, polygon) {
  if (!polygon || polygon.geometry?.type !== "Polygon") {
    throw new TypeError("区域分析需要有效的Polygon几何");
  }

  const pointFeatures = (features || []).filter(
    (feature) => feature?.geometry?.type === "Point"
  );
  return pointsWithinPolygon(featureCollection(pointFeatures), polygon).features;
}

export function summarizeRegionFeatures(features) {
  const safeFeatures = features || [];
  return {
    total: safeFeatures.length,
    typeCounts: countByProperty(safeFeatures, "灾害体类型"),
    intensityCounts: countByProperty(safeFeatures, "地震烈度"),
    threatPopulation: safeFeatures.reduce(
      (sum, feature) => sum + toFiniteNumber(feature?.properties?.["威胁人口"]),
      0
    ),
    threatProperty: safeFeatures.reduce(
      (sum, feature) => sum + toFiniteNumber(feature?.properties?.["威胁财产"]),
      0
    ),
    highRiskCount: safeFeatures.filter((feature) =>
      HIGH_RISK_INTENSITIES.has(normalizeLabel(feature?.properties?.["地震烈度"], ""))
    ).length,
  };
}

function escapeCsvCell(value) {
  const text = String(value ?? "").replaceAll("\r", " ").replaceAll("\n", " ");
  return `"${text.replaceAll('"', '""')}"`;
}

export function regionFeaturesToCsv(features) {
  const columns = [
    ["灾害体编号", "灾害体编号"],
    ["灾害体名称", "灾害体名称"],
    ["灾害体类型", "灾害体类型"],
    ["市", "市"],
    ["县", "县"],
    ["地理位置", "地理位置"],
    ["经度", "经度"],
    ["纬度", "纬度"],
    ["地震烈度", "地震烈度"],
    ["险情等级", "险情等级"],
    ["威胁人口", "威胁人口"],
    ["威胁财产", "威胁财产"],
    ["防治建议", "防治建议"],
  ];

  const rows = [columns.map(([header]) => escapeCsvCell(header)).join(",")];
  for (const feature of features || []) {
    const properties = feature?.properties || {};
    rows.push(
      columns
        .map(([, propertyName]) => escapeCsvCell(properties[propertyName]))
        .join(",")
    );
  }
  return rows.join("\r\n");
}

