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

function TransformBadge({ children, active, success, onTransform }) {
  const [delHover, setDelHover] = useState(false);
  return <span className='position-relative'>
    <span className={success ? '' :'text-danger border-2 border-bottom border-danger'}>
      {children}
    </span>
    <a
      onMouseOver={() => {
        setDelHover(true);
      }}
      onMouseLeave={() => {
        setDelHover(false);
      }}
      onClick={() => onTransform({ type: 'delete' })}
      className={`ps-1 text-${delHover ? 'danger' : 'secondary'} material-icon text-decoration-none is-clickable`}
    >delete</a>
  </span>;
}

export default function App() {
  const [initialTable, setInitialTable] = useState(gen_mock_table);
  const [transforms, setTransforms] = useState([]);

  function onTransform(e, idx) {
    const { type } = e;
    e = clone(e);
    delete e.type;
    const t = transforms.slice();
    if (type === 'insert') { // insert after idx
      if (!e.show_previous && idx >= 0 && !t[idx].collapsed) {
        t[idx] = clone(t[idx]);
        t[idx].collapsed = true;
      }
      e.collapsed = false;
      t.splice(idx + 1, 0, e);
    } else if (type === 'delete') { // delete idx
      if (idx > 0 && t[idx - 1].collapsed != t[idx].collapsed) {
        t[idx - 1] = clone(t[idx - 1]);
        t[idx - 1].collapsed = t[idx].collapsed;
      }
      t.splice(idx, 1);
    } else {
      throw 'Undefined transform type';
    }
    setTransforms(t);
  }

  const tables = [initialTable];
  let stash = [];
  const display_tables = [];
  let cur = initialTable;
  for (const [trans_idx, t] of transforms.entries()) {
    let transformer = null;
    try {
      transformer = Transform[t.action](t);
    } catch(e) {
      console.error('Corrupted transform config');
      console.log(e);
      transformer = {
        render() {
          return 'Corrupted';
        },
      };
    }
    let success = false;
    try {
      cur = transformer.run(cur);
      success = true;
    } catch (e) {
      console.log(e);
    }
    stash.push([transformer, success, trans_idx]);
    if (!t.collapsed) {
      display_tables.push(<div className='card mb-3' key={display_tables.length}>
        <div className='card-header'>
          <ol className='breadcrumb mb-0'>
            {stash.map(([trans, success, trans_idx], idx) => (
              <li key={idx} className={`breadcrumb-item`}>
                <TransformBadge
                  success={success}
                  onTransform={(e) => onTransform(e, trans_idx)}
                  active={idx === stash.length - 1}
                >
                  {trans.render()}
                </TransformBadge>
              </li>
            ))}
          </ol>
        </div>
        <div className='card-body'>
          <TableDisplay
            table={cur}
            onTransform={(e) => onTransform(e, trans_idx)}
          ></TableDisplay>
        </div>
      </div>);
      stash = [];
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
          onTransform={(e) => onTransform(e, -1)}
        ></TableDisplay>
      </div>
    </div>
    {display_tables}
  </div>;
}
