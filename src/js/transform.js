import { splice } from "./utils.js";
import Fraction from './fraction.js';

export function MultiplyTransform({ up, dn, row_idx }) {
  const factor = Fraction.from_frac(up, dn);
  return {
    run(table) {
      const row = table.rows[row_idx];
      table = table.shallow_clone();
      let { rel } = row;
      if (factor.neg()) {
        if (rel === 'le') {
          rel = 'ge';
        } else if (rel === 'ge') {
          rel = 'le';
        }
      }
      table.rows = splice(table.rows, row_idx, 1, {
        coef: row.coef.map(x => x.neg()),
        rel,
        p0: row.p0.neg(),
        base_id: -1,
      });
      return table;
    },
  }
}
