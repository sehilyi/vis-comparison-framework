import * as d3 from 'd3';
import {Spec} from "src/models/simple-vega-spec";
import {renderAxes} from "../axes";
import {translate} from "src/useful-factory/utils";
import {_transform, _opacity, _g, _rect, _fill, _x, _y, _width, _height, _white, ScaleOrdinal, ScaleLinearColor, ScaleBand, GSelection, _stroke, _stroke_width, _path, _d} from 'src/useful-factory/d3-str';
import {getQuantitativeColorStr, CHART_CLASS_ID, appendPattern, Coordinate} from '../default-design-manager';
import {getLayouts} from '../chart-styles/layout-manager';
import {ChartStyle} from '../chart-styles';
import {getDomain, AxisDomainData} from '../data-handler/domain-manager';
import {isNullOrUndefined} from 'util';
import {DF_DELAY, DF_DURATION} from '../animated/default-design';
import {getChartData} from '../data-handler/chart-data-manager';
import {getLegends} from '../legends/legend-manager';
import {renderLegend} from '../legends';
import {getStyles} from '../chart-styles/style-manager';

export function renderSimpleHeatmap(ref: SVGSVGElement, spec: Spec) {
  // all {}.B are set to undefined
  const {...chartdata} = getChartData(spec);
  const {...domains} = getDomain(spec, undefined, undefined, chartdata);
  const {...styles} = getStyles(spec, undefined, undefined, domains);
  const {...layouts} = getLayouts(spec, undefined, undefined, domains, styles);
  const {...legends} = getLegends(spec, undefined, undefined, layouts, styles);

  // TODO:
  styles.A.altVals = getChartData(spec).A;
  //

  domains.A.axis = domains.A.axis as AxisDomainData;

  d3.select(ref).selectAll('*').remove();
  const svg = d3.select(ref).attr(_width, layouts.width).attr(_height, layouts.height);
  renderHeatmap(svg, spec, {x: domains.A.axis.x, y: domains.A.axis.y}, d3.scaleLinear<string>().domain(d3.extent(domains.A.axis.color as number[])).range(getQuantitativeColorStr()), styles.A);

  legends.recipe.forEach(legend => {
    const legendG = svg.append(_g).attr(_transform, translate(legend.left, legend.top));
    renderLegend(legendG, legend.title, legend.scale.domain() as string[], legend.scale.range() as string[], !legend.isNominal, legend.styles);
  });
}

export function renderHeatmap(
  svg: GSelection,
  spec: Spec,
  domain: {x: string[] | number[], y: string[] | number[]},
  color: ScaleOrdinal | ScaleLinearColor,
  styles: ChartStyle) {

  const {x, y} = renderAxes(svg, domain.x, domain.y, spec, {...styles});
  const {field: xKey} = spec.encoding.x, {field: yKey} = spec.encoding.y, {field: cKey} = spec.encoding.color;
  const g: GSelection = styles.elementAnimated ?
    svg.select(`${"."}${CHART_CLASS_ID}${"A"}`) :
    svg.append(_g).attr(_transform, translate(styles.translateX, styles.translateY)).attr(_opacity, styles.opacity).classed(`${CHART_CLASS_ID}${styles.chartId} ${styles.chartId}`, true);

  let visualReciepe = renderCells(g, styles.altVals, {xKey, yKey, cKey}, {x: x as ScaleBand, y: y as ScaleBand, color}, {...styles});
  return visualReciepe.map(function (d) {return {...d, x: d.x + styles.translateX, y: d.y + styles.translateY}});
}

export function renderCells(
  g: GSelection,
  data: object[],
  keys: {xKey: string, yKey: string, cKey: string},
  scales: {x: ScaleBand, y: ScaleBand, color: ScaleOrdinal | ScaleLinearColor},
  styles: ChartStyle) {

  const {
    width,
    height,
  } = styles;

  if (height < 0 || width < 0) return []; // when height or width of nesting root is too small
  const {
    elementAnimated: animated,
    strokeKey: sKey,
    stroke_width: strokeWidth,
    triangularCell: triangleCell
  } = styles;

  let coordinates: Coordinate[] = [];
  const _X = "X", _Y = "Y", _C = "C";
  const _S = !sKey || sKey === keys.xKey ? _X : sKey === keys.yKey ? _Y : _C; // for stroke color
  let dataCommonShape = data.map(d => ({X: d[keys.xKey], Y: d[keys.yKey], C: d[keys.cKey]}));

  const numOfX = scales.x.domain().length, numOfY = scales.y.domain().length;
  const cellWidth = (width / numOfX - styles.cellPadding * 2) * styles.widthTimes - strokeWidth * 2;
  const cellHeight = (height / numOfY - styles.cellPadding * 2) * styles.heightTimes - strokeWidth * 2;

  const oldCells = g.selectAll('.cell')
    .data(dataCommonShape);

  oldCells
    .exit()
    .attr(_opacity, 1)
    .transition().delay(animated ? DF_DELAY : 0).duration(animated ? DF_DURATION : 0)
    .attr(_opacity, 0)
    .remove();

  const newCells = oldCells.enter().append(triangleCell === "none" ? _rect : _path)
    .classed('cell', true);

  const allCells = newCells.merge(oldCells as any);

  allCells
    .transition().delay(animated ? DF_DELAY : 0).duration(animated ? DF_DURATION : 0)
    .attr(_stroke, d => (styles.stroke as ScaleOrdinal)(d[_S]) as string)
    .attr(_stroke_width, styles.stroke_width)
    .attr(_fill, function (d) {
      // d[cKey] can be either null or undefined
      const colorStr = isNullOrUndefined(d[_C]) ? styles.nullCellFill : (scales.color as ScaleLinearColor)(d[_C]);
      if (!styles.texture) {
        return colorStr;
      }
      else {
        const textureId = isNullOrUndefined(d[_C]) ? "null" : `${d[_C]}`;
        return appendPattern(g, textureId, colorStr);
      }
    });

  // shape
  if (triangleCell === "top") {
    allCells
      .attr(_d, function (d) {
        const x = scales.x(d[_X]) + styles.cellPadding + (cellWidth) * styles.shiftX + strokeWidth;
        const y = scales.y(d[_Y]) + styles.cellPadding + (cellHeight) * styles.shiftY + strokeWidth;
        return "M " + x + " " + y + " L " + (x + cellWidth) + " " + y + " L " + (x + cellWidth) + " " + (y + cellHeight) + " Z";
      });
  }
  else if (triangleCell === "bottom") {
    allCells
      .attr(_d, function (d) {
        const x = scales.x(d[_X]) + styles.cellPadding + (cellWidth) * styles.shiftX + strokeWidth;
        const y = scales.y(d[_Y]) + styles.cellPadding + (cellHeight) * styles.shiftY + strokeWidth;
        return "M " + x + " " + y + " L " + x + " " + (y + cellHeight) + " L " + (x + cellWidth) + " " + (y + cellHeight) + " Z";
      });
  }
  else {
    allCells
      .attr(_x, function (d) {
        const x = scales.x(d[_X]) + styles.cellPadding + (cellWidth) * styles.shiftX + strokeWidth;
        return x;
      })
      .attr(_y, function (d) {
        const y = scales.y(d[_Y]) + styles.cellPadding + (cellHeight) * styles.shiftY + strokeWidth;
        return y;
      })
      .attr(_width, cellWidth)
      .attr(_height, cellHeight);
  }

  // TODO: redundant with upper part!
  dataCommonShape.forEach(d => {
    coordinates.push({
      id: null,
      x: scales.x(d[_X]) + styles.cellPadding + (cellWidth) * styles.shiftX + strokeWidth + (isNullOrUndefined(d[_C]) ? 0 : styles.jitter_x * 1),
      y: scales.y(d[_Y]) + styles.cellPadding + (cellHeight) * styles.shiftY + strokeWidth + (isNullOrUndefined(d[_C]) ? 0 : styles.jitter_y * 1),
      width: cellWidth,
      height: cellHeight
    });
  });
  return coordinates;
}