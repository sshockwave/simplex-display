import Fraction from "./fraction";
import { Table } from "./table";

export const example_input = {
  var_list: ['x1', 'x2', 'x3'],
  constraints: [
    {
      coef: [1, -1, '3/3'],
      rel: '>=',
      p0: -3,
    },
    {
      coef: [2, 1, 1],
      rel: '<=',
      p0: 9,
    },
    {
      coef: [1, 3, 1],
      rel: '>=',
      p0: 4,
    }
  ],
  target_coef: [-1, -3, 5],
  var_constraints: {
    'x2': { rel: '>=', val: 1 },
    'x3': { rel: 'any' },
  },
  target_is_max: false,
};

function get_frac(val) {
  if (typeof val === 'number') {
    return Fraction.from_num(val);
  }
  if (typeof val === 'string') {
    return Fraction.from_str(val);
  }
  throw `Invalid value: ${val}`;
}

function get_inequality_sign(rel) {
  if (rel === '<=') {
    return '\\le';
  }
  if (rel === '>=') {
    return '\\ge';
  }
  if (rel === '=') {
    return '=';
  }
  throw `Invalid relation: ${rel}`;
}

export function input_to_table(input) {
  const table = new Table;
  table.var_to_id = Object.fromEntries(input.var_list.map((name, idx) => [name, idx]));
  table.id_to_var = input.var_list;
  table.rows = input.constraints.map(({ coef, rel, p0 }) => ({
    coef: coef.map(get_frac),
    rel: get_inequality_sign(rel),
    p0: get_frac(p0),
    base_id: -1,
  }));
  table.target_coef = input.target_coef.map(get_frac);
  table.var_non_std = Object.entries(input.var_constraints).map(([name, { rel, val }]) => ({
    id: table.var_to_id[name],
    ...(rel === 'any' ? {
      rel: 'any',
    }: {
      rel: get_inequality_sign(rel),
      val: get_frac(val),
    }),
  }));
  table.target_is_max = input.target_is_max;
  return table;
}
