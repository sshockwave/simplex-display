import { useState, useEffect, useRef } from 'react';
import { createPopper } from '@popperjs/core';

export function InlinePopper({ content, children }) {
  const main_el = useRef(null);
  const content_el = useRef(null);
  const arrow_el = useRef(null);
  const [showActions, setShowActions] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  useEffect(() => {
    if (!showActions) {
      return;
    }
    const popper = createPopper(main_el.current, content_el.current, {
      modifiers: [
        { name: 'arrow', options: { element: arrow_el.current } },
        { name: 'eventListeners', options: { scroll: showActions, resize: showActions } },
        { name: 'offset', options: { offset: [0, 8] } },
      ],
    });
    function handleClick() {
      if (isClicked) {
        setIsClicked(false);
      } else {
        setShowActions(false);
      }
    }
    document.addEventListener('click', handleClick);
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
    {showActions ? <div className={`popover bs-popover-auto`} ref={content_el}>
      <div className='popover-arrow' ref={arrow_el}/>
      <div className='popover-inner'>
        {content}
      </div>
    </div> : null}
  </span>
}
