import { useState, useId, useEffect, useRef, useMemo } from 'react';
import { TableDisplay } from './table.js';
import { clone, useStateParams } from './utils.js';
import * as Transform from './transform.js';
import { HoverIcon, ClickableIcon, ErrorIcon } from './components/icon.js';
import { example_input, example_input_text, input_to_table } from './input.js';
import { EditorView, basicSetup } from "codemirror";
import { json as json_lang} from "@codemirror/lang-json";
import { EditorState } from '@codemirror/state';

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

function InputEditor({ value, on_save }) {
  const ref = useRef(null);
  const [editor, setEditor] = useState(null);
  const [can_apply, set_can_apply] = useState(false);
  useEffect(() => {
    if (editor === null) {
      const state = EditorState.create({
        doc: value,
        extensions: [
          basicSetup, json_lang(),
          EditorView.updateListener.of(update => {
            if (update.docChanged) {
              set_can_apply(true);
            }
          }),
        ],
      });
      setEditor(new EditorView({
        state,
        parent: ref.current,
      }));
      return;
    }
    return () => {
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);
  return <>
    <div ref={ref} style={{
      width: '100%',
    }} />
    <button
      type='button'
      className='btn mt-3 btn-primary'
      disabled={!can_apply}
      onClick={() => {
        set_can_apply(false);
        on_save(editor.state.doc.toString());
      }}
    >{can_apply ? 'Apply' : 'Up to date'}</button>
  </>;
}

export default function App() {
  const [input_text, set_input_text] = useStateParams(
    example_input_text,
    'input',
    (t) => t,
    (t) => t,
  );
  const [initialTable, setInitialTable] = useState(() => {
    return input_to_table(JSON.parse(input_text));
  });
  const [transforms, setTransforms] = useStateParams(
    [],
    'transforms',
    (t) => JSON.stringify(t),
    (t) => JSON.parse(t),
  );

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
  const last_table = tables[tables.length - 1];
  return <div className='d-flex flex-column min-vh-100'><div className='container pt-3 flex-grow-1'>
    <div className='card mb-3 shadow-sm'>
      <div className='card-header d-flex flex-row'>
        <div>Input</div>
      </div>
      <div className='card-body'>
        <InputEditor value={input_text} on_save={(val) => {
          set_input_text(val);
          try {
            setInitialTable(input_to_table(JSON.parse(val)));
          } catch (e) {
            window.alert(e);
          }
        }} />
        <button
          type='button'
          className='btn btn-danger ms-2 mt-3'
          disabled={transforms.length === 0}
          onClick={() => {
            setTransforms([]);
          }}
        >Clear Transforms</button>
      </div>
    </div>
    <div className='card mb-3 shadow-sm'>
      <div className='card-body'>
        <TableDisplay
          table={tables[0]}
          onTransform={(e) => onTransform(e, -1)}
        />
      </div>
    </div>
    {display_tables}
    {!last_table.display_table && !last_table.can_display_in_table()
      ? <div className='alert alert-secondary' role='alert'>
        {last_table.to_table_fail_reason()}
      </div>
      : null
    }
  </div>
    <div className='border-top pt-3'>
      <footer className='container d-flex flex-wrap justify-content-between align-items-center mb-3'>
        <div className='col-md-4 d-flex align-items-center'>
          Simplex Display
        </div>
        <ul className='nav col-md-4 justify-content-end list-unstyled d-flex'>
          <li>
            <a
              className='text-decoration-none'
              href='https://github.com/sshockwave/simplex-display'
            >
              <HoverIcon
                main={'text-secondary'}
                alt={'text-primary'}
              >code</HoverIcon>
            </a>
          </li>
        </ul>
      </footer>
    </div>
  </div>;
}
