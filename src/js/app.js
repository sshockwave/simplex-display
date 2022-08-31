import { useState, useId } from 'react';
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

function ClickableIcon({ children, onClick, main, alt }) {
  const [hover, setHover] = useState(false);
  return <a
    onMouseOver={() => {
      setHover(true);
    }}
    onMouseLeave={() => {
      setHover(false);
    }}
    onClick={onClick}
    className={`text-${hover ? alt : main} material-icon text-decoration-none is-clickable`}
  >{children}</a>;
}

function TransformBadge({ t_data, children, success, onTransform }) {
  return <span className='position-relative'>
    <span
      onClick={() => {
        if (t_data.collapsed) {
          t_data = clone(t_data);
          t_data.type = 'update';
          t_data.collapsed = false;
          onTransform(t_data);
        }
      }}
      className={`
        ${t_data.collapsed ? 'is-clickable' : ''}
        ${success ? '' :'border-2 border-bottom border-danger'}
        me-1
      `}
    >
      {children}
    </span>
    <ClickableIcon
      onClick={() => onTransform({ type: 'delete' })}
      main='secondary'
      alt='danger'
    >delete</ClickableIcon>
  </span>;
}

export default function App() {
  const [initialTable, setInitialTable] = useState(gen_mock_table);
  const [transforms, setTransforms] = useState([]);

  function onTransform(e, idx) {
    const { type } = e;
    e = clone(e);
    delete e.type;
    if (idx === transforms.length - 1) {
      e.collapsed = false;
    }
    const t = transforms.slice();
    if (type === 'insert') { // insert after idx
      if (!e.show_previous && idx >= 0 && !t[idx].collapsed) {
        t[idx] = clone(t[idx]);
        t[idx].collapsed = true;
      }
      e.collapsed = e.collapsed || false;
      t.splice(idx + 1, 0, e);
    } else if (type === 'delete') { // delete idx
      if (idx > 0 && t[idx - 1].collapsed && !t[idx].collapsed) {
        t[idx - 1] = clone(t[idx - 1]);
        t[idx - 1].collapsed = false;
      }
      t.splice(idx, 1);
    } else if (type === 'update') {
      t.splice(idx, 1, e);
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
    stash.push([transformer, success, trans_idx, t]);
    if (!t.collapsed) {
      display_tables.push(<div className='card mb-3' key={display_tables.length}>
        <div className='card-header'>
          <ol className='breadcrumb mb-0'>
            {stash.map(([trans, success, trans_idx, t], idx) => (
              <li key={idx} className='breadcrumb-item'>
                <TransformBadge
                  success={success}
                  onTransform={(e) => onTransform(e, trans_idx)}
                  t_data={t}
                >
                  {trans.render()}
                </TransformBadge>
              </li>
            ))}
            <li className='breadcrumb-item'></li>
            <li className='ms-auto'>
              {trans_idx < transforms.length - 1 ? <ClickableIcon
                onClick={() => {
                  let t_data = clone(t);
                  t_data.collapsed = true;
                  t_data.type = 'update';
                  onTransform(t_data, trans_idx);
                }}
                main='secondary'
                alt='success'
              >unfold_less</ClickableIcon> : null}
             </li>
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
  const id = useId();
  return <div className='container pt-3'>
    <div className='card mb-3'>
      <div className='card-header d-flex flex-row'>
        <div>Input</div>
        <div className='ms-auto form-check'>
          <input class='form-check-input' type='checkbox' value={true} id={id} checked/>
          <label class='form-check-label' for={id}>
            Locked
          </label>
        </div>
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
