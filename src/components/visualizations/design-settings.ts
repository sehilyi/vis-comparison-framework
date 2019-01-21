import {Spec} from "src/models/simple-vega-spec";
import {CompSpec} from "src/models/comp-spec";
import {DATASET_MOVIES} from "src/datasets/movies";
import d3 = require("d3");

// general
export const CHART_SIZE = {width: 230, height: 200};
export const CHART_MARGIN = {top: 10, right: 20, bottom: 40, left: 50};
export const CHART_PADDING = {right: 20};
export const CHART_TOTAL_SIZE = {
  width: CHART_SIZE.width + CHART_MARGIN.left + CHART_MARGIN.right,
  height: CHART_SIZE.height + CHART_MARGIN.top + CHART_MARGIN.bottom
}
export const CATEGORICAL_COLORS = [
  '#4E79A7', '#F28E2B', '#E15759',
  '#76B7B2', '#59A14E', '#EDC949',
  '#B07AA1', '#FF9DA7', '#9C755F', '#BAB0AC'];
export const CATEGORICAL_COLORS_DARKER = [
  "#3E6085", "#c17122", "#b44547",
  "#5e928e", "#47803e", "#bda03a",
  "#8c6180", "#cc7d85", "#7c5d4c", "#948c89"];
export const CATEGORICAL_COLORS_DARKEST = [
  "#121c27", "#39210a", "#361415",
  "#1c2b2a", "#152612", "#383011",
  "#2a1d26", "#3d2527", "#251b16", "#2c2a29"];

export const DEFAULT_FONT = "Roboto Condensed";

// bar
export const BAR_GAP = 7;
export const BAR_CHART_GAP = 10;
export const MAX_BAR_WIDTH = 30;

export const BAR_COLOR = '#4E79A7';
export const BAR_COLOR2 = '#F28E2B';

export function getBarWidth(cw: number, n: number, g: number) {
  return d3.min([cw / n - g as number, MAX_BAR_WIDTH])
}
export function getBarColor(n: number) {
  return CATEGORICAL_COLORS.slice(0, n > CATEGORICAL_COLORS.length ? CATEGORICAL_COLORS.length - 1 : n);
}
export function getBarColorDarker(n: number) {
  return CATEGORICAL_COLORS_DARKER.slice(0, n > CATEGORICAL_COLORS_DARKER.length ? CATEGORICAL_COLORS_DARKER.length - 1 : n);
}
export function getBarColorDarkest(n: number) {
  return CATEGORICAL_COLORS_DARKEST.slice(0, n > CATEGORICAL_COLORS_DARKEST.length ? CATEGORICAL_COLORS_DARKEST.length - 1 : n);
}

export function getTotalChartSize(w: number, h: number) {
  return {width: w + CHART_MARGIN.left + CHART_MARGIN.right, height: h + CHART_MARGIN.top + CHART_MARGIN.bottom}
}

// test
export function getSimpleBarSpecs(): {A: Spec, B: Spec, C: CompSpec} {
  return {
    // https://vega.github.io/vega-lite/examples/
    A: {
      data: {
        values: DATASET_MOVIES.rawData
      },
      mark: "bar",
      encoding: {
        x: {field: "MPAA_Rating", type: "nominal"},
        y: {field: "IMDB_Votes", type: "quantitative", aggregate: "mean"},
        color: {field: "MPAA_Rating", type: "nominal"}
      }
    },
    B: {
      data: {
        values: DATASET_MOVIES.rawData
      },
      mark: "bar",
      encoding: {
        x: {field: "MPAA_Rating", type: "nominal"},
        y: {field: "IMDB_Votes", type: "quantitative", aggregate: "median"},
        color: {field: "MPAA_Rating", type: "nominal"}
      }
    },
    C: {
      layout: 'overlay',
      // direction: "vertical",
      // unit: "chart",
      consistency: {
        y: {value: true, mirrored: false},
        x: {value: false, mirrored: false},
        color: false
      }
    }
  }
}