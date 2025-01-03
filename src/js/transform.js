import { splice, clone } from "./utils.js";
import Fraction from './fraction.js';
import { Equation, var_to_math } from "./components/equation.js";
import assert from 'assert';

function swap_le_ge(x) {
  if (x === '\\le') {
    return '\\ge';
  }
  if (x === '\\ge') {
    return '\\le';
  }
  if (x === '=') {
    return '=';
  }
  assert(false);
}

export function can_run(table, trans, data) {
  try {
    trans(data).run(table);
    return true;
  } catch (e) {
    return false;
  }
}

export function ToggleTargetMinMax() {
  return {
    run(table) {
      table = table.shallow_clone();
      table.target_is_max = !table.target_is_max;
      table.target_coef = table.target_coef.map(x => x.neg());
      table.target_p0 = table.target_p0.neg();
      return table;
    },
    render() {
      return <>Toggle min / max</>;
    },
  }
}

export function MultiplyTransform({ up, dn, row_idx }) {
  const factor = Fraction.from_frac(up, dn);
  return {
    run(table) {
      const row = table.rows[row_idx];
      table = table.shallow_clone();
      let { rel } = row;
      if (factor.neg()) {
        rel = swap_le_ge(rel);
      }
      table.rows = splice(table.rows, row_idx, 1, {
        coef: row.coef.map(x => x.neg()),
        rel,
        p0: row.p0.neg(),
        base_id: row.base_id,
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
  if (table.is_name_in_use(var_name)) {
    throw `Name ${var_name} is already in use`;
  }
  const var_id = table.id_to_var.length;
  table.var_to_id = clone(table.var_to_id);
  table.var_to_id[var_name] = var_id;
  table.id_to_var = splice(table.id_to_var, var_id, 0, var_name);
  table.rows = table.rows.map(row => {
    row = clone(row);
    row.coef = splice(row.coef, var_id, 0, Fraction.zero);
    return row;
  });
  table.target_coef = splice(table.target_coef, var_id, 0, Fraction.zero);
  return var_id;
}

export function RelaxRow({ var_name, row_idx }) {
  return {
    run(table) {
      table = table.shallow_clone();
      const var_id = add_var(table, var_name);
      const row = table.rows[row_idx];
      if (row.rel !== '\\le') {
        throw 'Only less than relations can be relaxed';
      }
      row.coef[var_id] = Fraction.one;
      row.rel = '=';
      if (!row.p0.is_neg()) {
        row.base_id = var_id;
      }
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

export function ArtificialVar({ var_name, row_idx }) {
  return {
    run(table) {
      table = table.shallow_clone();
      const var_id = add_var(table, var_name);
      const row = table.rows[row_idx];
      if (row.rel !== '=') {
        throw 'Only equations can add artificial variables';
      }
      row.coef[var_id] = Fraction.one;
      if (row.p0.is_neg()) {
        row.coef[var_id] = row.coef[var_id].neg();
      }
      if (table.target_is_max) {
        table.target_coef[var_id] = Fraction.big_m.neg();
      } else {
        table.target_coef[var_id] = Fraction.big_m;
      }
      row.base_id = var_id;
      return table;
    },
    render() {
      return <>
        {'AVar '}
        <Equation>{`(${row_idx + 1})`}</Equation>
        {' with '}
        <Equation>{var_to_math(var_name)}</Equation>
      </>;
    },
  };
}

export function SubstituteVariable({ expr, var_id }) {
  return {
    run(table) {
      if (expr.length > 2) {
        throw 'Substitution with more than two variables is not supported';
      }
      table = table.deep_clone();
      if (!table.is_id_alive(var_id)) {
        throw 'Variable does not exist';
      }
      delete table.var_to_id[table.id_to_var[var_id]];
      for (const row of table.rows) {
        if (row.base_id === var_id) {
          throw 'This variable is used as base';
        }
      }
      let cnt = 0;
      let const_term_sum = Fraction.zero;
      for (const e of expr) {
        const e_coef = Fraction.from_frac(e.up, e.dn);
        if (e.var_name !== null) {
          cnt += 1;
          if (table.is_name_in_use(e.var_name)) {
            throw `Variable name ${e.var_name} is already used.`;
          }
          const e_id = table.id_to_var.length;
          table.var_to_id[e.var_name] = e_id;
          table.id_to_var.push(e.var_name);
          for (const row of table.rows) {
            row.coef.push(row.coef[var_id].mul(e_coef));
          }
          table.target_coef.push(table.target_coef[var_id].mul(e_coef));
        } else {
          for (const row of table.rows) {
            row.p0 = row.p0.sub(row.coef[var_id].mul(e_coef));
          }
          table.target_p0 = table.target_p0.add(table.target_coef[var_id].mul(e_coef));
          const_term_sum = const_term_sum.add(e_coef);
        }
      }
      if (cnt === 0) {
        throw 'At least one free variable is required';
      }
      let constraint = {
        id: var_id,
        rel: '\\ge',
        val: Fraction.zero,
      };
      for (const [i, t] of table.var_non_std.entries()) {
        if (t.id === var_id) {
          constraint = t;
          table.var_non_std.splice(i, 1);
          break;
        }
      }
      if (constraint.rel === 'any') {
        if (cnt === 1) {
          table.var_non_std.push({
            id: table.id_to_var.length - 1,
            rel: 'any',
          });
        } else {
          assert(cnt === 2);
          if ((expr[0].up < 0) == (expr[1].up < 0)) {
            throw 'Two variables must have different signs';
          }
          // No constraint on variables
        }
      } else {
        if (cnt === 2) {
          throw 'Substituting le / ge constraints with two variables is not supported';
        }
        assert(cnt === 1);
        let { rel } = constraint;
        let e = null;
        for (const tmp_e of expr) {
          if (tmp_e.var_name !== null) {
            e = tmp_e;
            break
          }
        }
        assert(e !== null);
        const lhs = Fraction.from_frac(e.up, e.dn);
        const rhs = constraint.val.sub(const_term_sum).div(lhs);
        if (lhs.is_neg()) {
          rel = swap_le_ge(rel);
        }
        const new_constraint = {
          id: table.var_to_id[e.var_name],
          rel,
          val: rhs,
        };
        if (rel === '\\ge' && rhs.is_zero()) {
          // Standard constraint
        } else {
          table.var_non_std.push(new_constraint);
        }
      }
      return table;
    },
    render(table) {
      let var_name;
      if (table.is_id_alive(var_id)) {
        var_name = var_to_math(table.id_to_var[var_id]);
      } else {
        var_name = '\\text{?}';
      }
      let first = true;
      return <>
        <Equation>{var_name + '\\to' + expr.map(e => {
          let val = Fraction.from_frac(e.up, e.dn);
          if (e.var_name === null) {
            val = val.to_katex(first);
          } else {
            val = val.to_coef_katex(first) + var_to_math(e.var_name);
          }
          first = false;
          return val;
        }).join('')}</Equation>
      </>;
    },
  }
}

export function DisplayInTable() {
  return {
    run(table) {
      if (table.display_table) {
        return table;
      }
      if (!table.can_display_in_table()) {
        throw 'Cannot be displayed in table currently';
      }
      table = table.shallow_clone();
      table.original_target_coef = table.target_coef;
      table.target_coef = table.target_coef.slice()
      for (let r of table.rows) {
        if (r.base_id !== -1 && !table.target_coef[r.base_id].is_zero()) {
          let tr_coef = table.target_coef[r.base_id].div(r.coef[r.base_id]);
          for (let i = 0; i < table.target_coef.length; i++) {
            table.target_coef[i] = table.target_coef[i].sub(r.coef[i].mul(tr_coef));
          }
          table.target_p0 = table.target_p0.add(r.p0.mul(tr_coef));
          if (!table.target_coef[r.base_id].is_zero()) {
            throw "Assertion error: coef should have been cleared.";
          }
        }
      }
      table.display_table = true;
      return table;
    },
    render() {
      return 'Show Table';
    },
  }
}

export function Pivot({ row_idx, var_id }) {
  return {
    run(table) {
      table = table.shallow_clone();
      if (row_idx >= table.rows.length) {
        throw 'Not enough rows';
      }
      const row_before = table.rows[row_idx];
      if (!table.is_id_alive(var_id)) {
        throw 'Cannot find variable';
      }
      if (row_before.base_id === var_id) {
        throw 'The target variable is already a base.';
      }
      const dn = row_before.coef[var_id];
      if (dn.is_pos() !== row_before.coef[row_before.base_id].is_pos()) {
        throw 'This position is unbounded';
      }
      const beta = row_before.p0.div(dn);
      table.rows = table.rows.map((row, cur_idx) => {
        if (row.coef[var_id].is_pos() === row.coef[row.base_id].is_pos()) {
          let div_result = row.p0.div(row.coef[var_id]);
          if (div_result.sub(beta).is_neg()) {
            throw 'The beta of this base is not minimal.';
          }
        }
        if (cur_idx === row_idx) {
          const coef = row.coef[var_id];
          return {
            coef: row.coef.map((v) => v.div(coef)),
            rel: row.rel,
            p0: row.p0.div(coef),
            base_id: var_id,
          };
        } else {
          row = clone(row);
          const coef = row.coef[var_id].div(row_before.coef[var_id]);
          row.coef = row.coef.map((v, idx) => (
            v.sub(row_before.coef[idx].mul(coef))
          ));
          row.p0 = row.p0.sub(row_before.p0.mul(coef));
          return row;
        }
      });
      const coef = table.target_coef[var_id].div(row_before.coef[var_id]);
      table.target_coef = table.target_coef.map((v, idx) => (
        v.sub(row_before.coef[idx].mul(coef))
      ));
      table.target_p0 = table.target_p0.add(row_before.p0.mul(coef));
      return table;
    },
    render(table) {
      let math = ''
      if (row_idx < table.rows.length) {
        const { base_id } = table.rows[row_idx];
        assert(base_id != -1);
        assert(table.is_id_alive(base_id));
        math += var_to_math(table.id_to_var[base_id]);
      } else {
        math += '?';
      }
      math += '\\to '
      if (table.is_id_alive(var_id)) {
        math += var_to_math(table.id_to_var[var_id]);
      } else {
        math += '?';
      }
      return <span>{'Pivot '}<Equation>{math}</Equation></span>;
    },
  };
}
