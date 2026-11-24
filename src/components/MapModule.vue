<template>
  <div class="map-module-container">
    <div id="map"></div>
    <div
      ref="popupElement"
      class="map-popup"
      v-show="popupVisible"
      @click.stop
    >
      <button class="popup-close" type="button" aria-label="关闭" @click="closePopup">
        ×
      </button>

      <template v-if="popupMode === 'cluster'">
        <h3>聚合灾害点</h3>
        <p>当前位置共有 {{ clusterCount }} 个灾害点，请继续放大查看详细信息。</p>
      </template>

      <template v-else-if="selectedDisaster">
        <h3>{{ selectedDisaster["灾害体名称"] || "未命名灾害点" }}</h3>
        <dl>
          <div><dt>灾害类型</dt><dd>{{ selectedDisaster["灾害体类型"] || "暂无" }}</dd></div>
          <div><dt>行政区</dt><dd>{{ disasterLocation }}</dd></div>
          <div><dt>地理位置</dt><dd>{{ selectedDisaster["地理位置"] || "暂无" }}</dd></div>
          <div><dt>地震烈度</dt><dd>{{ selectedDisaster["地震烈度"] || "暂无" }}</dd></div>
          <div><dt>险情等级</dt><dd>{{ selectedDisaster["险情等级"] || "暂无" }}</dd></div>
          <div><dt>威胁人口</dt><dd>{{ selectedDisaster["威胁人口"] ?? "暂无" }}</dd></div>
          <div><dt>威胁财产</dt><dd>{{ selectedDisaster["威胁财产"] ?? "暂无" }}</dd></div>
          <div><dt>防治建议</dt><dd>{{ preventionAdvice }}</dd></div>
        </dl>
      </template>
    </div>
    <div v-if="coordinate.length > 0" id="mousePosition">
      <i class="iconfont icon-jingweidu"></i> {{ formattedCoordinate }}
    </div>
    <div v-else id="mousePosition">Put Mouse On Map</div>
  </div>
</template>

<script setup>
import { app } from "@/main";
import { onMounted, ref, computed } from "vue";
import disasterData from "@/assets/SCdiaster.json";
import {
  collectFilterOptions,
  matchesDisasterFilters,
} from "@/utils/filterDisasters";

// 定义颜色映射
const intensityColors = {
  Ⅵ: "#FFCC00",
  Ⅶ: "#FF9900",
  Ⅷ: "#FF3300",
  Ⅸ: "#FF0000",
  Ⅹ: "#990000",
};

// 样式函数
function getIntensityStyle(feature) {
  const intensity = feature.get("地震烈度");
  const color = intensityColors[intensity] || "#000000";

  return new ol.style.Style({
    image: new ol.style.Circle({
      radius: 6,
      fill: new ol.style.Fill({ color: color }),
      stroke: new ol.style.Stroke({
        color: "#ffffff",
        width: 1,
      }),
    }),
  });
}

// 聚合样式函数
function getClusterStyle(feature) {
  const size = feature.get("features").length;
  let style;

  if (size > 1) {
    const color = size > 20 ? "#ff0000" : size > 10 ? "#ff9900" : "#3399CC";
    const radius = Math.min(12 + size, 20);

    style = new ol.style.Style({
      image: new ol.style.Circle({
        radius: radius,
        fill: new ol.style.Fill({
          color: color,
        }),
        stroke: new ol.style.Stroke({
          color: "#fff",
          width: 2,
        }),
      }),
      text: new ol.style.Text({
        text: size.toString(),
        fill: new ol.style.Fill({
          color: "#fff",
        }),
        stroke: new ol.style.Stroke({
          color: "#000",
          width: 2,
        }),
        font: "bold 14px Arial, sans-serif",
      }),
    });

    // 为图标设置样式和透明度
    style.getImage().setOpacity(0.75 + size / 100); // 调整图标透明度
  } else {
    const originalFeature = feature.get("features")[0];
    style = getIntensityStyle(originalFeature);
  }
  return style;
}

let coordinate = ref([]);
const filters = ref({
  city: "",
  type: "",
  intensity: "",
});
const cityOptions = collectFilterOptions(disasterData.features, "市");
const typeOptions = collectFilterOptions(disasterData.features, "灾害体类型");
const intensityOptions = collectFilterOptions(disasterData.features, "地震烈度");
const filteredDisasterCount = ref(disasterData.features.length);
const popupElement = ref(null);
const popupVisible = ref(false);
const popupMode = ref("detail");
const clusterCount = ref(0);
const selectedDisaster = ref(null);
let popupOverlay;

const disasterLocation = computed(() => {
  if (!selectedDisaster.value) return "暂无";
  const parts = [
    selectedDisaster.value["市"],
    selectedDisaster.value["县"],
    selectedDisaster.value["乡镇"],
  ].filter((item) => item && item.trim());
  return parts.join(" ") || "暂无";
});

const preventionAdvice = computed(() => {
  const advice = selectedDisaster.value?.["防治建议"];
  return advice ? advice.replaceAll("$", "、") : "暂无";
});

function closePopup() {
  popupVisible.value = false;
  selectedDisaster.value = null;
  popupOverlay?.setPosition(undefined);
}

const formattedCoordinate = computed(() => {
  if (coordinate.value.length === 2) {
    const [lon, lat] = coordinate.value;
    return `Lon: ${lon.toFixed(3)}, Lat: ${lat.toFixed(3)}`;
  }
  return "";
});

const geoJsonFormat = new ol.format.GeoJSON();
const allDisasterFeatures = geoJsonFormat.readFeatures(disasterData);
const disasterSource = new ol.source.Vector({
  features: allDisasterFeatures,
});

// 创建聚合源
const clusterSource = new ol.source.Cluster({
  distance: 40, // 聚合的距离，可以根据需要调整
  source: disasterSource,
});

function applyFilters() {
  closePopup();
  const nextFeatures = allDisasterFeatures.filter((feature) =>
    matchesDisasterFilters(feature.getProperties(), filters.value)
  );

  disasterSource.clear(true);
  disasterSource.addFeatures(nextFeatures);
  filteredDisasterCount.value = nextFeatures.length;
}

function resetFilters() {
  filters.value = { city: "", type: "", intensity: "" };
  applyFilters();
}

function updateFilter(filterName, value) {
  if (!Object.hasOwn(filters.value, filterName)) return;
  filters.value[filterName] = value;
  applyFilters();
}

defineExpose({
  filters,
  cityOptions,
  typeOptions,
  intensityOptions,
  filteredDisasterCount,
  updateFilter,
  resetFilters,
});

// 地质灾害点图层，应用聚合样式函数
const disasterLayer = new ol.layer.Vector({
  title: "地质灾害点",
  source: clusterSource,
  style: getClusterStyle, // 设置聚合样式函数
});

const gaodeMapLayer = new ol.layer.Tile({
  title: "高德路网瓦片",
  source: new ol.source.XYZ({
    url: "http://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}",
    wrapX: false,
    crossOrigin: "anonymous", // 确保使用匿名跨域请求
  }),
});

const imageLayer = new ol.layer.Tile({
  title: "高德影像地图",
  source: new ol.source.XYZ({
    url: "http://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=6&x={x}&y={y}&z={z}",
    wrapX: false,
    crossOrigin: "anonymous", // 确保使用匿名跨域请求
  }),
});

const annotationLayer = new ol.layer.Tile({
  title: "高德注记地图",
  source: new ol.source.XYZ({
    url: "http://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8",
    wrapX: false,
    crossOrigin: "anonymous", // 确保使用匿名跨域请求
  }),
});

onMounted(() => {
  const map = new ol.Map({
    target: "map",
    layers: [gaodeMapLayer, imageLayer, disasterLayer, annotationLayer],
    view: new ol.View({
      center: [102.7, 30.6],
      zoom: 6,
      projection: "EPSG:4326",
    }),
  });

  popupOverlay = new ol.Overlay({
    element: popupElement.value,
    positioning: "bottom-center",
    offset: [0, -14],
    autoPan: {
      animation: { duration: 250 },
    },
  });
  map.addOverlay(popupOverlay);

  map.on("singleclick", (event) => {
    const clusterFeature = map.forEachFeatureAtPixel(
      event.pixel,
      (feature) => feature,
      {
        layerFilter: (layer) => layer === disasterLayer,
      }
    );

    if (!clusterFeature) {
      closePopup();
      return;
    }

    const features = clusterFeature.get("features") || [];
    const popupCoordinate = clusterFeature.getGeometry().getCoordinates();

    if (features.length > 1) {
      popupMode.value = "cluster";
      clusterCount.value = features.length;
      selectedDisaster.value = null;
    } else if (features.length === 1) {
      popupMode.value = "detail";
      selectedDisaster.value = features[0].getProperties();
    } else {
      closePopup();
      return;
    }

    popupVisible.value = true;
    popupOverlay.setPosition(popupCoordinate);
  });

  map.on("pointermove", (e) => {
    coordinate.value = e.coordinate;
  });
  // const drawSource = new ol.source.Vector();
  // const drawLayer = new ol.layer.Vector({
  //   source: drawSource,
  // });
  // map.addLayer(drawLayer);
  // const draw = new ol.interaction.Draw({
  //   type: "LineString",
  //   source: drawSource,
  // });
  // map.addInteraction(draw);
  app.provide("$map", map);
});
</script>

<style lang="scss" scoped>
.map-module-container {
  width: 100%;
  height: 100%;
  position: relative;

  #map {
    width: 100%;
    height: 100%;
  }

  #mousePosition {
    position: absolute;
    right: 2px;
    bottom: 4px;
    width: 220px; /* 设置固定宽度 */
    color: rgb(231, 222, 160); /* 使用醒目的科技色 */
    padding: 8px 15px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: bold;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4), 0 0 10px rgba(0, 255, 204, 0.3);
    transition: transform 0.3s ease, box-shadow 0.3s ease; /* 添加过渡效果 */
    overflow: hidden; /* 隐藏超出边界的文本 */
    white-space: nowrap; /* 防止文本换行 */
    text-align: center; /* 文本居中 */
    .iconfont {
      color: lightskyblue;
      margin-right: 5px;
    }
  }

  #mousePosition:hover {
    transform: scale(1.05); /* 鼠标悬停时放大效果 */
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 255, 204, 0.5); /* 悬停时的阴影效果 */
  }

  .map-popup {
    position: relative;
    width: 290px;
    max-height: 360px;
    overflow-y: auto;
    padding: 16px 18px;
    color: #243447;
    background: rgba(255, 255, 255, 0.97);
    border: 1px solid rgba(25, 118, 210, 0.35);
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
    user-select: text;
  }

  .map-popup::after {
    position: absolute;
    bottom: -10px;
    left: 50%;
    width: 0;
    height: 0;
    border: 10px solid transparent;
    border-top-color: rgba(255, 255, 255, 0.97);
    border-bottom: 0;
    content: "";
    transform: translateX(-50%);
  }

  .map-popup h3 {
    margin: 0 26px 12px 0;
    color: #0d5b92;
    font-size: 16px;
    line-height: 1.4;
  }

  .map-popup p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
  }

  .popup-close {
    position: absolute;
    top: 6px;
    right: 8px;
    padding: 0;
    color: #607d8b;
    font-size: 24px;
    line-height: 1;
    background: transparent;
    border: 0;
    cursor: pointer;
  }

  .map-popup dl,
  .map-popup dd {
    margin: 0;
  }

  .map-popup dl > div {
    display: grid;
    grid-template-columns: 72px 1fr;
    gap: 8px;
    padding: 5px 0;
    font-size: 13px;
    line-height: 1.45;
    border-top: 1px solid #e8eef3;
  }

  .map-popup dt {
    color: #607d8b;
  }

  .map-popup dd {
    color: #263238;
    overflow-wrap: anywhere;
  }
}
</style>
