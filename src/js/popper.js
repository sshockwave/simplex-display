import { useState, useEffect } from 'react';
import { usePopper } from 'react-popper';

export function InlinePopper({ el, children }) {
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const [arrowElement, setArrowElement] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    modifiers: [
      { name: 'arrow', options: { element: arrowElement } },
      { name: 'eventListeners', options: { scroll: showActions, resize: showActions } },
    ],
  });
  useEffect(() => {
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
      document.removeEventListener('click', handleClick);
    }
  });
  return <span onClick={() => setIsClicked(true)}>
    <span
      className='is-clickable'
      ref={setReferenceElement}
      onClick={()=>setShowActions(true)}
      >{children}</span>
    <div
      className={`popover bs-popover-auto ${showActions ? '' : 'd-none'}`}
      ref={setPopperElement}
      style={styles.popper}
      {...attributes.popper}
      >
      <div className='popover-arrow' ref={setArrowElement} style={styles.arrow}/>
      <div className='popover-body'>{el}</div>
    </div>
  </span>
}
