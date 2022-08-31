import { Equation, var_to_math } from "../equation";
import { useState } from 'react';

export function SimplexTable({ table }) {
  const var_list = Array.from(Object.values(table.var_to_id));
  const [focus, set_focus] = useState(null);
  return <table className='table text-center'>
    <tbody>
      <tr>
        <th colspan='3'>
          <Equation>{'c_j'}</Equation>
        </th>
        {table.original_target_coef.map((v, idx) => (
          <td key={idx}><Equation>{v.to_katex()}</Equation></td>
        ))}
        <th rowspan='2' className='align-middle'>
          <Equation>{'\\beta_i'}</Equation>
        </th>
      </tr>
      <tr>
        <th><Equation>{'c_B'}</Equation></th>
        <th><Equation>{'x_B'}</Equation></th>
        <th><Equation>{'P_0'}</Equation></th>
        {var_list.map((var_id, idx) => (
          <td key={idx}>
            <Equation>{var_to_math(table.id_to_var[var_id])}</Equation>
          </td>
        ))}
        <td></td>
      </tr>
      {table.rows.map((row, idx) => <tr key={idx}>
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
        {row.coef.map((v, idx) => <td key={idx}>
          {v.is_zero() ? null : <Equation>{v.to_katex()}</Equation>}
        </td>)}
        <td></td>
      </tr>)}
      <tr>
        <th colspan='2'>
          <Equation>{'-Z'}</Equation>
        </th>
        <td>
          <Equation>{table.target_p0.neg().to_katex()}</Equation>
        </td>
        {table.target_coef.map((v, idx) => <td key={idx}>
          {v.is_zero() ? null : <Equation>{v.to_katex()}</Equation>}
        </td>)}
      </tr>
    </tbody>
  </table>;
}
