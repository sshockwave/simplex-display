import katex from 'katex';
import 'katex/dist/katex.css';

export function var_to_math(s) {
  s = s.replace(/^([a-zA-Z]+)(\d+)/, "$1_$2"); // x1 -> x_1
  return `{${s}}`;
}

export function Equation({ children }) {
  return <span dangerouslySetInnerHTML={{
    __html: katex.renderToString(children)
  }}></span>;
}
