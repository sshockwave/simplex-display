import { InlinePopper } from "../popper.js";
import { Equation, var_to_math } from "../equation.js";
import { useState } from 'react';

export function ModifiableTerm({ coef, var_to_id, var_name, var_id, is_first, row_idx }) {
  if (coef.is_zero()) {
    return null;
  }
  coef = coef.to_coef_katex(is_first);
  const [sub_is_valid, set_sub_is_valid] = useState(false);
  return <InlinePopper content={() => <div className='pt-2 pb-1 ps-2 d-flex flex-row'>
    <form className={'has-validation me-2 input-group'} onSubmit={e => e.preventDefault()}>
      <span class="input-group-text">
        <Equation>{var_to_math(var_name) + '='}</Equation>
      </span>
      <input
        type='text'
        className={`form-control is-${sub_is_valid ? 'valid' : 'invalid'}`}
        onInput={(ev) => {
          const val = ev.target.value;
        }}
      />
      <button
        type='submit'
        className={`btn ${sub_is_valid ? 'btn-success' : 'disabled btn-danger'}`}
      ><span class='material-icon'>check_circle</span></button>
      <div class='invalid-feedback'></div>
    </form>
  </div>}>
    <Equation>{`${coef}${var_to_math(var_name)}`}</Equation>
  </InlinePopper>;
}
