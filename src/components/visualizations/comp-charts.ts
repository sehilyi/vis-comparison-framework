import * as d3 from "d3";
import {Spec} from "src/models/simple-vega-spec";
import {CompSpec} from "src/models/comp-spec";
import {_g, _width, _height, _color, _fill, renderAxes, getAggValues, _transform, _rect, _y, _x, _stroke, _stroke_width, getAggValuesByTwoKeys, _opacity} from ".";
import {uniqueValues, translate, isDeepTrue, isUndefinedOrFalse} from "src/useful-factory/utils";
import {GAP_BETWEEN_CHARTS, CHART_TOTAL_SIZE, CHART_SIZE, CHART_MARGIN, getBarColor, getBarColorDarker, getChartSize} from "./design-settings";
import {isUndefined} from "util";
import {renderBarChart, renderBars} from "./barcharts";

export function renderCompChart(ref: SVGSVGElement, A: Spec, B: Spec, C: CompSpec) {
  d3.select(ref).selectAll('*').remove();

  switch (C.layout) {
    case 'stack':
      if (C.unit === 'chart') renderStackPerChart(ref, A, B, C);
      else if (C.unit === 'element') renderStackPerElement(ref, A, B, C);
      break;
    case "blend":
      renderBlend(ref, A, B, C)
      break;
    case "overlay":
      renderOverlay(ref, A, B, C)
      break;
    case "nest":
      renderNest(ref, A, B, C)
      break;
    default: renderStackPerChart(ref, A, B, C); break;
  }
}

function renderStackPerChart(ref: SVGSVGElement, A: Spec, B: Spec, C: CompSpec) {
  const {...consistency} = getConsistencySpec(A, B, C);

  // determine svg size by direction and consistency
  // consistency reduce gap between charts
  let size;
  if (C.direction === 'horizontal') {
    if (consistency.y && !consistency.y_mirrored) {
      size = getChartSize(2, 1, {noY: true})
    }
    else {
      size = getChartSize(2, 1, {})
    }
  }
  else {
    if (consistency.x && !consistency.x_mirrored) {
      size = getChartSize(1, 2, {noX: true})
    }
    else {
      size = getChartSize(1, 2, {})
    }
  }
  d3.select(ref)
    .attr(_width, size.width)
    .attr(_height, size.height);

  // determine start X & Y positions for the second chart
  let transB: {left: number, top: number};
  if (C.direction === 'horizontal') {
    if (consistency.y && !consistency.y_mirrored) {
      transB = {left: CHART_MARGIN.left + CHART_SIZE.width + GAP_BETWEEN_CHARTS, top: CHART_MARGIN.top};
    }
    else {
      transB = {left: CHART_TOTAL_SIZE.width + CHART_MARGIN.left, top: CHART_MARGIN.top};
    }
  }
  else { // if (C.direction === 'vertical') {
    if (consistency.x && !consistency.x_mirrored) {
      transB = {left: CHART_MARGIN.left, top: CHART_MARGIN.top + CHART_SIZE.height + GAP_BETWEEN_CHARTS}
    }
    else {
      transB = {left: CHART_MARGIN.left, top: CHART_TOTAL_SIZE.height + CHART_MARGIN.top}
    }
  }

  const {values: valsA} = A.data, {values: valsB} = B.data
  const {aggregate: funcA} = A.encoding.y, {aggregate: funcB} = B.encoding.y
  const aggValuesA = getAggValues(valsA, A.encoding.x.field, A.encoding.y.field, funcA)
  const aggValuesB = getAggValues(valsB, B.encoding.x.field, B.encoding.y.field, funcB)
  const groupsUnion = uniqueValues(aggValuesA.concat(aggValuesB), "key")
  const aggValuesUnion = aggValuesA.map(d => d.value).concat(aggValuesB.map(d => d.value))

  { /// A
    const g = d3.select(ref).append(_g)
      .attr(_transform, translate(CHART_MARGIN.left, CHART_MARGIN.top))

    const groups = uniqueValues(valsA, A.encoding.x.field)
    const xDomain = consistency.x ? groupsUnion : groups
    const yDomain = consistency.y ? aggValuesUnion : aggValuesA.map(d => d.value)

    const noX = consistency.x && C.direction === 'vertical' && !consistency.x_mirrored

    const isColorUsed = !isUndefined(A.encoding.color)
    const c = d3.scaleOrdinal()
      .domain(consistency.color ? groupsUnion : groups)
      .range(getBarColor(consistency.color ? groupsUnion.length : isColorUsed ? groups.length : 1))

    renderBarChart(g, A, {x: xDomain, y: yDomain}, c, {noX})
  }
  { /// B
    const g = d3.select(ref).append(_g)
      .attr(_transform, translate(transB.left, transB.top))

    const groups = uniqueValues(valsB, B.encoding.x.field)
    const xDomain = consistency.x ? groupsUnion : groups
    const yDomain = consistency.y ? aggValuesB.map(d => d.value).concat(aggValuesA.map(d => d.value)) : aggValuesB.map(d => d.value)

    const noY = consistency.y && C.direction === 'horizontal' && !consistency.y_mirrored
    const revY = consistency.y_mirrored
    const revX = consistency.x_mirrored

    const isColorUsed = !isUndefined(B.encoding.color)
    const c = d3.scaleOrdinal()
      .domain(consistency.color ? groupsUnion : groups)
      .range(getBarColor(consistency.color ? groupsUnion.length : isColorUsed ? groups.length : 1))

    renderBarChart(g, B, {x: xDomain, y: yDomain}, c, {noY, revY, revX})
  }
}

function renderStackPerElement(ref: SVGSVGElement, A: Spec, B: Spec, C: CompSpec) {

  d3.select(ref)
    .attr(_width, CHART_TOTAL_SIZE.width)
    .attr(_height, CHART_TOTAL_SIZE.height)

  const g = d3.select(ref).append(_g)
    .attr(_transform, translate(CHART_MARGIN.left, CHART_MARGIN.top));
  const height = CHART_SIZE.height; // TODO: handle this

  const {values: valsA} = A.data, {values: valsB} = B.data;
  const {aggregate: aggrA} = A.encoding.y, {aggregate: aggrB} = B.encoding.y;
  const aggValuesA = getAggValues(valsA, A.encoding.x.field, A.encoding.y.field, aggrA);
  const aggValuesB = getAggValues(valsB, B.encoding.x.field, B.encoding.y.field, aggrB);
  const aggValuesAPlusB = getAggValues(aggValuesA.concat(aggValuesB), "key", "value", 'sum');
  const yDomain = C.direction === "vertical"
    ? aggValuesAPlusB.map(d => d.value)
    : aggValuesA.concat(aggValuesB).map(d => d.value);
  // const groups = uniqueValues(valsA, A.encoding.x.field);
  const xDomain = uniqueValues(aggValuesAPlusB, 'key')
  const {x, y} = renderAxes(g, xDomain, yDomain, A, {height});

  if (C.direction === "vertical") { // stacked bar
    const colorA = d3.scaleOrdinal()
      .domain(xDomain)
      .range(getBarColor(1));
    const colorB = d3.scaleOrdinal()
      .domain(xDomain)
      .range(getBarColor(2).slice(1, 2));

    renderBars(g, aggValuesA, "value", "key", xDomain, x, y, {color: colorA, cKey: "key"}, {})
    renderBars(g, aggValuesB, "value", "key", xDomain, x, y, {color: colorB, cKey: "key"}, {yOffsetData: aggValuesA})
  }
  else if (C.direction === "horizontal") {  // grouped bar
    const colorA = d3.scaleOrdinal()
      .domain(xDomain)
      .range(getBarColor(1));
    const colorB = d3.scaleOrdinal()
      .domain(xDomain)
      .range(getBarColor(2).slice(1, 2));

    renderBars(g, aggValuesA, "value", "key", xDomain, x, y, {color: colorA, cKey: "key"}, {shiftBy: -0.5, mulSize: 0.5})
    renderBars(g, aggValuesB, "value", "key", xDomain, x, y, {color: colorB, cKey: "key"}, {shiftBy: 0.5, mulSize: 0.5})
  }
}

function renderBlend(ref: SVGSVGElement, A: Spec, B: Spec, C: CompSpec) {

  const {field: axField} = A.encoding.x, {field: bxField} = B.encoding.x;

  if (C.direction === "vertical") {
    const size = getChartSize(1, 1, {})
    d3.select(ref)
      .attr(_width, size.width)
      .attr(_height, size.height)

    const g = d3.select(ref).append(_g)
      .attr(_transform, translate(CHART_MARGIN.left, CHART_MARGIN.top));

    const nestedAggVals = getAggValuesByTwoKeys(A.data.values, axField, bxField, A.encoding.y.field, A.encoding.x.aggregate)
    const nestedAggValsRev = getAggValuesByTwoKeys(A.data.values, bxField, axField, A.encoding.y.field, A.encoding.x.aggregate)
    const yDomain = nestedAggVals.map(d => d3.sum(d.values.map((_d: object) => _d["value"])))
    const xDomain = nestedAggVals.map(d => d.key)
    const {x, y} = renderAxes(g, xDomain, yDomain, A);
    const groups = uniqueValues(B.data.values, bxField)

    const yOffsetData = []
    // TODO: clear code below!
    for (let i = 0; i < xDomain.length; i++) {
      yOffsetData.push({key: xDomain[i], value: 0}) // TODO: init with zero might be improper?
    }
    for (let i = 0; i < nestedAggValsRev.length; i++) {
      if (i != 0) { // y offset not needed for the first class
        for (let j = 0; j < xDomain.length; j++) {
          let baseObject = nestedAggValsRev[i - 1].values.filter((_d: object) => _d["key"] === xDomain[j])[0];
          let baseValue = isUndefined(baseObject) ? 0 : baseObject["value"];
          yOffsetData.filter(d => d.key === xDomain[j])[0].value += baseValue
        }
      }
      const color = d3.scaleOrdinal()
        // const color
        // TODO: coloring by another key object
        .range(getBarColor(groups.length).slice(i, i + 1))
      renderBars(g, nestedAggValsRev[i].values, "value", "key", xDomain, x, y, {color, cKey: "key"}, {yOffsetData})
    }
  }
  else if (C.direction === "horizontal") {
    const GroupW = 90
    const nestedAggVals = getAggValuesByTwoKeys(A.data.values, axField, bxField, A.encoding.y.field, A.encoding.x.aggregate)
    const nestedAggValsRev = getAggValuesByTwoKeys(A.data.values, bxField, axField, A.encoding.y.field, A.encoding.x.aggregate)
    const xDomain = nestedAggValsRev.map(d => d.key);
    const yDomain = [].concat(...nestedAggVals.map(d => d.values.map((_d: object) => _d["value"])))  // TODO: clearer method?
    const groups = uniqueValues(B.data.values, bxField)

    const size = getChartSize(nestedAggVals.length, 1, {width: GroupW, noY: true})
    d3.select(ref)
      .attr(_width, size.width)
      .attr(_height, size.height)

    const g = d3.select(ref).append(_g)
      .attr(_transform, translate(CHART_MARGIN.left, CHART_MARGIN.top));

    for (let i = 0; i < nestedAggVals.length; i++) {
      const noY = i != 0 ? true : false // TOOD: need showY option for grouped bar chart (blend-horizontal)??
      const gPart = g.append(_g).attr(_transform, translate(
        (GroupW + GAP_BETWEEN_CHARTS + (!noY ? CHART_MARGIN.left + CHART_MARGIN.right : 0)) * i, 0)
      )

      const color = d3.scaleOrdinal()
        // const color
        // TODO: coloring by another key object
        .range(getBarColor(groups.length).slice(i, i + 1))
      const xPreStr = nestedAggVals[i].key;
      renderBarChart(gPart, A, {x: xDomain, y: yDomain}, color, {
        noY, xName: xPreStr, barGap: 1, width: GroupW,
        altVals: nestedAggVals[i].values
      })
    }
  }
}

// TOOD: any way to generalize this code by combining with stack?!
function renderOverlay(ref: SVGSVGElement, A: Spec, B: Spec, C: CompSpec) {
  const {...consistency} = getConsistencySpec(A, B, C);

  const size = getChartSize(1, 1, {})
  d3.select(ref)
    .attr(_height, size.height)
    .attr(_width, size.width)

  const {values: valsA} = A.data, {values: valsB} = B.data
  const {aggregate: funcA} = A.encoding.y, {aggregate: funcB} = B.encoding.y
  const aggValuesA = getAggValues(valsA, A.encoding.x.field, A.encoding.y.field, funcA)
  const aggValuesB = getAggValues(valsB, B.encoding.x.field, B.encoding.y.field, funcB)
  const groupsUnion = uniqueValues(aggValuesA.concat(aggValuesB), "key")
  const aggValuesUnion = aggValuesA.map(d => d.value).concat(aggValuesB.map(d => d.value))

  { /// B
    const g = d3.select(ref).append(_g)
      .attr(_transform, translate(CHART_MARGIN.left + 6, CHART_MARGIN.top))

    const groups = uniqueValues(valsB, B.encoding.x.field)
    const xDomain = consistency.x ? groupsUnion : groups
    const yDomain = consistency.y ? aggValuesB.map(d => d.value).concat(aggValuesA.map(d => d.value)) : aggValuesB.map(d => d.value)

    const isColorUsed = !isUndefined(B.encoding.color)
    const c = d3.scaleOrdinal()
      .domain(consistency.color ? groupsUnion : groups)
      .range(getBarColorDarker(consistency.color ? groupsUnion.length : isColorUsed ? groups.length : 1))

    const noY = consistency.y
    const noX = true
    const noGrid = true
    const revY = consistency.y_mirrored
    const revX = consistency.x_mirrored

    renderBarChart(g, B, {x: xDomain, y: yDomain}, c, {noX, noY, revY, revX, noGrid})
  }
  { /// A
    const g = d3.select(ref).append(_g)
      .attr(_transform, translate(CHART_MARGIN.left, CHART_MARGIN.top))

    const groups = uniqueValues(valsA, A.encoding.x.field)
    const xDomain = consistency.x ? groupsUnion : groups
    const yDomain = consistency.y ? aggValuesUnion : aggValuesA.map(d => d.value)

    const isColorUsed = !isUndefined(A.encoding.color)
    const c = d3.scaleOrdinal()
      .domain(consistency.color ? groupsUnion : groups)
      .range(getBarColor(consistency.color ? groupsUnion.length : isColorUsed ? groups.length : 1))

    renderBarChart(g, A, {x: xDomain, y: yDomain}, c, {})
  }
}

// TOOD: any way to generalize this code by combining with stack?!
function renderNest(ref: SVGSVGElement, A: Spec, B: Spec, C: CompSpec) {
  const {...consistency} = getConsistencySpec(A, B, C);

  const size = getChartSize(1, 1, {})
  d3.select(ref)
    .attr(_height, size.height)
    .attr(_width, size.width)

  const {values: valsA} = A.data, {values: valsB} = B.data
  const {aggregate: funcA} = A.encoding.y, {aggregate: funcB} = B.encoding.y
  const aggValuesA = getAggValues(valsA, A.encoding.x.field, A.encoding.y.field, funcA)
  const aggValuesB = getAggValues(valsB, B.encoding.x.field, B.encoding.y.field, funcB)
  const groupsUnion = uniqueValues(aggValuesA.concat(aggValuesB), "key")
  const aggValuesUnion = aggValuesA.map(d => d.value).concat(aggValuesB.map(d => d.value))

  { /// A
    const g = d3.select(ref).append(_g)
      .attr(_transform, translate(CHART_MARGIN.left, CHART_MARGIN.top))

    const groups = uniqueValues(valsA, A.encoding.x.field)
    const xDomain = consistency.x ? groupsUnion : groups
    const yDomain = consistency.y ? aggValuesUnion : aggValuesA.map(d => d.value)

    // const isColorUsed = !isUndefined(A.encoding.color)
    const c = d3.scaleOrdinal()
      .domain(consistency.color ? groupsUnion : groups)
      .range(getBarColor(1))
    // .range(getBarColor(consistency.color ? groupsUnion.length : isColorUsed ? groups.length : 1))

    const {designs} = renderBarChart(g, A, {x: xDomain, y: yDomain}, c, {})

    { /// B
      const g = d3.select(ref).append(_g)
        .attr(_transform, translate(CHART_MARGIN.left + 0, CHART_MARGIN.top))

      const {field: axField} = A.encoding.x, {field: bxField} = B.encoding.x;
      const nestedAggVals = getAggValuesByTwoKeys(A.data.values, axField, bxField, A.encoding.y.field, A.encoding.x.aggregate)
      // const nestedAggValsRev = getAggValuesByTwoKeys(A.data.values, bxField, axField, A.encoding.y.field, A.encoding.x.aggregate)
      const padding = 4//, margin = 4
      const chartWidth = designs["barWidth"], x = designs["x"], y = designs["y"], bandUnitSize = designs["bandUnitSize"]
      const innerChartWidth = chartWidth - padding * 2.0

      for (let i = 0; i < nestedAggVals.length; i++) {
        const chartHeight = CHART_SIZE.height - y(aggValuesA[i].value) - padding

        const tg = g.append(_g)
          .attr(_transform,
            translate(x(nestedAggVals[i].key) - chartWidth / 2.0 + bandUnitSize / 2.0 + padding, y(aggValuesA[i].value) + padding));

        // background color
        // tg.append(_rect)
        //   .attr(_x, 0)
        //   .attr(_y, 0)
        //   .attr(_width, chartWidth - padding * 2.0)
        //   .attr(_height, chartHeight)
        // .attr(_fill, "#FAFAFA")

        const ttg = tg.append(_g)
          .attr(_transform, translate(0, 0))

        const groups = uniqueValues(valsB, B.encoding.x.field)
        const xDomain = groups
        const yDomain = nestedAggVals[i].values.map((d: object) => d["value"])

        const isColorUsed = !isUndefined(B.encoding.color)
        const c = d3.scaleOrdinal()
          // .domain(consistency.color ? groupsUnion : groups)
          // .range(["white"])
          .range(getBarColor(consistency.color ? groupsUnion.length : isColorUsed ? groups.length : 1))

        const noY = true
        const noX = true
        const noGrid = true

        if (C.direction === "horizontal") {
          const barGap = 0

          renderBarChart(ttg, B, {x: xDomain, y: yDomain}, c, {
            noX, noY, noGrid, barGap, width: innerChartWidth, height: chartHeight,
            altVals: nestedAggVals[i].values
          })
        }
        else {  // C.direction === "vertical"

        }
      }
    }
  }
}

export function getConsistencySpec(A: Spec, B: Spec, C: CompSpec) {
  const cons = {
    x: (isDeepTrue(C.consistency.x) &&
      // A.encoding.x.field === B.encoding.x.field && // TOOD: should I constraint this?
      A.encoding.x.type === B.encoding.x.type),
    x_mirrored: typeof C.consistency.x != 'undefined' && C.consistency.x['mirrored'],
    y: (isDeepTrue(C.consistency.y) &&
      // A.encoding.y.field === B.encoding.y.field &&
      A.encoding.y.type === B.encoding.y.type),
    y_mirrored: typeof C.consistency.y != 'undefined' && C.consistency.y['mirrored'],
    color: !isUndefinedOrFalse(C.consistency.color)
  };
  // warnings
  if (cons.y != isDeepTrue(C.consistency.y)) console.log('y-axis cannot be shared.')
  if (cons.x != isDeepTrue(C.consistency.x)) console.log('x-axis cannot be shared.')

  return cons
}