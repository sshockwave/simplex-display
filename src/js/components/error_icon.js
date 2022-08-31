import { Tooltip } from 'bootstrap';
import { useState, useRef, useEffect } from 'react';

function HoverIcon({ children, main, alt }) {
  const [hover, setHover] = useState(false);
  return <span
    class={`material-icon ${hover ? alt : main}`}
    onMouseOver={() => setHover(true)}
    onMouseLeave={() => setHover(false)}
  >
    error
  </span>;
}

export function ErrorIcon({ children }) {
  const ref = useRef();
  useEffect(() => {
    const tooltip = new Tooltip(ref.current);
    console.log(tooltip);
    return () => {
      tooltip.dispose();
    }
  });
  return <span ref={ref} data-bs-title={children}>
    <HoverIcon main='text-danger opacity-50' alt='text-danger'>error</HoverIcon>
  </span>;
}
