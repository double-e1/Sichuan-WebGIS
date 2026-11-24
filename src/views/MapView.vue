<template>
  <div class="dashboard-container">
    <div class="header">
      <img class="logo" src="/src/assets/logo.png" alt="logo" />
      <h1 class="title">四川省地质灾害数据管理平台</h1>
    </div>

    <!-- 显示日期 -->
    <div class="date">
      <Clock />
    </div>

    <!-- 天气按钮 -->
    <div class="weather-button" @click="toggleWeather">
      <i class="iconfont icon-duoyun"></i>
    </div>

    <!-- 天气信息部分 -->
    <div class="weather" v-if="showWeather">
      <div class="weather-details">
        <div class="city">
          <div>{{ weatherInfo.city }}</div>
          <span>{{ weatherInfo.weather }}</span>
        </div>

        <div class="info">
          <span
            ><i class="iconfont icon-wendu"></i
            >{{ weatherInfo.temperature }}℃</span
          >
          <span
            ><i class="iconfont icon-fengxiang"></i
            >{{ weatherInfo.winddirection }}</span
          >
          <span
            ><i class="iconfont icon-shidu"></i
            >{{ weatherInfo.humidity }}%</span
          >
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <div class="left">
        <div class="chart panel">
          <div class="title">灾害体类型分布</div>
          <div class="chart-container">
            <LeftFirstChart />
          </div>
        </div>
        <div class="chart panel">
          <div class="title">威胁人口和威胁财产分布</div>
          <div class="chart-container">
            <LeftSecondChart />
          </div>
        </div>
      </div>
      <div class="map-container">
        <div class="map">
          <MapModule ref="mapModuleRef" />
        </div>
        <div class="toolbox">
          <div class="tool-item" @click="toggleToolMenu('layer')">
            <i class="iconfont icon-023tuceng"></i>
            <div class="text">图层管理</div>
            <div v-if="activeTool === 'layer'" class="tool-options">
              <!-- 图层显隐选项 -->
              <div
                v-for="layer in layers"
                :key="layer.get('title')"
                @click="toggleLayer(layer)"
                :class="{ activelayer: layer.getVisible() }"
              >
                {{ layer.get("title") }}
              </div>
            </div>
          </div>
          <div class="tool-item" @click="toggleToolMenu('draw')">
            <i class="iconfont icon-xihuabi"></i>
            <div class="text">画笔</div>
            <div v-if="activeTool === 'draw'" class="tool-options">
              <!-- 点、线、多边形等工具选项 -->
              <div @click="activateDrawTool('Point')">
                <i class="iconfont icon-mti-gong-juliceliang"></i>点画笔
              </div>
              <div @click="activateDrawTool('LineString')">
                <i class="iconfont icon-xian"></i>线画笔
              </div>
              <div @click="activateDrawTool('Polygon')">
                <i class="iconfont icon-duobianxing"></i>面画笔
              </div>
              <div @click="activateDrawTool('Square')">
                <i class="iconfont icon-mian"></i>矩形画笔
              </div>
              <div @click="activateDrawTool('Circle')">
                <i class="iconfont icon-radio-on"></i>圆画笔
              </div>
              <div @click="clearDraw">
                <i class="iconfont icon-qingkonghuabu"></i>清空画布
              </div>
            </div>
          </div>
          <div class="tool-item" @click="toggleToolMenu('measure')">
            <i class="iconfont icon-celiangleixing"></i>
            <div class="text">测量</div>
            <div v-if="activeTool === 'measure'" class="tool-options">
              <div @click="activateMeasureTool('LineString')">
                <i class="iconfont icon-mti-gong-juliceliang"></i>测量距离
              </div>
              <div @click="activateMeasureTool('Polygon')">
                <i class="iconfont icon-mti-gong-mianjiceliang"></i>测量面积
              </div>
            </div>
          </div>
          <div class="tool-item" @click="toggleToolMenu('analysis')">
            <i class="iconfont icon-relitu"></i>
            <div class="text" @click="performHeatmapAnalysis">热力图</div>
          </div>
          <div class="tool-item">
            <i class="iconfont icon-ico_dituxiazai"></i>
            <div class="text" @click="downloadMap(map)">下载地图</div>
          </div>
          <div class="tool-item">
            <i class="iconfont icon-ditu01"></i>
            <div class="text" @click="animateView">飞行地图</div>
          </div>
          <div class="tool-item" @click="toggleToolMenu('filter')">
            <span class="filter-tool-icon">筛</span>
            <div class="text">灾害筛选</div>
            <div
              v-if="activeTool === 'filter'"
              class="filter-tool-options"
              @click.stop
            >
              <h3>灾害点筛选</h3>
              <label>
                <span>城市</span>
                <select
                  :value="mapModuleRef?.filters?.city || ''"
                  @change="updateDisasterFilter('city', $event)"
                >
                  <option value="">全部城市</option>
                  <option
                    v-for="city in mapModuleRef?.cityOptions || []"
                    :key="city"
                    :value="city"
                  >
                    {{ city }}
                  </option>
                </select>
              </label>
              <label>
                <span>类型</span>
                <select
                  :value="mapModuleRef?.filters?.type || ''"
                  @change="updateDisasterFilter('type', $event)"
                >
                  <option value="">全部类型</option>
                  <option
                    v-for="type in mapModuleRef?.typeOptions || []"
                    :key="type"
                    :value="type"
                  >
                    {{ type }}
                  </option>
                </select>
              </label>
              <label>
                <span>烈度</span>
                <select
                  :value="mapModuleRef?.filters?.intensity || ''"
                  @change="updateDisasterFilter('intensity', $event)"
                >
                  <option value="">全部烈度</option>
                  <option
                    v-for="intensity in mapModuleRef?.intensityOptions || []"
                    :key="intensity"
                    :value="intensity"
                  >
                    {{ intensity }}
                  </option>
                </select>
              </label>
              <div class="filter-tool-summary">
                <span>
                  当前
                  {{ (mapModuleRef?.filteredDisasterCount || 0).toLocaleString() }}
                  个
                </span>
                <button type="button" @click="resetDisasterFilters">重置</button>
              </div>
            </div>
          </div>
          <div class="tool-item" @click="toggleToolMenu('region')">
            <span class="region-tool-icon">统</span>
            <div class="text">区域统计</div>
            <div
              v-if="activeTool === 'region'"
              class="region-analysis-panel"
              @click.stop
            >
              <h3>框选区域灾害统计</h3>
              <p class="region-status">{{ regionAnalysisStatus }}</p>
              <div class="region-actions">
                <button type="button" @click="startRegionAnalysis">开始框选</button>
                <button type="button" class="secondary" @click="clearRegionAnalysis">
                  清除
                </button>
                <button
                  type="button"
                  class="secondary"
                  :disabled="regionAnalysisFeatures.length === 0"
                  @click="exportRegionAnalysis"
                >
                  导出CSV
                </button>
              </div>

              <template v-if="regionSummary">
                <div class="region-metrics">
                  <div><strong>{{ regionSummary.total.toLocaleString() }}</strong><span>灾害点</span></div>
                  <div><strong>{{ regionSummary.highRiskCount.toLocaleString() }}</strong><span>高风险点</span></div>
                  <div><strong>{{ regionSummary.threatPopulation.toLocaleString() }}</strong><span>威胁人口</span></div>
                  <div><strong>{{ regionSummary.threatProperty.toLocaleString() }}</strong><span>威胁财产</span></div>
                </div>

                <div class="region-counts">
                  <h4>灾害类型</h4>
                  <div v-if="Object.keys(regionSummary.typeCounts).length" class="count-list">
                    <span v-for="(count, label) in regionSummary.typeCounts" :key="label">
                      {{ label }} {{ count }}
                    </span>
                  </div>
                  <p v-else>框选范围内没有灾害点</p>

                  <h4>地震烈度</h4>
                  <div v-if="Object.keys(regionSummary.intensityCounts).length" class="count-list">
                    <span
                      v-for="(count, label) in regionSummary.intensityCounts"
                      :key="label"
                    >
                      {{ label }} {{ count }}
                    </span>
                  </div>
                </div>
                <p class="region-note">
                  高风险点按地震烈度Ⅷ及以上统计；威胁财产沿用原始数据单位。
                </p>
              </template>
            </div>
          </div>
          <div class="tool-item" @click="toggleToolMenu('buffer')">
            <span class="buffer-tool-icon">缓</span>
            <div class="text">缓冲分析</div>
            <div
              v-if="activeTool === 'buffer'"
              class="buffer-analysis-panel"
              @click.stop
            >
              <h3>灾害点缓冲区分析</h3>
              <p class="buffer-status">{{ bufferAnalysisStatus }}</p>

              <div class="buffer-form">
                <button type="button" @click="beginBufferPointSelection">
                  选择灾害点
                </button>
                <span class="selected-point-name">
                  {{ bufferSelectedName || "尚未选择" }}
                </span>
                <label>
                  <span>半径</span>
                  <input
                    v-model.number="bufferRadiusKm"
                    type="number"
                    min="0.1"
                    max="50"
                    step="0.1"
                  />
                  <span>公里</span>
                </label>
              </div>

              <div class="buffer-actions">
                <button
                  type="button"
                  :disabled="!bufferSelectedPoint"
                  @click="runBufferAnalysis"
                >
                  执行分析
                </button>
                <button type="button" class="secondary" @click="clearBufferAnalysis">
                  清除
                </button>
                <button
                  type="button"
                  class="secondary"
                  :disabled="bufferAnalysisFeatures.length === 0"
                  @click="exportBufferAnalysis"
                >
                  导出CSV
                </button>
              </div>

              <template v-if="bufferSummary">
                <div class="buffer-metrics">
                  <div><strong>{{ bufferSummary.total.toLocaleString() }}</strong><span>范围内灾害点</span></div>
                  <div><strong>{{ bufferSummary.highRiskCount.toLocaleString() }}</strong><span>高风险点</span></div>
                  <div><strong>{{ bufferSummary.threatPopulation.toLocaleString() }}</strong><span>威胁人口</span></div>
                  <div><strong>{{ bufferAreaKm2.toFixed(2) }}</strong><span>面积 平方公里</span></div>
                </div>
                <div class="buffer-counts">
                  <h4>灾害类型</h4>
                  <div v-if="Object.keys(bufferSummary.typeCounts).length" class="count-list">
                    <span v-for="(count, label) in bufferSummary.typeCounts" :key="label">
                      {{ label }} {{ count }}
                    </span>
                  </div>
                  <p v-else>缓冲区内没有灾害点</p>
                </div>
                <p class="buffer-note">
                  统计包含中心灾害点，并与当前属性筛选条件联动。
                </p>
              </template>
            </div>
          </div>
          <div class="tool-item" @click="toggleToolMenu('quality')">
            <span class="quality-tool-icon">检</span>
            <div class="text">质量检查</div>
            <div
              v-if="activeTool === 'quality'"
              class="quality-analysis-panel"
              @click.stop
            >
              <h3>空间数据质量检查</h3>
              <p class="quality-status">{{ dataQualityStatus }}</p>
              <div class="quality-actions">
                <button type="button" @click="runDataQualityCheck">开始检查</button>
                <button
                  type="button"
                  class="secondary"
                  :disabled="!dataQualityResult?.issues?.length"
                  @click="exportDataQualityIssues"
                >
                  导出问题清单
                </button>
              </div>

              <template v-if="dataQualityResult">
                <div class="quality-metrics">
                  <div><strong>{{ dataQualityResult.totalRecords.toLocaleString() }}</strong><span>总记录</span></div>
                  <div><strong>{{ dataQualityResult.problemRecords.toLocaleString() }}</strong><span>问题记录</span></div>
                  <div><strong>{{ dataQualityResult.cleanRecords.toLocaleString() }}</strong><span>无问题记录</span></div>
                  <div><strong>{{ dataQualityResult.duplicateIdGroups.toLocaleString() }}</strong><span>重复编号组</span></div>
                </div>

                <div class="quality-counts">
                  <h4>检查结果</h4>
                  <div class="quality-count-list">
                    <span v-for="(count, code) in dataQualityResult.counts" :key="code">
                      {{ DATA_QUALITY_LABELS[code] }}：{{ count.toLocaleString() }}
                    </span>
                  </div>
                </div>

                <div v-if="dataQualityResult.issues.length" class="quality-preview">
                  <h4>问题记录示例</h4>
                  <div
                    v-for="issue in dataQualityResult.issues.slice(0, 5)"
                    :key="issue.recordNumber"
                    class="quality-preview-item"
                  >
                    <strong>{{ issue.id || `第${issue.recordNumber}条` }}</strong>
                    <span>{{ issue.labels.join("、") }}</span>
                  </div>
                </div>
                <p class="quality-note">
                  质量检查只报告问题，不会自动修改原始GeoJSON数据。
                </p>
              </template>
            </div>
          </div>
        </div>
      </div>
      <div class="right">
        <div class="layer-control panel">
          <div class="title">市级灾害点占比</div>
          <CityPie />
        </div>
        <div class="second">
          <div class="chart panel">
            <div class="chart-container">
              <WordCloud />
            </div>
          </div>
          <div class="chart panel">
            <div class="title">灾害点威胁等级分布</div>
            <div class="chart-container">
              <IntensityBar />
            </div>
          </div>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted, inject } from "vue";
import MapModule from "@/components/MapModule.vue";
import CityPie from "./charts/CityPie.vue";
import LeftFirstChart from "./charts/LeftFirstChart.vue";
import LeftSecondChart from "./charts/LeftSecondChart.vue";
import WordCloud from "./charts/WordCloud.vue";
import IntensityBar from "./charts/IntensityBar.vue";
import { downloadMap } from "@/utils/downloadMap.js";
import {
  updateCurrentTime,
  updateCurrentDate,
  fetchLocation,
  fetchWeather,
} from "@/utils/timeWeatherUtils.js";
import { createDraw } from "@/utils/createDraw";
import disasterData from "@/assets/SCdiaster.json";
import { filterDisasterRecords } from "@/utils/filterDisasters";
import {
  regionFeaturesToCsv,
  selectPointsWithinRegion,
  summarizeRegionFeatures,
} from "@/utils/regionAnalysis";
import {
  calculateBufferAreaSquareKilometers,
  createDisasterBuffer,
  normalizeBufferRadius,
} from "@/utils/bufferAnalysis";
import {
  analyzeGeoJsonQuality,
  DATA_QUALITY_LABELS,
  qualityIssuesToCsv,
} from "@/utils/dataQuality";
import * as turf from "@turf/turf";
import Clock from "@/components/Clock.vue";

const currentTime = ref("");
const currentDate = ref("");
const weatherInfo = ref("");
const activeTool = ref("");
const mapModuleRef = ref(null);
const layers = ref([]);
let drawSources = {};
let map;
let drawInteraction = null;
let measureInteraction = null;
let regionAnalysisInteraction = null;
let bufferSelectHandler = null;
let measureSource = new ol.source.Vector();
let measureLayer = new ol.layer.Vector({
  source: measureSource,
  title: "测量工具图层",
});
const regionAnalysisSource = new ol.source.Vector();
const regionAnalysisLayer = new ol.layer.Vector({
  source: regionAnalysisSource,
  title: "区域统计范围",
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: "rgba(49, 197, 244, 0.16)" }),
    stroke: new ol.style.Stroke({ color: "#31c5f4", width: 2 }),
  }),
});
const regionAnalysisStatus = ref("点击“开始框选”，在地图上绘制分析范围。");
const regionSummary = ref(null);
const regionAnalysisFeatures = ref([]);
const bufferSource = new ol.source.Vector();
const bufferLayer = new ol.layer.Vector({
  source: bufferSource,
  title: "灾害点缓冲区",
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: "rgba(255, 153, 0, 0.2)" }),
    stroke: new ol.style.Stroke({ color: "#ff9900", width: 2 }),
  }),
});
const bufferRadiusKm = ref(1);
const bufferSelectedPoint = ref(null);
const bufferSelectedName = ref("");
const bufferAnalysisStatus = ref("先选择单个灾害点，再设置缓冲半径。");
const bufferSummary = ref(null);
const bufferAreaKm2 = ref(0);
const bufferAnalysisFeatures = ref([]);
const dataQualityStatus = ref("点击“开始检查”扫描完整GeoJSON数据。");
const dataQualityResult = shallowRef(null);
const animateView = () => {
  const view = map.getView();
  view.cancelAnimations(); // 取消当前正在进行的所有动画,否则会导致点了也没法动
  view.animate({
    center: [102.7, 30.6],
    zoom: 6,
    duration: 500,
  });
};

// 画笔工具激活函数
const activateDrawTool = (type) => {
  if (drawInteraction) map.removeInteraction(drawInteraction);

  drawInteraction = createDraw({ type, source: drawSources[type] });
  map.addInteraction(drawInteraction);
  drawInteraction.on("drawend", () => {
    map.removeInteraction(drawInteraction);
  });
};

// 清空画布
const clearDraw = () => {
  for (const key in drawSources) {
    drawSources[key].clear();
  }
};

// 激活测量工具函数
const activateMeasureTool = (type) => {
  if (measureInteraction) {
    map.removeInteraction(measureInteraction);
    measureInteraction = null;
  }

  measureInteraction = createDraw({ type, source: measureSource });
  map.addInteraction(measureInteraction);

  measureInteraction.on("drawend", (event) => {
    const geometry = event.feature.getGeometry();
    let coordinates = geometry.getCoordinates();

    if (type === "LineString") {
      calculateDistance(coordinates);
    } else if (type === "Polygon") {
      const exteriorRing = coordinates[0]; // 取外环坐标
      calculateArea(exteriorRing);
    }

    map.removeInteraction(measureInteraction);
    measureInteraction = null;
  });
};

// 计算距离
const calculateDistance = (coordinates) => {
  const line = turf.lineString(coordinates);
  const length = turf.length(line, { units: "kilometers" });
  alert(`测量的距离是: ${length.toFixed(2)} 公里`);
};

// 计算面积和周长
const calculateArea = (coordinates) => {
  const polygon = turf.polygon([coordinates]);
  const area = turf.area(polygon);

  const perimeterLine = turf.lineString(coordinates);
  const perimeter = turf.length(perimeterLine, { units: "kilometers" });

  alert(
    `测量的面积是: ${area.toFixed(2)} 平方米, 周长是: ${perimeter.toFixed(
      2
    )} 公里`
  );
};

function startRegionAnalysis() {
  if (!map) return;

  if (regionAnalysisInteraction) {
    map.removeInteraction(regionAnalysisInteraction);
  }
  if (drawInteraction) map.removeInteraction(drawInteraction);
  if (measureInteraction) map.removeInteraction(measureInteraction);

  regionAnalysisSource.clear();
  regionSummary.value = null;
  regionAnalysisFeatures.value = [];
  regionAnalysisStatus.value = "请在地图上依次点击绘制多边形，双击结束。";

  regionAnalysisInteraction = createDraw({
    type: "Polygon",
    source: regionAnalysisSource,
  });
  map.addInteraction(regionAnalysisInteraction);

  regionAnalysisInteraction.once("drawend", (event) => {
    try {
      const analysisGeometry = event.feature.getGeometry().clone();
      const mapProjection = map.getView().getProjection();
      if (mapProjection.getCode() !== "EPSG:4326") {
        analysisGeometry.transform(mapProjection, "EPSG:4326");
      }
      const polygonFeature = turf.polygon(analysisGeometry.getCoordinates());
      const currentFilters = mapModuleRef.value?.filters || {};
      const candidateFeatures = filterDisasterRecords(
        disasterData.features,
        currentFilters
      );
      const selectedFeatures = selectPointsWithinRegion(
        candidateFeatures,
        polygonFeature
      );

      regionAnalysisFeatures.value = selectedFeatures;
      regionSummary.value = summarizeRegionFeatures(selectedFeatures);
      regionAnalysisStatus.value = selectedFeatures.length
        ? `统计完成：基于当前筛选条件找到 ${selectedFeatures.length.toLocaleString()} 个灾害点。`
        : "统计完成：当前筛选条件下，框选区域内没有灾害点。";
    } catch (error) {
      console.error("区域统计失败", error);
      regionAnalysisStatus.value = "统计失败，请清除后重新绘制有效的多边形。";
    } finally {
      map.removeInteraction(regionAnalysisInteraction);
      regionAnalysisInteraction = null;
    }
  });
}

function clearRegionAnalysis() {
  if (regionAnalysisInteraction && map) {
    map.removeInteraction(regionAnalysisInteraction);
    regionAnalysisInteraction = null;
  }
  regionAnalysisSource.clear();
  regionSummary.value = null;
  regionAnalysisFeatures.value = [];
  regionAnalysisStatus.value = "点击“开始框选”，在地图上绘制分析范围。";
}

function exportRegionAnalysis() {
  if (!regionAnalysisFeatures.value.length) return;

  const csv = `\uFEFF${regionFeaturesToCsv(regionAnalysisFeatures.value)}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  link.href = url;
  link.download = `区域灾害统计_${date}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  regionAnalysisStatus.value = "CSV已导出，内容为本次框选得到的灾害点明细。";
}

function stopBufferPointSelection() {
  if (bufferSelectHandler && map) {
    map.un("singleclick", bufferSelectHandler);
    bufferSelectHandler = null;
  }
}

function beginBufferPointSelection() {
  if (!map) return;
  stopBufferPointSelection();
  if (drawInteraction) map.removeInteraction(drawInteraction);
  if (measureInteraction) map.removeInteraction(measureInteraction);
  if (regionAnalysisInteraction) map.removeInteraction(regionAnalysisInteraction);

  bufferAnalysisStatus.value = "请在地图上点击一个单独显示的灾害点。";
  bufferSelectHandler = (event) => {
    let clusterFeature = null;
    map.forEachFeatureAtPixel(event.pixel, (feature) => {
      if (!clusterFeature && Array.isArray(feature.get?.("features"))) {
        clusterFeature = feature;
      }
    });

    if (!clusterFeature) {
      bufferAnalysisStatus.value = "没有选中灾害点，请点击带有灾害标记的位置。";
      return;
    }

    const clusteredFeatures = clusterFeature.get("features") || [];
    if (clusteredFeatures.length !== 1) {
      bufferAnalysisStatus.value = `当前位置聚合了${clusteredFeatures.length}个灾害点，请放大后选择单个点。`;
      return;
    }

    const selectedFeature = clusteredFeatures[0];
    const properties = { ...selectedFeature.getProperties() };
    delete properties.geometry;
    bufferSelectedPoint.value = turf.point(
      selectedFeature.getGeometry().getCoordinates(),
      properties
    );
    bufferSelectedName.value =
      properties["灾害体名称"] || properties["灾害体编号"] || "未命名灾害点";
    bufferAnalysisStatus.value = `已选择：${bufferSelectedName.value}。请设置半径并执行分析。`;
    stopBufferPointSelection();
  };
  map.on("singleclick", bufferSelectHandler);
}

function runBufferAnalysis() {
  if (!bufferSelectedPoint.value || !map) {
    bufferAnalysisStatus.value = "请先从地图上选择一个灾害点。";
    return;
  }

  try {
    const radius = normalizeBufferRadius(bufferRadiusKm.value);
    const bufferPolygon = createDisasterBuffer(bufferSelectedPoint.value, radius);
    const currentFilters = mapModuleRef.value?.filters || {};
    const candidateFeatures = filterDisasterRecords(
      disasterData.features,
      currentFilters
    );
    const selectedFeatures = selectPointsWithinRegion(
      candidateFeatures,
      bufferPolygon
    );

    bufferSource.clear();
    const mapBufferFeature = new ol.format.GeoJSON().readFeature(bufferPolygon, {
      dataProjection: "EPSG:4326",
      featureProjection: map.getView().getProjection(),
    });
    bufferSource.addFeature(mapBufferFeature);
    map.getView().fit(mapBufferFeature.getGeometry().getExtent(), {
      padding: [90, 90, 90, 90],
      duration: 450,
      maxZoom: 13,
    });

    bufferAnalysisFeatures.value = selectedFeatures;
    bufferSummary.value = summarizeRegionFeatures(selectedFeatures);
    bufferAreaKm2.value = calculateBufferAreaSquareKilometers(bufferPolygon);
    bufferAnalysisStatus.value = `分析完成：${radius}公里缓冲区内共有${selectedFeatures.length.toLocaleString()}个灾害点。`;
  } catch (error) {
    console.error("缓冲区分析失败", error);
    bufferAnalysisStatus.value = error.message || "缓冲区分析失败，请检查半径。";
  }
}

function clearBufferAnalysis() {
  stopBufferPointSelection();
  bufferSource.clear();
  bufferSelectedPoint.value = null;
  bufferSelectedName.value = "";
  bufferSummary.value = null;
  bufferAreaKm2.value = 0;
  bufferAnalysisFeatures.value = [];
  bufferAnalysisStatus.value = "先选择单个灾害点，再设置缓冲半径。";
}

function exportBufferAnalysis() {
  if (!bufferAnalysisFeatures.value.length) return;
  const csv = `\uFEFF${regionFeaturesToCsv(bufferAnalysisFeatures.value)}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  link.href = url;
  link.download = `缓冲区灾害统计_${date}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  bufferAnalysisStatus.value = "CSV已导出，内容为缓冲区内灾害点明细。";
}

async function runDataQualityCheck() {
  dataQualityStatus.value = "正在检查26,539条空间数据，请稍候……";
  await new Promise((resolve) => setTimeout(resolve, 0));
  const startTime = performance.now();
  const result = analyzeGeoJsonQuality(disasterData);
  const elapsed = performance.now() - startTime;
  dataQualityResult.value = result;
  dataQualityStatus.value = `检查完成：发现${result.problemRecords.toLocaleString()}条问题记录，用时${elapsed.toFixed(0)}毫秒。`;
}

function exportDataQualityIssues() {
  const issues = dataQualityResult.value?.issues || [];
  if (!issues.length) return;
  const csv = `\uFEFF${qualityIssuesToCsv(issues)}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  link.href = url;
  link.download = `空间数据质量问题清单_${date}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  dataQualityStatus.value = "问题清单已导出，原始GeoJSON数据未被修改。";
}

const showWeather = ref(false); // 新增状态控制天气信息的显示和隐藏

// 切换天气信息的显示和隐藏
const toggleWeather = () => {
  showWeather.value = !showWeather.value;
};

const amapKey = import.meta.env.VITE_AMAP_KEY?.trim() || "";

onMounted(() => {
  updateCurrentTime(currentTime);
  updateCurrentDate(currentDate);
  if (amapKey) {
    fetchLocation(amapKey, (city) => fetchWeather(city, amapKey, weatherInfo));
  } else {
    console.warn("未配置VITE_AMAP_KEY，天气信息暂不可用。地图和空间分析功能不受影响。");
  }

  const timer = setInterval(() => {
    updateCurrentTime(currentTime);
    updateCurrentDate(currentDate);
  }, 1000);

  map = inject("$map");
  layers.value = map.getLayers().getArray();
  drawSources = {
    Point: new ol.source.Vector(),
    LineString: new ol.source.Vector(),
    Polygon: new ol.source.Vector(),
    Square: new ol.source.Vector(),
    Circle: new ol.source.Vector(),
  };

  for (const [type, source] of Object.entries(drawSources)) {
    const drawLayer = new ol.layer.Vector({ source, title: "画笔图层" });
    map.addLayer(drawLayer);
  }
  map.addLayer(measureLayer);
  map.addLayer(regionAnalysisLayer);
  map.addLayer(bufferLayer);

  onUnmounted(() => {
    clearInterval(timer);
    if (drawInteraction) map.removeInteraction(drawInteraction);
    if (measureInteraction) map.removeInteraction(measureInteraction);
    if (regionAnalysisInteraction) map.removeInteraction(regionAnalysisInteraction);
    stopBufferPointSelection();
  });
});

function toggleToolMenu(tool) {
  if (activeTool.value === tool) {
    activeTool.value = "";
  } else {
    activeTool.value = tool;
  }
}

function updateDisasterFilter(filterName, event) {
  mapModuleRef.value?.updateFilter(filterName, event.target.value);
  clearRegionAnalysis();
  clearBufferAnalysis();
}

function resetDisasterFilters() {
  mapModuleRef.value?.resetFilters();
  clearRegionAnalysis();
  clearBufferAnalysis();
}

function toggleLayer(layer) {
  const currentVisibility = layer.getVisible();
  layer.setVisible(!currentVisibility);
}

// 修改后的 removeLayerByTitle 函数，增加 title 参数
function removeLayerByTitle(title) {
  map
    .getLayers()
    .getArray()
    .forEach((layer) => {
      if (layer.get("title") === title) {
        map.removeLayer(layer);
      }
    });
}
function getLayerByTitle(title) {
  return map
    .getLayers()
    .getArray()
    .find((layer) => layer.get("title") === title);
}

function performHeatmapAnalysis() {
  // 优化1: 减少数据量（如果可能的话，可以基于地图的视野加载数据）
  const heatSource = new ol.source.Vector({
    url: "/src/assets/SCdiaster.json",
    format: new ol.format.GeoJSON(),
  });

  const heatMapLayer = new ol.layer.Heatmap({
    source: heatSource,
    blur: 7, // 优化2: 降低 blur 和 radius 值
    radius: 5,
    gradient: ["#00f", "#0ff", "#0f0", "#ff0", "#f00"],
    weight: (feature) => {
      const weight = feature.get("weight");
      return weight ? Math.min(weight, 1) : 0.1; // 确保 weight 值在 0 到 1 之间
    },
  });

  // 清除之前的热力图图层
  getLayerByTitle("地质灾害点").setVisible(false);
  removeLayerByTitle("热力图");
  heatMapLayer.set("title", "热力图");
  map.addLayer(heatMapLayer);

  // 使用 map 的动画帧方法来优化渲染
  map.render();
}
</script>

<style lang="scss" scoped>
.dashboard-container {
  user-select: none; /* 禁用文本选择 */
  width: 100%;
  height: 100vh;
  background: url("@/assets/dashBoardBG.jpeg") no-repeat center center;
  background-size: cover;
  position: relative;
}

// 通用面板样式
.panel {
  position: relative;
  background: rgba(255, 255, 255, 0.05); /* 更透明的背景色 */
  border: 2px solid transparent;
  border-width: 0.6375rem 0.475rem 0.25rem 1.65rem;
  border-image-source: url("@/assets/border.png");
  border-image-slice: 51 38 20 132;
  border-image-repeat: stretch; /* 确保边框图像重复填充，适应内容 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* 轻微阴影 */
  backdrop-filter: blur(2px); /* 背景模糊效果 */
  transition: box-shadow 0.3s ease, transform 0.3s ease; /* 过渡效果 */
  padding-right: 5px;
  margin-bottom: 15px;
  .title {
    text-align: center;
    margin-bottom: 2px;
    color: #ffffff;
    font-weight: bold;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5); /* 增强文本可读性 */
  }

  &:hover {
    transform: translateY(-5px); /* 悬停时上移效果 */
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2); /* 悬停时阴影增强 */
  }
}

// 头部
.header {
  width: 100%;
  height: 80px;
  background: url("@/assets/Header.png") no-repeat center center;
  background-size: cover;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 10;

  .logo {
    transform: translateY(-5px);
    width: 50px;
    height: 50px;
    margin-right: 15px;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    transition: transform 0.3s ease;
  }

  .title {
    transform: translateY(-5px);
    font-size: 24px;
    font-weight: bold;
    color: #ffffff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  &:hover .logo {
    transform: scale(1.1) translateY(-5px);
  }
}

/* 日期样式 */
.date {
  align-items: center;
  justify-content: center;
  z-index: 99;
  position: fixed;
  right: 30px;
  top: 8px;
}
/* 天气按钮样式 */
.weather-button {
  position: fixed;
  z-index: 100;
  left: 10px;
  top: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 15px;

  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  .iconfont {
    color: #dddddd;
    font-size: 15px;
  }
}

/* 天气信息样式 */
.weather {
  position: fixed;
  z-index: 99;
  left: 60px;
  top: 2px; /* 调整位置，使其在按钮下方 */
  background-color: #dddddd;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  color: black;
  max-width: 300px;
  transition: all 0.3s ease; /* 添加过渡效果 */
}

.weather-icon {
  z-index: 999;
  font-size: 30px;
  margin-bottom: 10px;
  color: #ffdd57; /* 根据天气类型调整颜色 */
}

.weather-details {
  display: flex;
  flex-direction: column;
  .city {
    display: flex;

    justify-content: space-between;
    font-size: 16px;
    font-family: "华文细黑";
    margin-bottom: 8px;
  }
}

.info {
  display: flex;
  justify-content: center;
  gap: 10px;
  font-size: 12px;
  align-items: center;
}

.info span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.info i {
  font-size: 16px;
}
// 内容区域
.main-content {
  display: flex;
  width: 100%;
  height: calc(100vh - 80px);
  color: white;
  .left {
    margin: 0 15px;
    width: 280px;
    z-index: 99;
    .panel {
      height: 200px;
    }
  }
  .map-container {
    position: relative;
    padding-top: 30px;
    flex: 1;
    .map {
      position: fixed;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.5);
    }
    .toolbox {
      position: absolute;
      bottom: 35px;
      left: 50%;
      transform: translateX(-40%);
      width: 90%;
      display: flex;
      justify-content: space-between;

      .tool-item {
        position: relative; /* 设置相对定位以便子元素绝对定位 */
        width: 65px;
        height: 55px;
        background: url("@/assets/baseBottom.png") no-repeat center center;
        background-size: cover;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        .activelayer {
          color: #ffcc00; /* 高亮颜色 */
          font-weight: bold; /* 文字加粗 */
          text-shadow: 0 0 5px rgba(255, 255, 0, 0.7); /* 添加文本阴影以增强可见性 */
        }

        .iconfont {
          transform: translateY(-10px);
          color: #ffffff;
          font-size: 20px;
          transition: color 0.3s ease;
        }

        .filter-tool-icon,
        .region-tool-icon,
        .buffer-tool-icon,
        .quality-tool-icon {
          transform: translateY(-10px);
          color: #ffffff;
          font-size: 19px;
          font-weight: bold;
          line-height: 1;
          transition: color 0.3s ease;
        }

        .text {
          transform: translateY(-8px);
          color: #ffffff;
          font-size: 12px;
          font-weight: bold;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
          transition: color 0.3s ease;
        }

        &:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);

          .iconfont,
          .filter-tool-icon,
          .region-tool-icon,
          .buffer-tool-icon,
          .quality-tool-icon,
          .text {
            color: #ffcc00;
          }
        }

        .tool-options {
          position: absolute; /* 绝对定位以便可以自由定位 */
          bottom: 60px; /* 初始位置在工具项的上方 */
          left: 50%;
          transform: translateX(-50%) translateY(10px); /* 向上偏移10px */
          opacity: 0; /* 初始透明度为0 */
          background-color: rgba(0, 0, 0, 0.8);
          border-radius: 5px;
          padding: 15px 10px;
          padding-bottom: 5px;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: opacity 0.3s ease, transform 0.3s ease; /* 添加过渡效果 */

          div {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-gap: 6x;
            color: #ffffff;
            font-size: 10px; /* 调小文字大小 */
            margin-bottom: 4px; /* 选项间距 */
            cursor: pointer;
            white-space: nowrap; /* 防止文字换行 */
          }
        }

        &:hover .tool-options {
          transform: translateX(-50%) translateY(0); /* 悬停时向上移动 */
          opacity: 1; /* 悬停时显示 */
        }

        .filter-tool-options {
          position: absolute;
          z-index: 20;
          right: 0;
          bottom: 64px;
          width: 235px;
          padding: 13px;
          color: #eaf6ff;
          background: rgba(4, 27, 48, 0.95);
          border: 1px solid rgba(76, 201, 240, 0.65);
          border-radius: 8px;
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.42);
          cursor: default;

          h3 {
            margin: 0 0 10px;
            color: #7fdbff;
            font-size: 15px;
          }

          label {
            display: grid;
            grid-template-columns: 44px 1fr;
            align-items: center;
            gap: 7px;
            margin-top: 8px;
            font-size: 12px;
          }

          select {
            min-width: 0;
            height: 29px;
            padding: 0 6px;
            color: #153047;
            background: #f7fbff;
            border: 1px solid #84b9d6;
            border-radius: 4px;
            outline: none;
          }

          select:focus {
            border-color: #31c5f4;
            box-shadow: 0 0 0 2px rgba(49, 197, 244, 0.2);
          }

          .filter-tool-summary {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-top: 11px;
            padding-top: 9px;
            font-size: 11px;
            border-top: 1px solid rgba(127, 219, 255, 0.28);

            button {
              padding: 4px 9px;
              color: #07324d;
              background: #7fdbff;
              border: 0;
              border-radius: 4px;
              cursor: pointer;
            }
          }
        }

        .region-analysis-panel {
          position: absolute;
          z-index: 20;
          right: 0;
          bottom: 64px;
          width: 310px;
          max-height: 470px;
          overflow-y: auto;
          padding: 14px;
          color: #eaf6ff;
          background: rgba(4, 27, 48, 0.96);
          border: 1px solid rgba(76, 201, 240, 0.68);
          border-radius: 8px;
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45);
          cursor: default;

          h3 {
            margin: 0 0 7px;
            color: #7fdbff;
            font-size: 15px;
          }

          .region-status,
          .region-note,
          .region-counts p {
            margin: 0;
            color: #d8edf7;
            font-size: 11px;
            line-height: 1.55;
          }

          .region-actions {
            display: flex;
            gap: 7px;
            margin: 10px 0;

            button {
              padding: 5px 9px;
              color: #07324d;
              background: #7fdbff;
              border: 1px solid #7fdbff;
              border-radius: 4px;
              cursor: pointer;
            }

            button.secondary {
              color: #dff6ff;
              background: transparent;
              border-color: rgba(127, 219, 255, 0.55);
            }

            button:disabled {
              cursor: not-allowed;
              opacity: 0.45;
            }
          }

          .region-metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 7px;
            margin: 10px 0;

            div {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              padding: 8px;
              background: rgba(49, 197, 244, 0.1);
              border: 1px solid rgba(127, 219, 255, 0.2);
              border-radius: 5px;
            }

            strong {
              color: #ffda68;
              font-size: 17px;
            }

            span {
              margin-top: 2px;
              color: #c9e8f6;
              font-size: 10px;
            }
          }

          .region-counts {
            padding-top: 2px;

            h4 {
              margin: 9px 0 5px;
              color: #8bdcf7;
              font-size: 12px;
            }

            .count-list {
              display: flex;
              flex-wrap: wrap;
              gap: 5px;

              span {
                padding: 3px 6px;
                color: #eaf8ff;
                font-size: 10px;
                background: rgba(255, 255, 255, 0.08);
                border-radius: 3px;
              }
            }
          }

          .region-note {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid rgba(127, 219, 255, 0.22);
          }
        }

        .buffer-analysis-panel {
          position: absolute;
          z-index: 20;
          right: 0;
          bottom: 64px;
          width: 315px;
          max-height: 470px;
          overflow-y: auto;
          padding: 14px;
          color: #eaf6ff;
          background: rgba(4, 27, 48, 0.96);
          border: 1px solid rgba(255, 153, 0, 0.72);
          border-radius: 8px;
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45);
          cursor: default;

          h3 {
            margin: 0 0 7px;
            color: #ffc45f;
            font-size: 15px;
          }

          .buffer-status,
          .buffer-note,
          .buffer-counts p {
            margin: 0;
            color: #f4e8d4;
            font-size: 11px;
            line-height: 1.55;
          }

          .buffer-form {
            display: grid;
            grid-template-columns: auto 1fr;
            align-items: center;
            gap: 8px;
            margin-top: 10px;

            button {
              padding: 5px 9px;
              color: #4b2a00;
              background: #ffc45f;
              border: 1px solid #ffc45f;
              border-radius: 4px;
              cursor: pointer;
            }

            .selected-point-name {
              overflow: hidden;
              color: #ffffff;
              font-size: 11px;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            label {
              display: grid;
              grid-column: 1 / -1;
              grid-template-columns: 38px 1fr 28px;
              align-items: center;
              gap: 7px;
              color: #f4e8d4;
              font-size: 11px;
            }

            input {
              min-width: 0;
              height: 28px;
              padding: 0 7px;
              color: #3c2b13;
              background: #fffaf1;
              border: 1px solid #d9a24b;
              border-radius: 4px;
              outline: none;
            }
          }

          .buffer-actions {
            display: flex;
            gap: 7px;
            margin: 10px 0;

            button {
              padding: 5px 9px;
              color: #4b2a00;
              background: #ffc45f;
              border: 1px solid #ffc45f;
              border-radius: 4px;
              cursor: pointer;
            }

            button.secondary {
              color: #ffe7be;
              background: transparent;
              border-color: rgba(255, 196, 95, 0.6);
            }

            button:disabled {
              cursor: not-allowed;
              opacity: 0.45;
            }
          }

          .buffer-metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 7px;
            margin: 10px 0;

            div {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              padding: 8px;
              background: rgba(255, 153, 0, 0.1);
              border: 1px solid rgba(255, 196, 95, 0.22);
              border-radius: 5px;
            }

            strong {
              color: #ffd36f;
              font-size: 17px;
            }

            span {
              margin-top: 2px;
              color: #f3dfbd;
              font-size: 10px;
            }
          }

          .buffer-counts {
            h4 {
              margin: 9px 0 5px;
              color: #ffc45f;
              font-size: 12px;
            }

            .count-list {
              display: flex;
              flex-wrap: wrap;
              gap: 5px;

              span {
                padding: 3px 6px;
                color: #fff4e2;
                font-size: 10px;
                background: rgba(255, 255, 255, 0.08);
                border-radius: 3px;
              }
            }
          }

          .buffer-note {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid rgba(255, 196, 95, 0.22);
          }
        }

        .quality-analysis-panel {
          position: absolute;
          z-index: 20;
          right: 0;
          bottom: 64px;
          width: 350px;
          max-height: 500px;
          overflow-y: auto;
          padding: 14px;
          color: #eaf6ff;
          background: rgba(4, 27, 48, 0.97);
          border: 1px solid rgba(137, 221, 120, 0.72);
          border-radius: 8px;
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45);
          cursor: default;

          h3 {
            margin: 0 0 7px;
            color: #9ce38e;
            font-size: 15px;
          }

          .quality-status,
          .quality-note {
            margin: 0;
            color: #dcefd8;
            font-size: 11px;
            line-height: 1.55;
          }

          .quality-actions {
            display: flex;
            gap: 8px;
            margin: 10px 0;

            button {
              padding: 5px 9px;
              color: #12320d;
              background: #9ce38e;
              border: 1px solid #9ce38e;
              border-radius: 4px;
              cursor: pointer;
            }

            button.secondary {
              color: #dff8da;
              background: transparent;
              border-color: rgba(156, 227, 142, 0.6);
            }

            button:disabled {
              cursor: not-allowed;
              opacity: 0.45;
            }
          }

          .quality-metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 7px;
            margin: 10px 0;

            div {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              padding: 8px;
              background: rgba(137, 221, 120, 0.1);
              border: 1px solid rgba(156, 227, 142, 0.22);
              border-radius: 5px;
            }

            strong {
              color: #b8f3a9;
              font-size: 17px;
            }

            span {
              margin-top: 2px;
              color: #d9efd4;
              font-size: 10px;
            }
          }

          .quality-counts,
          .quality-preview {
            h4 {
              margin: 10px 0 6px;
              color: #9ce38e;
              font-size: 12px;
            }
          }

          .quality-count-list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px;

            span {
              padding: 4px 6px;
              color: #eefbea;
              font-size: 10px;
              background: rgba(255, 255, 255, 0.07);
              border-radius: 3px;
            }
          }

          .quality-preview-item {
            display: grid;
            grid-template-columns: 100px 1fr;
            gap: 6px;
            padding: 4px 0;
            font-size: 10px;
            border-top: 1px solid rgba(156, 227, 142, 0.16);

            strong {
              overflow: hidden;
              color: #dff8da;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            span {
              color: #cfe5ca;
            }
          }

          .quality-note {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid rgba(156, 227, 142, 0.22);
          }
        }
      }
    }
  }
  .right {
    display: flex;
    flex-direction: column;
    justify-content: left;
    align-items: center;
    min-width: 250px;
    z-index: 99;
    .panel {
      width: 360px;
      height: 150px;
    }
    .second {
      width: 420px;
      display: flex;
      justify-content: end;
      .panel {
        width: 100px;
        height: 220px;
        &:first-child {
          margin-right: 5px;
        }
        &:last-child {
          width: 200px;
          height: 225px;
        }
      }
    }
  }
}
.footer {
  user-select: text;
  text-align: center;
  position: fixed;
  bottom: 0px;
  padding: 6px;
  background-color: rgba(0, 0, 0, 0.7); /* 半透明的深色背景 */
  color: #f0f0f0; /* 柔和的白色文字 */
  left: 50%;
  transform: translateX(-50%);
  font: 200 12px "华文细黑";
  border-radius: 8px; /* 更圆的边角 */
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.2); /* 较轻的阴影效果 */
  .iconfont {
    font: 1em sans-serif;
    margin: 0 1px;
  }
  a {
    color: #ffdd57; /* 柔和的黄色 */
    text-decoration: none; /* 去掉下划线 */
    margin-left: 3px;
  }
}
</style>
