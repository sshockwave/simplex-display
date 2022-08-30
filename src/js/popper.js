import { useState, useEffect, useRef } from 'react';
import { createPopper } from '@popperjs/core';

export function InlinePopper({ content, children }) {
  const main_el = useRef(null);
  const content_el = useRef(null);
  const arrow_el = useRef(null);
  const [showActions, setShowActions] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  useEffect(() => {
    const popper = createPopper(main_el.current, content_el.current, {
      modifiers: [
        { name: 'arrow', options: { element: arrow_el.current } },
        { name: 'eventListeners', options: { scroll: showActions, resize: showActions } },
        { name: 'offset', options: { offset: [0, 8] } },
      ],
    });
    function handleClick(ev) {
      if (isClicked) {
        setIsClicked(false);
      } else {
        setShowActions(false);
      }
    }
    if (showActions) {
      document.addEventListener('click', handleClick);
    }
    return () => {
      popper.destroy();
      document.removeEventListener('click', handleClick);
    }
  });
  return <span onClick={() => setIsClicked(true)}>
    <span
      className='is-clickable'
      ref={main_el}
      onClick={()=>setShowActions(true)}
      >{children}</span>
    <div
      className={`popover bs-popover-auto ${showActions ? '' : 'd-none'}`}
      ref={content_el}
      >
      <div className='popover-arrow' ref={arrow_el}/>
      <div className='popover-inner'>
        {content}
      </div>
    </div>
  </span>
}
