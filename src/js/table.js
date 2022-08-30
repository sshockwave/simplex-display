import { Equation, var_to_math } from "./equation";
import Fraction from "./fraction";

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

export function TableDisplay({ table }) {
  if (table.display_table) {
    console.assert(false, 'TODO');
  } else {
    let var_list = Object.values(table.var_to_id);
    var_list.sort();
    function render_coef(coef) {
      let first = true;
      return coef.map((v, idx) => {
        if (v.is_zero()) {
          return <td key={idx}></td>;
        }
        let name = table.id_to_var[var_list[idx]];
        name = var_to_math(name);
        v = v.to_katex(!first);
        first = false;
        return <td key={idx}><Equation src={`${v}${name}`}></Equation></td>;
      });
    }
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
    return <div>
      <table className='simplex-table text-end'>
        <thead>
          <tr>
            <th className='text'>
              <Equation src={`\\text{${table.target_is_max ? 'Maximize' : 'Minimize'}}`}></Equation>
            </th>
            <td><Equation src='Z='></Equation></td>
            {render_coef(table.target_coef)}
            <td></td>
            <td>{table.target_p0.is_zero() ? null :
              <Equation src={table.target_p0.to_katex(true)}></Equation>
            }</td>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, idx) => (
            <tr key={idx}>
              <th>{idx === 0 ? <Equation src='\text{subject to}'></Equation> : null}</th>
              <td></td>
              {render_coef(row.coef)}
              <td><Equation src={`\\${row.rel}`}></Equation></td>
              <td><Equation src={row.p0.to_katex(false)}></Equation></td>
            </tr>
          ))}
        </tbody>
        {table.var_non_std.length > 0 ? <tbody>
          <tr>
            <th><Equation src='\text{and}'></Equation></th>
            <td colSpan={Object.keys(table.var_to_id).length + 2} className='text-start'>
              <Equation src={single_constraints}></Equation>
            </td>
          </tr>
        </tbody> : null}
      </table>
    </div>;
  }
}
