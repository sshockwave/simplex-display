import { Equation, var_to_math } from "./equation";
import Fraction from "./fraction";
import { InlinePopper } from "./popper";
import { clone } from './utils.js';
import { useState } from "react";
import { ModifiableTerm } from "./components/variable";
import { SimplexTable } from "./components/table";

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
  deep_clone() {
    const t = new Table();
    t.var_to_id = clone(this.var_to_id);
    t.id_to_var = this.id_to_var.slice();
    t.rows = this.rows.map((row) => {
      row = clone(row);
      row.coef = row.coef.slice();
      return row;
    });
    t.original_target_coef = this.original_target_coef.slice();
    t.target_coef = this.target_coef.slice();
    t.target_p0 = this.target_p0;
    t.target_is_max = this.target_is_max;
    t.var_non_std = this.var_non_std.slice();
    t.display_table = this.display_table;
    return t;
  }
  can_display_in_table() {
    if (this.var_non_std.length !== 0) {
      return false;
    }
    for (const row of this.rows) {
      if (row.rel !== '=') {
        return false;
      }
      if (row.base_id === -1) {
        return false;
      }
    }
    return true;
  }
  is_id_alive(id) {
    return this.var_to_id[this.id_to_var[id]] === id;
  }
  is_name_in_use(var_name) {
    return Object.hasOwn(this.var_to_id, var_name);
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
        className='btn btn-outline-success'
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
  let is_first = true;
  return <>
    {var_list.map((var_id, idx) => {
      const old_is_first = is_first;
      if (!coef[var_id].is_zero()) {
        is_first = false;
      }
      return <td key={idx}>
        <ModifiableTerm
          coef={coef[var_id]}
          var_to_id={var_to_id}
          var_name={id_to_var[var_id]}
          var_id={var_id}
          is_first={old_is_first}
          row_idx={row_idx}
          base_id={base_id}
          onTransform={onTransform}
        />
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

function TargetRow({ id_to_var, var_list, coef, p0, var_to_id, onTransform }) {
  let is_first = true;
  return <>
    {var_list.map((var_id, idx) => {
      const old_is_first = is_first;
      if (!coef[var_id].is_zero()) {
        is_first = false;
      }
      return <td key={idx}>
        <ModifiableTerm
          coef={coef[var_id]}
          var_to_id={var_to_id}
          var_name={id_to_var[var_id]}
          var_id={var_id}
          is_first={old_is_first}
          row_idx={-1}
          onTransform={onTransform}
        />
      </td>;
    })}
    <td></td>
    <td>{p0.is_zero() ? null :
      <Equation>{p0.to_katex()}</Equation>
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
          var_to_id={table.var_to_id}
          var_list={var_list}
          coef={table.target_coef}
          p0={table.target_p0}
          onTransform={onTransform}
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
    <tbody>
      <tr className='mb-3'>
        <th className='pe-3'><Equation>{'\\text{and}'}</Equation></th>
        <td colSpan={Object.keys(table.var_to_id).length + 2} className='text-start'>
          <Equation>{single_constraints}</Equation>
        </td>
      </tr>
    </tbody>
  </table>;
}

export function TableDisplay({ table, onTransform }) {
  if (table.display_table) {
    return <SimplexTable table={table} />;
  } else {
    return <InequalitySystem table={table} onTransform={onTransform}></InequalitySystem>;
  }
}
