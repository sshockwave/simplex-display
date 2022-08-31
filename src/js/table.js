import { Equation, var_to_math } from "./equation";
import Fraction from "./fraction";
import { InlinePopper } from "./popper";
import { useState } from "react";

export class Table {
  constructor() {
    this.var_to_id = {};
    this.id_to_var = [];

    // Info about equations
    // { coef: [], rel: '\\le' | '\\ge' | '=', p0: Fraction, base_id: -1 | int }
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
      if (row.rel !== '=') {
        return false;
      }
    }
    return true;
  }
};

function InequalitySign({ rel, row_idx, onTransform, var_to_id }) {
  const [relax_is_valid, set_relax_is_valid] = useState(true);
  function find_good_name() {
    for (let i = 1; ; i++) {
      if (!Object.hasOwn(var_to_id, `x${i}`)) {
        return `x${i}`;
      }
    }
  }
  const a_good_name = find_good_name();
  function is_good_name(s) {
    if (!s.match(/^[a-zA-Z]+\d*'*$/)) {
      return false;
    }
    if (Object.hasOwn(var_to_id, s)) {
      return false;
    }
    return true;
  }
  return <InlinePopper content={() => <div className='pt-2 pb-1 ps-2 d-flex flex-row'>
    <div className='me-2'>
      <button
        type='button'
        className='btn btn-outline-primary'
        onClick={() => onTransform({
          type: 'insert',
          action: 'MultiplyTransform',
          up: -1, dn: 1,
          row_idx,
        })}>
        <Equation>{'\\times(-1)'}</Equation>
      </button>
    </div>
    <form className='has-validation me-2 input-group' onSubmit={(ev) => {
      ev.preventDefault();
      let val = ev.target.value;
      if (!val) {
        val = a_good_name;
      }
      if (is_good_name(val)) {
        onTransform({
          type: 'insert',
          action: 'RelaxRow',
          var_name: val,
          row_idx,
        });
      }
    }}>
      <input
        type='text'
        className={`form-control is-${relax_is_valid ? 'valid' : 'invalid'}`}
        placeholder={a_good_name}
        onInput={(ev) => {
          const val = ev.target.value;
          set_relax_is_valid(!val || is_good_name(val));
        }}
      />
      <button
        type='submit'
        className={`btn ${relax_is_valid ? 'btn-success' : 'disabled btn-danger'}`}
      >Relax</button>
      <div className={`${relax_is_valid ? 'valid' : 'invalid'}-feedback`}></div>
    </form>
  </div>}>
    <Equation>{rel}</Equation>
  </InlinePopper>;
}

function InequalityRow({
  id_to_var, var_list, coef, rel, p0, base_id, row_idx, onTransform, var_to_id,
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
        <Equation>{`${v}${var_to_math(id_to_var[var_id])}`}</Equation>
      </td>;
    })}
    <td><InequalitySign
      rel={rel}
      row_idx={row_idx}
      onTransform={onTransform}
      var_to_id={var_to_id}
    ></InequalitySign></td>
    <td><Equation>{p0.to_katex()}</Equation></td>
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
      return <td key={idx}><Equation>{`${v}${name}`}</Equation></td>;
    })}
    <td></td>
    <td>{p0.is_zero() ? null :
      <Equation>{p0.to_katex(true)}</Equation>
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
    return `${var_to_math(table.id_to_var[id])}${rel}${val.to_katex()}`;
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
          <Equation>{`\\text{${table.target_is_max ? 'Maximize' : 'Minimize'}}`}</Equation>
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
          <th className='pe-3'>{idx === 0 ? <Equation>{'\\text{subject to}'}</Equation> : null}</th>
          <InequalityRow
            id_to_var={table.id_to_var}
            var_list={var_list}
            row_idx={idx}
            onTransform={onTransform}
            var_to_id={table.var_to_id}
            {...row}
          ></InequalityRow>
        </tr>
      ))}
    </tbody>
    {table.var_non_std.length > 0 ? <tbody>
      <tr className='mb-3'>
        <th className='pe-3'><Equation>{'\\text{and}'}</Equation></th>
        <td colSpan={Object.keys(table.var_to_id).length + 2} className='text-start'>
          <Equation>{single_constraints}</Equation>
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
