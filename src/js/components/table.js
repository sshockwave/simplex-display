import { Equation, var_to_math } from "../equation";
import { useState } from 'react';

export function SimplexTable({ table, hl }) {
  const var_list = Array.from(Object.values(table.var_to_id));
  hl = hl || [null, null];
  const [focus, set_focus] = useState(hl);
  return <table
    className='table text-center simplex-table'
    onMouseLeave={() => set_focus(hl)}
  >
    <tbody>
      <tr>
        <th colSpan='3'>
          <Equation>{'c_j'}</Equation>
        </th>
        {var_list.map((var_id, idx) => (
          <td key={idx} className={focus[1] === idx ? 'active' : ''}>
            <Equation>{table.original_target_coef[var_id].to_katex()}</Equation>
          </td>
        ))}
        <th rowSpan='2' className='align-middle'>
          <Equation>{`\\beta_{i${focus[1] === null ? '' : focus[1]}}`}</Equation>
        </th>
      </tr>
      <tr>
        <th><Equation>{'c_B'}</Equation></th>
        <th><Equation>{'x_B'}</Equation></th>
        <th><Equation>{'P_0'}</Equation></th>
        {var_list.map((var_id, idx) => (
          <td key={idx} className={focus[1] === idx ? 'active' : ''}>
            <Equation>{var_to_math(table.id_to_var[var_id])}</Equation>
          </td>
        ))}
      </tr>
      {table.rows.map((row, idx) => <tr key={idx} className={idx === focus[0] ? 'active' : ''}>
        <td>
          <Equation>
            {table.original_target_coef[row.base_id].to_katex()}
          </Equation>
        </td>
        <td>
          <Equation>
            {var_to_math(table.id_to_var[row.base_id])}
          </Equation>
        </td>
        <td>
          <Equation>{row.p0.to_katex()}</Equation>
        </td>
        {var_list.map((var_id, idx2) => {
          const v = row.coef[var_id];
          return <td
            className={idx2 === focus[1] ? 'active' : ''}
            key={idx2}
            onMouseOver={() => set_focus([idx, idx2])}
          >
            {v.is_zero() ? null : <Equation>{v.to_katex()}</Equation>}
          </td>;
        })}
        <td><Equation>{(() => {
          if (focus[0] === null) {
            return '\\text{---}';
          }
          const v = row.coef[var_list[focus[1]]];
          if (v.is_zero() || v.is_neg()) {
            return '\\infty';
          }
          return row.p0.div(v).to_katex();
        })()}</Equation></td>
      </tr>)}
      <tr>
        <th colSpan='2'>
          <Equation>{'-Z'}</Equation>
        </th>
        <td>
          <Equation>{table.target_p0.neg().to_katex()}</Equation>
        </td>
        {var_list.map((var_id, idx) => {
          const v = table.target_coef[var_id];
          return <td key={idx} className={idx === focus[1] ? 'active' : ''}>
            <Equation>{v.to_katex()}</Equation>
          </td>;
        })}
        <td></td>
      </tr>
    </tbody>
  </table>;
}
