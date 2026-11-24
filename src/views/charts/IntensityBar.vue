<template>
  <div class="chart-container">
    <div id="intensity-bar-chart" style="width: 500px; height: 160px"></div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import * as echarts from "echarts";
import { parseGeoData } from "@/utils/parseGeoData.js";

// 解析GeoJSON数据并获取地震烈度统计
const geoData = parseGeoData();
const intensityCounts = geoData.intensityCounts;

// 准备地震烈度数据
const intensityData = Object.keys(intensityCounts).map((intensity) => ({
  name: intensity,
  value: intensityCounts[intensity],
}));

// ECharts配置项
const option = {
  backgroundColor: "#ffffff", // 设置背景色
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(50, 50, 50, 0.7)",
    textStyle: {
      color: "#fff",
    },
    axisPointer: {
      type: "shadow",
    },
  },
   grid: {
              top: "15%",
              bottom: "15%", // 增加底部间距，为横坐标标签留出更多空间
              left: "40px",  // 增加左侧边距，确保纵坐标完全显示
              right: "5px",
            },
            xAxis: {
              type: "category",
              data: intensityData.map((item) => item.name ), // 添加"度"字
              axisLabel: {
                interval: 0,
                rotate: 0,
                color: "#333",
                fontSize: 12,
                fontWeight: "bold",
                margin: 10, // 增加标签间距
                padding: [5, 0, 0, 0] // 增加标签内边距
              },
              axisLine: {
                lineStyle: {
                  color: "#4a77b5",
                },
              },
              axisTick: {
                alignWithLabel: true,
                length: 7 // 缩短刻度线长度
              }
            },
            yAxis: {
              type: "value",
              axisLabel: {
                color: "#333",
                fontSize: 11,
                margin: 8
              },
              axisLine: {
                show: true,
                lineStyle: {
                  color: "#4a77b5",
                },
              },
              splitLine: {
                lineStyle: {
                  color: "rgba(100, 150, 250, 0.2)",
                },
              },
            },
  series: [
    {
      name: "数量",
      type: "bar",
      data: intensityData.map((item) => item.value),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "#83bff6" },
          { offset: 0.5, color: "#188df0" },
          { offset: 1, color: "#188df0" },
        ]), // 使用线性渐变
        borderRadius: [5, 5, 0, 0], // 圆角效果
      },
      barWidth: "45%",
      animationDelay: function (idx) {
        return idx * 100; // 添加动画延迟
      },
    },
  ],
  animationEasing: "elasticOut", // 动画效果
  animationDelayUpdate: function (idx) {
    return idx * 100;
  },
};

onMounted(() => {
  const chart = echarts.init(document.getElementById("intensity-bar-chart"));
  chart.setOption(option);
  window.addEventListener('resize', function() {
            chart.resize();
          });

});
</script>

<style scoped>
.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: #f5f5f5; /* 增加背景色，突出图表 */
  border-radius: 15px; /* 添加圆角，使整体视觉更柔和 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* 轻微阴影，增加立体感 */
}
</style>
