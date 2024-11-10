import { Equation, var_to_math } from "./equation.js";
import { InlinePopper } from "./popper.js";
import { useState } from "react";
import { ModifiableTerm } from "./variable.js";

function InequalitySign({ rel, row_idx, onTransform, var_to_id, show_relax }) {
  const [relax_is_valid, set_relax_is_valid] = useState(true);
  function find_good_name() {
    for (let i = 1; ; i++) {
      if (!Object.hasOwn(var_to_id, `x${i}`)) {
        return `x${i}`;
      }
    }
  }
  const a_good_name = find_good_name();
  const [cur_name, set_cur_name] = useState(null);
  function is_good_name(s) {
    if (!s.match(/^[a-zA-Z]+\d*'*$/)) {
      return false;
    }
    if (Object.hasOwn(var_to_id, s)) {
      return false;
    }
    return true;
  }
  return <InlinePopper content={(dismiss) => <div className='pt-2 pb-2 ps-2 d-flex flex-row'>
    <div className='me-2'>
      <button
        type='button'
        className='btn btn-outline-success'
        onClick={() => {
          dismiss();
          onTransform({
            type: 'insert',
            action: 'MultiplyTransform',
            up: -1, dn: 1,
            row_idx,
          });
        }}>
        <Equation>{'\\times(-1)'}</Equation>
      </button>
    </div>
    {show_relax && rel !== '\\ge' ? <div className='input-group me-2'>
      <input
        type='text'
        className={`form-control is-${relax_is_valid ? 'valid' : 'invalid'}`}
        placeholder={a_good_name}
        value={cur_name ?? ''}
        onInput={(ev) => {
          const val = ev.target.value;
          set_relax_is_valid(!val || is_good_name(val));
          if (val) {
            set_cur_name(val);
          } else {
            set_cur_name(null);
          }
        }}
      />
      {rel === '\\le' ? <button
        type='button'
        className={`btn ${relax_is_valid ? 'btn-success' : 'disabled btn-danger'}`}
        onClick={() => {
          let val = cur_name ?? a_good_name;
          if (is_good_name(val)) {
            dismiss();
            onTransform({
              type: 'insert',
              action: 'RelaxRow',
              var_name: val,
              row_idx,
            });
            set_cur_name(null);
          }
        }}
      >Relax</button> : null}
      {rel === '=' ? <button
        type='button'
        className={`btn ${relax_is_valid ? 'btn-success' : 'disabled btn-danger'}`}
        onClick={() => {
          let val = cur_name || find_good_name();
          if (is_good_name(val)) {
            dismiss();
            onTransform({
              type: 'insert',
              action: 'ArtificialVar',
              var_name: val,
              row_idx,
            });
            set_cur_name(null);
          }
        }}
      >AVar</button> : null}
    </div> : null}
  </div >}>
    <span className='is-text-link'>
      <Equation>{rel}</Equation>
    </span>
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
      p0={p0}
      var_to_id={var_to_id}
      show_relax={true}
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
      <Equation>{p0.to_katex(false)}</Equation>
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
