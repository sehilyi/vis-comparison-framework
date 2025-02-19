import {Spec} from "src/models/simple-vega-spec";
import {_CompSpecSolid} from "src/models/comp-spec";
import {isEEChart, isBothBarChart, isBothHeatmap, isHeatmap, isBarChart, isScatterplot, isBothScatterplot, isBothAggregatedScatterplot} from "src/models/chart-types";
import {getAggValues, getPivotData, getNQofXY, getFilteredData} from ".";
import {isNullOrUndefined} from "util";
import {_y} from "src/useful-factory/d3-str";

// TODO: this should contain id field
export function getChartData(A: Spec, B?: Spec, C?: _CompSpecSolid, domains?: string[][]) {

  const specs = {A, B};
  let aData: object[] = undefined, bData: object[] = undefined;
  let chartdata = {A: aData, B: bData};

  /* common part */
  ["A", "B"].forEach(AorB => {
    if (!B && AorB === "B") return;

    const spec: Spec = specs[AorB];
    const filteredData = getFilteredData(spec);
    const {field: xField, aggregate: xAggregate} = spec.encoding.x;
    const {field: yField, aggregate: yAggregate} = spec.encoding.y;

    if (isHeatmap(spec)) {
      const {field: cField, aggregate: cAggregate} = spec.encoding.color;

      // TODO: when xField and yField same
      chartdata[AorB] = getPivotData(filteredData, [xField, yField], cField, cAggregate, domains);
      // console.log(chartdata[AorB]);
    }
    else if (isBarChart(spec)) {
      const {N, Q} = getNQofXY(spec);
      const verticalBar = Q === _y;
      const qAggregate = verticalBar ? yAggregate : xAggregate;
      const {field: nField} = spec.encoding[N], {field: qField} = spec.encoding[Q];

      chartdata[AorB] = getAggValues(filteredData, nField, [qField], qAggregate);
      // console.log(chartdata[AorB]);
    }
    else if (isScatterplot(spec)) {
      // do not consider different aggregation functions for x and y for the simplicity
      chartdata[AorB] = xAggregate ? getAggValues(filteredData, spec.encoding.color.field, [xField, yField], xAggregate) : filteredData;
    }
  });

  if (!C) return chartdata;

  /* explicit-encoding chart */
  if (isEEChart(C)) {
    if (isBothBarChart(A, B)) {
      let data: object[] = [];

      const {N: AN, Q: AQ} = getNQofXY(A);
      const {field: anKey} = A.encoding[AN], {field: aqKey} = A.encoding[AQ];

      const {N: BN, Q: BQ} = getNQofXY(B);
      const {field: bnKey} = B.encoding[BN], {field: bqKey} = B.encoding[BQ];

      // combine
      chartdata.A.forEach(aav => {
        const newValue = {};
        // based on A's keys
        // TODO: if x and y are different?
        // TODO: determine field name!
        newValue[anKey] = aav[anKey];
        newValue[aqKey] = Math.abs(aav[aqKey] - chartdata.B.find((d: any) => d[bnKey] === aav[anKey])[bqKey]);
        data.push(newValue);
      });

      chartdata.A = data;
    }
    else if (isBothHeatmap(A, B)) {
      let data: object[] = [];

      const axField = A.encoding.x.field, ayField = A.encoding.y.field, acolorField = A.encoding.color.field;
      const bxField = B.encoding.x.field, byField = B.encoding.y.field, bcolorField = B.encoding.color.field;

      // TODO: if x and y are different?
      // TODO: determine field name!
      chartdata.A.forEach(v => {
        const axVal = v[axField], ayVal = v[ayField];
        let newObject = {};
        newObject[axField] = axVal;
        newObject[ayField] = ayVal;
        newObject[acolorField] = v[acolorField] - chartdata.B.find((d: any) => d[bxField] === axVal && d[byField] === ayVal)[bcolorField];
        if (isNullOrUndefined(v[acolorField]) && isNullOrUndefined(chartdata.B.find((d: any) => d[bxField] === axVal && d[byField] === ayVal)[bcolorField]))
          newObject[acolorField] = undefined;
        data.push(newObject);
      });

      chartdata.A = data;
    }
    else if (isBothScatterplot(A, B)) {
      if (isBothAggregatedScatterplot(A, B)) {
        let data: object[] = [];

        const axField = A.encoding.x.field, ayField = A.encoding.y.field, acolorField = A.encoding.color.field;
        const bxField = B.encoding.x.field, byField = B.encoding.y.field, bcolorField = B.encoding.color.field;

        // combine
        chartdata.A.forEach(aav => {
          const newValue = {};
          // TODO: if A's color and B's color are different?
          // TODO: determine field name!
          newValue[acolorField] = aav[acolorField];
          newValue[axField] = aav[axField] - chartdata.B.find((d: any) => d[bcolorField] === aav[acolorField])[bxField];
          newValue[ayField] = aav[ayField] - chartdata.B.find((d: any) => d[bcolorField] === aav[acolorField])[byField];
          data.push(newValue);
        });

        chartdata.A = data;
      }
      else {
        let data: object[] = [];

        const axField = A.encoding.x.field, ayField = A.encoding.y.field;
        const bxField = B.encoding.x.field, byField = B.encoding.y.field;
        const acolorField = A.encoding.color ? A.encoding.color.field : undefined;  // in EEChart, always consider the A chart and ignore the B

        // combine
        let cnt = 0;  // TODO: not accurate
        chartdata.A.forEach(aav => {
          const newValue = {};
          // TODO: if A's color and B's color are different?
          // TODO: determine field name!
          if (acolorField) {
            newValue[acolorField] = aav[acolorField];
          }
          newValue[axField] = aav[axField] - chartdata.B[cnt][bxField];
          newValue[ayField] = aav[ayField] - chartdata.B[cnt][byField];
          data.push(newValue);
          cnt++;
        });

        chartdata.A = data;
      }
    }
  }

  return chartdata;
}