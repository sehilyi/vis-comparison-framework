import {Spec} from "src/models/simple-vega-spec";

import {CompSpec, Consistency} from "src/models/comp-spec";
import {DEFAULT_CHART_STYLE} from ".";
import {getAggregatedData} from "../data-handler";
import {isUndefined} from "util";
import {ChartDomainData} from "../data-handler/domain-calculator";
import {getColor, getConstantColor} from "../design-settings";
import {isBarChart, isScatterplot} from "..";
import {SCATTER_POINT_SIZE_FOR_NESTING} from "../scatterplots/default-design";

// TOOD: any better way to define domains' type?
export function getStyles(A: Spec, B: Spec, C: CompSpec, consistency: Consistency, d: {A: ChartDomainData, B: ChartDomainData}) {
  let S = {A: {...DEFAULT_CHART_STYLE}, B: {...DEFAULT_CHART_STYLE}}

  // common
  S.A.verticalBar = (isBarChart(A) && A.encoding.x.type === "nominal")
  S.B.verticalBar = (isBarChart(B) && B.encoding.x.type === "nominal")

  // by layout
  switch (C.layout) {
    case "juxtaposition":
      if (C.unit === "chart") {
        const isAColorUsed = !isUndefined(A.encoding.color)
        const isBColorUsed = !isUndefined(B.encoding.color)
        const isALegendUse = consistency.color && C.direction == "vertical" || !consistency.color && isAColorUsed
        const isBLegendUse = consistency.color && C.direction == "horizontal" || !consistency.color && isBColorUsed
        S.A.legend = isALegendUse
        S.B.legend = isBLegendUse
        S.B.revY = C.direction === "vertical" && C.mirrored
        S.A.revX = C.direction === "horizontal" && C.mirrored
        S.A.noX = consistency.x_axis && !S.B.revX && C.direction === 'vertical'
        S.B.noY = consistency.y_axis && !S.B.revY && C.direction === 'horizontal'

        S.A.color = getColor(d.A.c)
        S.A.colorKey = d.A.cKey
        S.B.color = getColor(d.B.c)
        S.B.colorKey = d.B.cKey
      }
      else if (C.unit === "element") {
        if (C.direction === "vertical") { // stacked bar
          S.B.noAxes = true
          const {field: nField} = A.encoding.x.type === "nominal" ? A.encoding.x : A.encoding.y,
            {field: qField} = A.encoding.x.type === "quantitative" ? A.encoding.x : A.encoding.y
          S.B.barOffset = {data: getAggregatedData(A).data, valueField: qField, keyField: nField}
        }
        else if (C.direction === "horizontal") { // grouped bar
          S.A.shiftBy = -0.5
          S.A.mulSize = 0.5
          S.B.shiftBy = 0.5
          S.B.mulSize = 0.5
          S.B.noAxes = true
        }

        S.A.color = getConstantColor() // getColor(d.A.c)
        S.A.colorKey = d.A.cKey
        S.B.color = getConstantColor(2) // getColor((d.B as DomainData).c)
        S.B.colorKey = d.B.cKey
      }
      break
    case "superimposition":
      if (C.unit === "chart") {
        const isAColorUsed = !isUndefined(A.encoding.color)
        const isBColorUsed = !isUndefined(B.encoding.color)
        S.A.legend = isAColorUsed // TODO: should consider false consistency
        // S.A.noGrid = true // for clutter reduction
        S.B.legend = isBColorUsed
        S.B.noGrid = true
        if (consistency.x_axis) S.B.noX = true
        if (consistency.y_axis) S.B.noY = true
        if (!consistency.x_axis) S.B.topX = true
        if (!consistency.y_axis) S.B.rightY = true

        S.A.color = getColor(d.A.c)
        S.A.colorKey = d.A.cKey
        S.B.color = getColor(d.B.c)
        S.B.colorKey = d.B.cKey

        S.B.opacity = 0.4
        S.A.onTop = true
      }
      else if (C.unit === "element") {
        S.B.noY = true
        S.B.noX = true
        S.B.noGrid = true
        S.B.barGap = 0
        S.B.pointSize = 1.5

        S.A.color = getColor(d.A.c)
        S.A.colorKey = d.A.cKey
        S.B.color = getColor(d.B.c)
        S.B.colorKey = d.B.cKey

        if (isScatterplot(A)) {
          S.A.pointSize = SCATTER_POINT_SIZE_FOR_NESTING
          S.A.rectPoint = true
        }
      }
      break
    default:
      break
  }
  return S
}