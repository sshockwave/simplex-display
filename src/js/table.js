import { Equation, var_to_math } from "./equation";
import Fraction from "./fraction";
import { InlinePopper } from "./popper";
import { array_splice } from "./utils";

export class Table {
  constructor() {
    this.var_to_id = {};
    this.id_to_var = [];

    // Info about equations
    // { coef: [], rel: 'le' | 'ge' | 'eq', p0: Fraction, base_id: -1 | int }
    this.rows = [];

    this.original_target_coef = [];
    this.target_coef = []; // Current
    this.target_p0 = Fraction.from_num(0);
    this.target_is_max = true;

    // Variables that are not in the standard form (>=0)
    // Each element of this array is in the format:
    // { id: int, rel: 'le' | 'ge' | 'any', val: Fraction }
    this.var_non_std = [];

    this.display_table = false;
  }
  shallow_clone() {
    return Object.assign(new Table, this);
  }
  can_display_in_table() {
    if (this.var_non_std.length !== 0) {
      return false;
    }
    for (const row of this.rows) {
      if (row.rel !== 'eq') {
        return false;
      }
    }
    return true;
  }
};

function createMultiplyTransform(factor, row_idx) {
  if (typeof factor === 'number') {
    factor = Fraction.from_num(factor);
  }
  return {
    type: 'insert_before',
    val(table) {
      const row = table.rows[row_idx];
      console.assert(row.base_id === -1, 'Inequalities does not have base_id');
      table = table.shallow_clone();
      let { rel } = row;
      if (factor.neg()) {
        if (rel === 'le') {
          rel = 'ge';
        } else if (rel === 'ge') {
          rel = 'le';
        }
      }
      table.rows = array_splice(table.rows, row_idx, 1, {
        coef: row.coef.map(x => x.neg()),
        rel,
        p0: row.p0.neg(),
        base_id: -1,
      });
      console.log(table.rows[row_idx]);
      return table;
    },
  }
}

function InequalitySign({ rel, row_idx, onTransform }) {
  return <InlinePopper content={<>
    <div className='py-2 ps-2'>
      <button
        type='button'
        className='btn btn-outline-primary btn-sm me-2'
        onClick={() => onTransform(createMultiplyTransform(-1, row_idx))}>
        <Equation src={`\\times(-1)`}></Equation>
      </button>
    </div>
  </>}>
    <Equation src={`\\${rel}`}></Equation>
  </InlinePopper>;
}

function InequalityRow({
  id_to_var, var_list, coef, rel, p0, base_id, row_idx, onTransform
}) {
  let add_sign = null;
  return <>
    {var_list.map((var_id, idx) => {
      let v = coef[var_id];
      if (v.is_zero()) {
        return <td key={idx}></td>;
      }
      v = v.to_katex(add_sign);
      add_sign = true;
      return <td key={idx}>
        <Equation src={`${v}${var_to_math(id_to_var[var_id])}`}></Equation>
      </td>;
    })}
    <td><InequalitySign
      rel={rel}
      row_idx={row_idx}
      onTransform={onTransform}
    ></InequalitySign></td>
    <td><Equation src={p0.to_katex()}></Equation></td>
  </>;
}

function TargetRow({ id_to_var, var_list, coef, p0 }) {
  let add_sign = null;
  return <>
    {var_list.map((var_id, idx) => {
      let v = coef[var_id];
      if (v.is_zero()) {
        return <td key={idx}></td>;
      }
      let name = id_to_var[var_id];
      name = var_to_math(name);
      v = v.to_katex(add_sign);
      add_sign = true;
      return <td key={idx}><Equation src={`${v}${name}`}></Equation></td>;
    })}
    <td></td>
    <td>{p0.is_zero() ? null :
      <Equation src={p0.to_katex(true)}></Equation>
    }</td>
  </>
}

export function InequalitySystem({ table, onTransform }) {
  let var_list = Object.values(table.var_to_id);
  var_list.sort();
  let single_constraints = table.var_non_std.map(({ id, rel, val }, idx) => {
    if (rel === 'any') {
      return null;
    }
    return `${var_to_math(table.id_to_var[id])}\\${rel}${val.to_katex()}`;
  }).join(',');
  const std_var_list = new Set(var_list);
  for (let t of table.var_non_std) {
    std_var_list.delete(t.id);
  }
  if (std_var_list.size > 0) {
    if (single_constraints != '') {
      single_constraints += ',';
    }
    single_constraints += Array
      .from(std_var_list)
      .map((id) => var_to_math(table.id_to_var[id]))
      .join(',');
    single_constraints += '\\ge 0';
  }
  return <table className='simplex-table text-end'>
    <thead>
      <tr className='me-1'>
        <th className='pe-3'>
          <Equation src={`\\text{${table.target_is_max ? 'Maximize' : 'Minimize'}}`}></Equation>
        </th>
        <TargetRow
          id_to_var={table.id_to_var}
          var_list={var_list}
          coef={table.target_coef}
          p0={table.target_p0}
        ></TargetRow>
      </tr>
    </thead>
    <tbody>
      {table.rows.map((row, idx) => (
        <tr key={idx} className='mb-1'>
          <th className='pe-3'>{idx === 0 ? <Equation src='\text{subject to}'></Equation> : null}</th>
          <InequalityRow
            id_to_var={table.id_to_var}
            var_list={var_list}
            row_idx={idx}
            onTransform={onTransform}
            {...row}
          ></InequalityRow>
        </tr>
      ))}
    </tbody>
    {table.var_non_std.length > 0 ? <tbody>
      <tr className='mb-3'>
        <th className='pe-3'><Equation src='\text{and}'></Equation></th>
        <td colSpan={Object.keys(table.var_to_id).length + 2} className='text-start'>
          <Equation src={single_constraints}></Equation>
        </td>
      </tr>
    </tbody> : null}
  </table>;
}

export function TableDisplay({ table, onTransform }) {
  if (table.display_table) {
    console.assert(false, 'TODO');
  } else {
    return <InequalitySystem table={table} onTransform={onTransform}></InequalitySystem>;
  }
}
