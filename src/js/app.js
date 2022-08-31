import { useState } from 'react';
import Fraction from './fraction.js';
import { Table, TableDisplay } from './table.js';
import { clone } from './utils.js';
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

  function onTransform(e, idx) {
    const { type } = e;
    e = clone(e);
    delete e.type;
    const t = transforms.slice();
    if (type === 'insert') {
      if (!e.show_previous && idx > 0 && !t[idx - 1].collapsed) {
        t[idx - 1] = clone(t[idx - 1]);
        t[idx - 1].collapsed = true;
      }
      e.collapsed = false;
      t.splice(idx, 0, e);
    } else if (type === 'delete') {
      if (idx > 0 && t[idx - 1].collapsed) {
        t[idx - 1] = clone(t[idx - 1]);
        t[idx - 1].collapsed = false;
      }
      t.splice(idx - 1, 0, e);
    } else {
      throw 'Undefined transform type';
    }
    setTransforms(t);
  }

  const tables = [initialTable];
  let stashed_transforms = [];
  const display_tables = [];
  let cur = initialTable;
  for (const t of transforms) {
    try {
      const transformer = Transform[t.action](t);
      cur = transformer.run(cur);
    } catch (e) {
      console.log(e);
      continue;
    }
    if (t.collapsed) {
      stashed_transforms.push(t);
    } else {
      const table_length = tables.length;
      display_tables.push(<div className='card mb-3' key={display_tables.length}>
        <div className='card-header d-flex'>
          <div className='ms-auto'>Actions</div>
        </div>
        <div className='card-body'>
          <TableDisplay
            table={cur}
            onTransform={(e) => onTransform(e, table_length)}
          ></TableDisplay>
        </div>
      </div>);
    }
    tables.push(cur);
  }
  return <div className='container pt-3'>
    <div className='card mb-3'>
      <div className='card-header d-flex'>
        <div>Initial table</div>
      </div>
      <div className='card-body'>
        <TableDisplay
          table={tables[0]}
          onTransform={(e) => onTransform(e, 0)}
        ></TableDisplay>
      </div>
    </div>
    {display_tables}
  </div>;
}
