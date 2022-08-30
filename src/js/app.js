import { useState } from 'react';
import Fraction from './fraction.js';
import { Table, TableDisplay } from './table.js';

function gen_mock_table() {
  let table = new Table;
  table.var_to_id = { 'x1': 0, 'x2': 1 };
  table.id_to_var = ['x1', 'x2'];
  table.rows = [
    {
      coef: [Fraction.from_num(3), Fraction.from_frac(4, 6)],
      rel: 'le',
      p0: Fraction.from_num(4),
      base_id: -1,
    },
    {
      coef: [Fraction.from_num(0), Fraction.from_num(4)],
      rel: 'le',
      p0: Fraction.from_num(3),
      base_id: -1,
    },
  ];
  table.original_target_coef = [Fraction.from_num(1.5), Fraction.from_num(3)];
  table.target_coef = [Fraction.from_num(1.5), Fraction.from_num(3)];
  table.var_non_std = [
    { id: 1, rel: 'ge', val: Fraction.from_num(-3) }
  ];
  return table;
}

export default function App() {
  const [initialTable, setInitialTable] = useState(gen_mock_table);
  const [transforms, setTransforms] = useState([]);
  const tables = [initialTable];
  let cur = initialTable;
  for (const t of transforms) {
    cur = t(cur);
    tables.push(cur);
  }
  return <div className='container pt-3'>
    {tables.map((table, idx) => (
      <div className='card mb-3'>
        <div className='card-body'>
          <TableDisplay
            key={idx}
            table={table}
            onTransform={(e) => {
              if (e.type === 'insert_front') {
                setTransforms(transforms.splice(idx - 1, 0, e.val));
              } else if (e.type === 'insert_back') {
                setTransforms(transforms.splice(idx, 0, e.val));
              } else if (e.type === 'delete') {
                setTransforms(transforms.splice(idx - 1, 1));
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
