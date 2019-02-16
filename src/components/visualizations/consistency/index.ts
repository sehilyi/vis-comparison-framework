import {Spec} from "src/models/simple-vega-spec";
import {Consistency, _CompSpecSolid, DEFAULT_CONSISTENCY} from "src/models/comp-spec";
import {isDeepTrue, ifUndefinedGetDefault} from "src/useful-factory/utils";
import {deepValue} from "src/models/comp-spec-manager";

export function correctConsistency(A: Spec, B: Spec, C: _CompSpecSolid): Consistency {
  let color: boolean
  if (!C.consistency.color) {
    color = false
  }
  // nominal color can be consistently used with quantitative color
  else if (A.encoding.color && B.encoding.color && A.encoding.color.type != B.encoding.color.type) {
    color = false
  }
  else {
    color = true
  }

  const cons = {
    x_axis: (isDeepTrue(C.consistency.x_axis) &&
      A.encoding.x.type === B.encoding.x.type) ||
      (deepValue(C.layout) === "juxtaposition" && C.layout.unit === "element"), // always true for element-wise jux
    y_axis: (isDeepTrue(C.consistency.y_axis) &&
      A.encoding.y.type === B.encoding.y.type) ||
      (deepValue(C.layout) === "juxtaposition" && C.layout.unit === "element"), // always true for element-wise jux
    color,
    stroke: ifUndefinedGetDefault(C.consistency.stroke, DEFAULT_CONSISTENCY.stroke)
  };
  // warnings
  if (cons.y_axis != isDeepTrue(C.consistency.y_axis)) console.log('consistency.y has been changed to ' + cons.y_axis)
  if (cons.x_axis != isDeepTrue(C.consistency.x_axis)) console.log('consistency.x has been changed to ' + cons.x_axis)

  return cons
}