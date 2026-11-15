import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { BarChart as EChartsBarChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([EChartsBarChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

const BarChart = ({ option, style }) => (
  <ReactEChartsCore echarts={echarts} option={option} style={style} />
);

export default BarChart;
