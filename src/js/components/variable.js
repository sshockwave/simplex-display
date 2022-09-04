import { InlinePopper } from "../popper.js";
import { Equation, var_to_math } from "../equation.js";
import { useState } from 'react';
import Fraction from "../fraction.js";

function parse_linear_expr(str) {
  const terms = [];
  if (str.charAt(0) !== '-') {
    str = '+' + str;
  }
  for (
    let m;
    m = str.match(/^([+-]\d*(?:\d[.\/]\d+)?)\*?([a-zA-Z]+\d*'*)?(?=\+|-|$)/), m && m[0] != '';
    str = str.substring(m[0].length)
  ) {
    let coef = m[1], var_name = m[2];
    if (coef === '+') {
      coef = Fraction.from_num(1);
    } else if (coef === '-') {
      coef = Fraction.from_num(-1);
    } else {
      if (coef.charAt(0) === '+') {
        coef = coef.substring(1);
      }
      coef = Fraction.from_str(coef);
      if (coef.is_zero()) {
        throw 'Coefficient of variables can\'t be zero';
      }
    }
    if (!var_name) {
      var_name = null;
    }
    terms.push({ up: coef.up, dn: coef.dn, var_name });
  }
  if (str != '') {
    throw 'Unrecognized expression: ' + str;
  }
  return terms;
}

export function ModifiableTerm({ coef, var_to_id, var_name, var_id, is_first, row_idx, onTransform }) {
  if (coef.is_zero()) {
    return null;
  }
  coef = coef.to_coef_katex(is_first);
  const [sub_is_valid, set_sub_is_valid] = useState(false);
  const [parsed, set_parsed] = useState([]);
  return <InlinePopper content={(dismiss) => <div className='pt-2 pb-2 ps-2 d-flex flex-row'>
    <form className={'has-validation me-2 input-group'} onSubmit={e => {
      e.preventDefault();
      if (!sub_is_valid) {
        return;
      }
      dismiss();
      onTransform({
        type: 'insert',
        action: 'SubstituteVariable',
        var_id,
        expr: parsed,
      });
    }}>
      <span className="input-group-text">
        <Equation>{var_to_math(var_name) + '='}</Equation>
      </span>
      <input
        type='text'
        className={`form-control is-${sub_is_valid ? 'valid' : 'invalid'}`}
        onInput={(ev) => {
          const val = ev.target.value;
          try {
            const terms = parse_linear_expr(val);
            if (terms.length > 2) {
              throw 'At most two terms';
            }
            let cnt = 0;
            for (const t of terms) {
              if (t.var_name !== null) {
                cnt += 1;
                if (Object.hasOwn(var_to_id, t.var_name)) {
                  throw 'Variable name exists';
                }
              }
            }
            if (cnt === 0) {
              throw 'At least one variable';
            }
            set_parsed(terms);
            set_sub_is_valid(true);
          } catch (e) {
            set_sub_is_valid(false);
          }
        }}
      />
      <button
        type='submit'
        className={`btn ${sub_is_valid ? 'btn-success' : 'disabled btn-danger'}`}
      ><span className='material-icon'>check_circle</span></button>
      <div className='invalid-feedback'></div>
    </form>
  </div>}>
    <span className='is-text-link'>
      <Equation>{`${coef}${var_to_math(var_name)}`}</Equation>
    </span>
  </InlinePopper>;
}
