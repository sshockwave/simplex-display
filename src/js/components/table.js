import { Equation, var_to_math } from "./equation";
import { useState } from 'react';

export function SimplexTable({ table, hl, onTransform }) {
  const var_list = Array.from(Object.values(table.var_to_id));
  const nvars = var_list.length;
  const nrows = table.rows.length;
  hl = hl || [null, null];
  const [c_row, set_row] = useState(hl[0]);
  const [c_col, set_col] = useState(hl[1]);
  function f_row(i) {
    return () => set_row(i);
  }
  function f_col(j) {
    return () => set_col(j);
  }
  return <table
    className='table text-center simplex-table'
    onMouseLeave={() => {
      set_row(hl[0]);
      set_col(hl[1]);
    }}
  >
    <tbody>
      <tr onMouseOver={f_row(0)}>
        <th colSpan='3' onMouseOver={f_col(0)}>
          <Equation>{'c_j'}</Equation>
        </th>
        {var_list.map((var_id, idx) => (
          <td key={idx} className={c_col === idx ? 'active' : ''} onMouseOver={f_col(idx)}>
            <Equation>{table.original_target_coef[var_id].to_katex()}</Equation>
          </td>
        ))}
        <th rowSpan='2' className='align-middle' onMouseOver={f_col(nvars - 1)}>
          <Equation>{`\\beta_{i${c_col === null ? '*' : c_col}}`}</Equation>
        </th>
      </tr>
      <tr onMouseOver={f_row(0)}>
        <th onMouseOver={f_col(0)}><Equation>{'c_B'}</Equation></th>
        <th onMouseOver={f_col(0)}><Equation>{'x_B'}</Equation></th>
        <th onMouseOver={f_col(0)}><Equation>{'P_0'}</Equation></th>
        {var_list.map((var_id, idx) => (
          <td key={idx} className={c_col === idx ? 'active' : ''} onMouseOver={f_col(idx)}>
            <Equation>{var_to_math(table.id_to_var[var_id])}</Equation>
          </td>
        ))}
      </tr>
      {table.rows.map((row, idx) => <tr key={idx} className={idx === c_row ? 'active' : ''} onMouseOver={f_row(idx)}>
        <td onMouseOver={f_col(0)}>
          <Equation>
            {table.original_target_coef[row.base_id].to_katex()}
          </Equation>
        </td>
        <td onMouseOver={f_col(0)}>
          <Equation>
            {var_to_math(table.id_to_var[row.base_id])}
          </Equation>
        </td>
        <td onMouseOver={f_col(0)}>
          <Equation>{row.p0.to_katex()}</Equation>
        </td>
        {var_list.map((var_id, idx2) => {
          const v = row.coef[var_id];
          return <td
            className={`${idx2 === c_col ? 'active' : ''} is-clickable`}
            key={idx2}
            onMouseOver={f_col(idx2)}
            onClick={() => onTransform({
              type: 'insert',
              action: 'Pivot',
              row_idx: idx,
              var_id,
            })}
          >
            {v.is_zero() ? null : <Equation>{v.to_katex()}</Equation>}
          </td>;
        })}
        <td onMouseOver={f_col(nvars - 1)}><Equation>{(() => {
          if (c_col === null) {
            return '\\text{---}';
          }
          const v = row.coef[var_list[c_col]];
          if (!row.p0.is_pos_div(v)) {
            return '\\infty';
          }
          return row.p0.div(v).to_katex();
        })()}</Equation></td>
      </tr>)}
      <tr onMouseOver={f_row(nrows - 1)}>
        <th colSpan='2' onMouseOver={f_col(0)}>
          <Equation>{'-Z'}</Equation>
        </th>
        <td onMouseOver={f_col(0)}>
          <Equation>{table.target_p0.neg().to_katex()}</Equation>
        </td>
        {var_list.map((var_id, idx) => {
          const v = table.target_coef[var_id];
          return <td key={idx} className={idx === c_col ? 'active' : ''} onMouseOver={f_col(idx)}>
            <Equation>{v.to_katex()}</Equation>
          </td>;
        })}
        <td onMouseOver={f_col(nvars - 1)}></td>
      </tr>
    </tbody>
  </table>;
}
