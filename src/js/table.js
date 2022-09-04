import Fraction from "./fraction";
import { clone } from './utils.js';
import { SimplexTable } from "./components/table";
import { InequalitySystem } from "./components/inequality";

export class Table {
  constructor() {
    this.var_to_id = {};
    this.id_to_var = [];

    // Info about equations
    // { coef: [], rel: '\\le' | '\\ge' | '=', p0: Fraction, base_id: -1 | int }
    this.rows = [];

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

export function TableDisplay({ table, onTransform }) {
  if (table.display_table) {
    return <SimplexTable table={table} onTransform={onTransform} />;
  } else {
    return <InequalitySystem table={table} onTransform={onTransform} />;
  }
}
