function normalizeText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

export function collectFilterOptions(features, propertyName) {
  const values = new Set();

  for (const feature of features || []) {
    const properties = feature?.properties || feature || {};
    const value = normalizeText(properties[propertyName]);
    if (value) values.add(value);
  }

  return [...values].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

export function matchesDisasterFilters(properties, filters = {}) {
  const city = normalizeText(filters.city);
  const type = normalizeText(filters.type);
  const intensity = normalizeText(filters.intensity);

  return (
    (!city || normalizeText(properties?.["市"]) === city) &&
    (!type || normalizeText(properties?.["灾害体类型"]) === type) &&
    (!intensity || normalizeText(properties?.["地震烈度"]) === intensity)
  );
}

export function filterDisasterRecords(features, filters = {}) {
  return (features || []).filter((feature) =>
    matchesDisasterFilters(feature?.properties || feature || {}, filters)
  );
}

