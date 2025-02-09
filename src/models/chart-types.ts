import {_CompSpecSolid} from "./comp-spec";
import {Spec} from "./simple-vega-spec";

export type ChartType = "scatterplot" | "barchart" | "linechart" | "heatmap" | "NULL";

/**
 * Get chart type.
 * @param spec
 */
export function getChartType(spec: Spec): ChartType {
  if (isScatterplot(spec)) return "scatterplot";
  else if (isBarChart(spec)) return "barchart";
  else if (isHeatmap(spec)) return "heatmap";
  else return "NULL";
}

export function isChartsJuxtaposed(spec: _CompSpecSolid) {
  const {type: layout, unit, arrangement} = spec.layout;
  return (layout === "juxtaposition" && unit === "chart" && arrangement !== "animated");
}
export function isElementsJuxtaposed(spec: _CompSpecSolid) {
  const {type: layout, unit, arrangement} = spec.layout;
  return (layout === "juxtaposition" && unit === "item" && arrangement !== "animated");
}
export function isChartsSuperimposed(spec: _CompSpecSolid) {
  const {type: layout, unit, arrangement} = spec.layout;
  // arrangement cannot be animated when superimposed
  return (layout === "superposition" && unit === "chart" && arrangement !== "animated");
}
export function isElementsSuperimposed(spec: _CompSpecSolid) {
  const {type: layout, unit, arrangement} = spec.layout;
  // arrangement cannot be animated when superimposed
  return (layout === "superposition" && unit === "item" && arrangement !== "animated");
}

export function isOverlapLayout(spec: _CompSpecSolid) {
  const {type: layout, unit, arrangement} = spec.layout;
  return (layout === "superposition") || (layout === "juxtaposition" && unit === "item") || (arrangement === "animated");
}

export function isNoOverlapLayout(spec: _CompSpecSolid) {
  const {type: layout, unit, arrangement} = spec.layout;
  return (layout === "juxtaposition" && unit === "chart" && arrangement !== "animated") ||
    (layout === "superposition" && unit === "chart");
}

export function isNestingLayout(spec: _CompSpecSolid) {
  const {type: layout, unit} = spec.layout;
  return (layout === "superposition" && unit === "item");
}

// TODO: clearer name?
export function isNestingLayoutVariation(A: Spec, B: Spec, C: _CompSpecSolid) {
  const {type: layout, unit, arrangement} = C.layout;
  return (layout === "juxtaposition" && unit === "item" && arrangement !== "animated" && getChartType(A) !== getChartType(B));
}

export function isChartAnimated(spec: _CompSpecSolid) {
  const {unit, arrangement} = spec.layout;
  return arrangement === "animated" && unit === "chart";
}
export function isElementAnimated(spec: _CompSpecSolid) {
  const {type: layout, unit, arrangement} = spec.layout;
  return layout === "juxtaposition" && unit === "item" && arrangement === "animated";
}

/**
 * This function checks if this chart contains aggregated visual elements
 * such as bar charts or scatterplots with aggregated points
 * @param spec
 */
export function isChartDataAggregated(spec: Spec) {
  return isBarChart(spec) || isAggregatedScatterplot(spec) || isHeatmap(spec);
}

export function isAggregatedScatterplot(spec: Spec) {
  // when x-aggregate is not undefined, y-aggregate and color are also not undefined
  // refer to canRenderChart
  return isScatterplot(spec) && spec.encoding.x.aggregate !== undefined;
}

export function isBarChart(spec: Spec) {
  return spec.mark === "bar" && (
    (spec.encoding.x.type === 'nominal' && spec.encoding.y.type === 'quantitative') ||
    (spec.encoding.x.type === 'quantitative' && spec.encoding.y.type === 'nominal'));
}
export function isScatterplot(spec: Spec) {
  return spec.mark === "point" &&
    spec.encoding.x.type === 'quantitative' && spec.encoding.y.type === 'quantitative';
}
export function isHeatmap(spec: Spec) {
  return spec.mark === "rect";
}
export function isBothBarChart(A: Spec, B: Spec) {
  return isBarChart(A) && isBarChart(B);
}
export function isBothScatterplot(A: Spec, B: Spec) {
  return isScatterplot(A) && isScatterplot(B);
}
export function isBothAggregatedScatterplot(A: Spec, B: Spec) {
  return isAggregatedScatterplot(A) && isAggregatedScatterplot(B);
}
export function isBothHeatmap(A: Spec, B: Spec) {
  return isHeatmap(A) && isHeatmap(B);
}

export function isColorIdentical(A: Spec, B: Spec) {
  return A.encoding.color && B.encoding.color &&
    A.encoding.color.field === B.encoding.color.field &&
    A.encoding.color.type === B.encoding.color.type &&
    A.encoding.color.aggregate === B.encoding.color.aggregate;
}

export function isEEChart(C: _CompSpecSolid) {
  if (!C) return undefined;

  const {type: layout} = C.layout;
  return layout === "explicit-encoding";
}
export function isStackedBarChart(A: Spec, B: Spec, C: _CompSpecSolid) {
  const {type: layout, unit, arrangement} = C.layout;
  return layout === "juxtaposition" && unit === "item" && arrangement === "stacked" && isBothBarChart(A, B);
}
export function isGroupedBarChart(A: Spec, B: Spec, C: _CompSpecSolid) {
  const {type: layout, unit, arrangement} = C.layout;
  return layout === "juxtaposition" && unit === "item" && arrangement === "adjacent" && isBothBarChart(A, B);
}
// Alper et al. Weighted Graph Comparison Techniques for Brain Connectivity Analysis
export function isDivisionHeatmap(A: Spec, B: Spec, C: _CompSpecSolid) {
  const {type: layout, unit, arrangement} = C.layout;
  return layout === "juxtaposition" && unit === "item" && arrangement !== "animated" && isBothHeatmap(A, B);
}
export function isChartDiagonalHeatmap(A: Spec, B: Spec, C: _CompSpecSolid) {
  const {type: layout, unit, arrangement} = C.layout;
  return layout === "juxtaposition" && unit === "chart" && arrangement === "diagonal" && isBothHeatmap(A, B);
}
export function isChartUnitScatterplots(A: Spec, B: Spec, C: _CompSpecSolid) {
  const {type: layout, unit} = C.layout;
  return ((layout === "juxtaposition" && unit === "chart") || (layout === "superposition" && unit === "chart")) &&
    isBothScatterplot(A, B);
}