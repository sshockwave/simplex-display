import { InlinePopper } from "../popper.js";
import { Equation, var_to_math } from "../equation.js";

export function ModifiableTerm({ coef, var_to_id, var_name, var_id, is_first, row_idx }) {
  if (coef.is_zero()) {
    return null;
  }
  coef = coef.to_coef_katex(is_first);
  return <InlinePopper content={() => <div>
    Pop
  </div>}>
    <Equation>{`${coef}${var_to_math(var_name)}`}</Equation>
  </InlinePopper>;
}
