import { useState } from 'react';
import Fraction from './fraction.js';
import { Table, TableDisplay } from './table.js';
import { splice } from './utils.js';
import * as Transform from './transform.js';

function gen_mock_table() {
  let table = new Table;
  table.var_to_id = { 'x1': 0, 'x2': 1 };
  table.id_to_var = ['x1', 'x2'];
  table.rows = [
    {
      coef: [Fraction.from_num(3), Fraction.from_frac(4, 6)],
      rel: '\\le',
      p0: Fraction.from_num(4),
      base_id: -1,
    },
    {
      coef: [Fraction.from_num(0), Fraction.from_num(4)],
      rel: '\\ge',
      p0: Fraction.from_num(3),
      base_id: -1,
    },
  ];
  table.original_target_coef = [Fraction.from_num(1.5), Fraction.from_num(3)];
  table.target_coef = [Fraction.from_num(1.5), Fraction.from_num(3)];
  table.var_non_std = [
    { id: 1, rel: '\\ge', val: Fraction.from_num(-3) }
  ];
  return table;
}

export default function App() {
  const [initialTable, setInitialTable] = useState(gen_mock_table);
  const [transforms, setTransforms] = useState([]);
  const tables = [initialTable];
  let cur = initialTable;
  let filtered_trans = [];
  for (const t of transforms) {
    try {
      const transformer = Transform[t.action](t);
      cur = transformer.run(cur);
    } catch (e) {
      console.log(e);
      continue;
    }
    filtered_trans.push(t);
    tables.push(cur);
  }
  if (filtered_trans.length < transforms.length) {
    setTransforms(filtered_trans);
  }
  return <div className='container pt-3'>
    {tables.map((table, idx) => (
      <div className='card mb-3' key={idx}>
        <div className='card-header d-flex py-1'>
          <div className='ms-auto'>Actions</div>
        </div>
        <div className='card-body py-2'>
          <TableDisplay
            table={table}
            onTransform={(e) => {
              const { type } = e;
              delete e.type;
              if (type === 'insert') {
                setTransforms(splice(transforms, idx, 0, e));
              } else if (type === 'delete') {
                setTransforms(splice(transforms, idx - 1, 1));
              } else {
                throw 'Undefined transform type';
              }
            }}
          ></TableDisplay>
        </div>
      </div>
    ))}
  </div>;
}
