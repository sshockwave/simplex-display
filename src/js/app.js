import { useState, useId } from 'react';
import Fraction from './fraction.js';
import { Table, TableDisplay } from './table.js';
import { clone } from './utils.js';
import * as Transform from './transform.js';
import { ClickableIcon, ErrorIcon } from './components/icon.js';

function gen_displayable_table() {
  let table = new Table;
  table.var_to_id = { 'x1': 0, 'x2': 1, 'x3': 2 };
  table.id_to_var = ['x1', 'x2', 'x3'];
  table.rows = [
    {
      coef: [Fraction.from_num(-2), Fraction.from_num(1), Fraction.from_num(-3)],
      rel: '\\le',
      p0: Fraction.from_num(-4),
      base_id: -1,
    },
    {
      coef: [Fraction.from_num(1), Fraction.from_num(-2), Fraction.from_num(4)],
      rel: '\\ge',
      p0: Fraction.from_num(-6),
      base_id: -1,
    },
    {
      coef: [Fraction.from_num(2), Fraction.from_num(1), Fraction.from_num(-2)],
      rel: '\\ge',
      p0: Fraction.from_num(2),
      base_id: -1,
    },
  ];
  table.target_coef = [Fraction.from_num(3), Fraction.from_num(1), Fraction.from_num(-2)];
  table.var_non_std = [
    { id: 0, rel: '\\ge', val: Fraction.from_num(2) },
    { id: 1, rel: 'any', },
    { id: 2, rel: '\\le', val: Fraction.from_num(0) },
  ];
  table.target_is_max = false;
  return table;
}

function TransformBadge({ t_data, children, success, onTransform, error_info }) {
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
        ${t_data.collapsed ? 'is-text-link is-clickable' : ''}
        me-1
      `}
    >
      {children}
    </span>
    {success ? null : <ErrorIcon>{error_info}</ErrorIcon>}
    <ClickableIcon
      onClick={() => onTransform({ type: 'delete' })}
      main='text-secondary opacity-50'
      alt='text-danger'
    >delete</ClickableIcon>
  </span>;
}

export default function App() {
  const [initialTable, setInitialTable] = useState(gen_displayable_table);
  const [transforms, setTransforms] = useState([]);

  function onTransform(e, idx) {
    const { type } = e;
    e = clone(e);
    delete e.type;
    const t = transforms.slice();
    if (type === 'insert') { // insert after idx
      if (!e.show_previous && idx >= 0 && !t[idx].collapsed) {
        t[idx] = clone(t[idx]);
        t[idx].collapsed = !e.keep_previous;
      }
      e.collapsed = e.collapsed || false;
      if (idx === transforms.length - 1) {
        e.collapsed = false;
      }
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
    let error_info = null;
    try {
      transformer = Transform[t.action](t);
    } catch (e) {
      error_info = e;
      transformer = {
        render() {
          return 'Corrupted';
        },
      };
    }
    const rendered = transformer.render(cur);
    let success = false;
    try {
      cur = transformer.run(cur);
      success = true;
    } catch (e) {
      if (!error_info) {
        error_info = e;
      }
    }
    stash.push([success, trans_idx, t, error_info, rendered]);
    if (!t.collapsed) {
      display_tables.push(<div key={display_tables.length}>
        <div className='mb-3'>
          <ol className='breadcrumb'>
            <li className='breadcrumb-item' />
            {stash.map(([success, trans_idx, t, error_info, rendered], idx) => (
              <li key={idx} className='breadcrumb-item'>
                <TransformBadge
                  success={success}
                  onTransform={(e) => onTransform(e, trans_idx)}
                  t_data={t}
                  error_info={error_info}
                >
                  {rendered}
                </TransformBadge>
              </li>
            ))}
            <li className='breadcrumb-item' />
          </ol>
        </div>
        <div className='card mb-3 shadow-sm position-relative'>
          <div className='d-flex flex-row position-absolute top-0 end-0'>
            <div className='pt-2 pe-1'>
              {cur.can_display_in_table() && !cur.display_table ? <span className='me-2'>
                <ClickableIcon
                  onClick={() => {
                    onTransform({
                      type: 'insert',
                      action: 'DisplayInTable',
                      keep_previous: true,
                    }, trans_idx);
                  }}
                  main='text-secondary'
                  alt='text-success'
                >table</ClickableIcon>
              </span> : null}
              {trans_idx < transforms.length - 1 ? <span className='me-2'><ClickableIcon
                onClick={() => {
                  let t_data = clone(t);
                  t_data.collapsed = true;
                  t_data.type = 'update';
                  onTransform(t_data, trans_idx);
                }}
                main='text-secondary'
                alt='text-success'
              >
                {'unfold_less'}
              </ClickableIcon></span> : null}
            </div>
          </div>
          <div className='card-body'>
            <TableDisplay
              table={cur}
              onTransform={(e) => onTransform(e, trans_idx)}
            />
          </div>
        </div>
      </div>);
      stash = [];
    }
    tables.push(cur);
  }
  const id = useId();
  return <div className='container pt-3'>
    <div className='card mb-3 shadow-sm'>
      <div className='card-header d-flex flex-row'>
        <div>Input</div>
        <div className='ms-auto form-check'>
          <input className='form-check-input' type='checkbox' value={true} id={id} checked disabled />
          <label className='form-check-label' htmlFor={id}>
            Locked
          </label>
        </div>
      </div>
      <div className='card-body'>
        <TableDisplay
          table={tables[0]}
          onTransform={(e) => onTransform(e, -1)}
        />
      </div>
    </div>
    {display_tables}
  </div>;
}
