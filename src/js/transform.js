import { splice, clone } from "./utils.js";
import Fraction from './fraction.js';
import { Equation, var_to_math } from "./equation.js";

export function MultiplyTransform({ up, dn, row_idx }) {
  const factor = Fraction.from_frac(up, dn);
  return {
    run(table) {
      const row = table.rows[row_idx];
      table = table.shallow_clone();
      let { rel } = row;
      if (factor.neg()) {
        if (rel === '\\le') {
          rel = '\\ge';
        } else if (rel === '\\ge') {
          rel = '\\le';
        }
      }
      table.rows = splice(table.rows, row_idx, 1, {
        coef: row.coef.map(x => x.neg()),
        rel,
        p0: row.p0.neg(),
        base_id: -1,
      });
      return table;
    },
    render() {
      let r = row_idx + 1;
      return <Equation>{`(${r})'=${factor.to_coef_katex(true)}(${r})`}</Equation>;
    },
  }
}

function add_var(table, var_name) {
  const var_id = table.id_to_var.length;
  table.var_to_id = clone(table.var_to_id);
  table.var_to_id[var_name] = var_id;
  table.id_to_var = splice(table.id_to_var, var_id, 0, var_name);
  table.rows = table.rows.map(row => {
    row = clone(row);
    row.coef = splice(row.coef, var_id, 0, Fraction.zero);
    return row;
  });
  table.original_target_coef = splice(table.original_target_coef, var_id, 0, Fraction.zero);
  table.target_coef = splice(table.target_coef, var_id, 0, Fraction.zero);
  return var_id;
}

export function RelaxRow({ var_name, row_idx }) {
  return {
    run(table) {
      table = table.shallow_clone();
      const var_id = add_var(table, var_name);
      const row = table.rows[row_idx];
      let val = 1;
      if (row.rel === '=') {
        if (row.p0.is_neg()) {
          val = -1;
        }
      } else if (row.rel === '\\ge') {
        if (row.p0.is_pos()) {
          throw 'Greater than relations cannot be relaxed with positive values';
        }
        val = -1;
      } else if (row.rel === '\\le') {
        if (row.p0.is_neg()) {
          throw 'Less than relations cannot be relaxed with negative values';
        }
      } else {
        throw 'Unrecognized relation type';
      }
      row.coef = splice(row.coef, var_id, 0, Fraction.from_num(val));
      row.rel = '=';
      row.base_id = var_id;
      console.log(table);
      return table;
    },
    render() {
      return <>
        {'Relax '}
        <Equation>{`(${row_idx + 1})`}</Equation>
        {' with '}
        <Equation>{var_to_math(var_name)}</Equation>
      </>;
    },
  };
}

export function SubstituteVariable({ expr, var_id }) {
  return {
    run() {
      throw 'Not Implemented';
    },
    render(table) {
      let var_name = table.id_to_var[var_id];
      if (var_name && table.var_to_id[var_name] === var_id) { // check alive
        var_name = var_to_math(var_name);
      } else {
        var_name = '\\text{?}';
      }
      let first = true;
      return <>
        <Equation>{var_name + '\\to' + expr.map(e => {
          const val = Fraction.from_frac(e.up, e.dn).to_coef_katex(first);
          first = false;
          return val + var_to_math(e.var_name);
        })}</Equation>
      </>;
    },
  }
}
