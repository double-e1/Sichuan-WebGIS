import { area, buffer } from "@turf/turf";

export const MIN_BUFFER_RADIUS_KM = 0.1;
export const MAX_BUFFER_RADIUS_KM = 50;

export function normalizeBufferRadius(radiusKm) {
  const radius = Number(radiusKm);
  if (!Number.isFinite(radius)) {
    throw new TypeError("缓冲半径必须是有效数字");
  }
  if (radius < MIN_BUFFER_RADIUS_KM || radius > MAX_BUFFER_RADIUS_KM) {
    throw new RangeError(
      `缓冲半径必须在${MIN_BUFFER_RADIUS_KM}至${MAX_BUFFER_RADIUS_KM}公里之间`
    );
  }
  return radius;
}

export function createDisasterBuffer(pointFeature, radiusKm) {
  if (!pointFeature || pointFeature.geometry?.type !== "Point") {
    throw new TypeError("缓冲分析需要有效的Point灾害点");
  }
  const radius = normalizeBufferRadius(radiusKm);
  const polygon = buffer(pointFeature, radius, {
    units: "kilometers",
    steps: 64,
  });
  if (!polygon) throw new Error("无法生成缓冲区");
  return polygon;
}

export function calculateBufferAreaSquareKilometers(bufferFeature) {
  if (!bufferFeature) return 0;
  return area(bufferFeature) / 1_000_000;
}

