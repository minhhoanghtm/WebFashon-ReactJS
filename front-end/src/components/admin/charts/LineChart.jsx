import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { LineChart as EChartsLineChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([EChartsLineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

const LineChart = ({ option, style }) => (
  <ReactEChartsCore echarts={echarts} option={option} style={style} />
);

export default LineChart;
