import katex from 'katex';

export function var_to_math(s) {
  s = s.replace(/^([a-zA-Z]+)(\d+)/, "$1_$2"); // x1 -> x_1
  return `{${s}}`;
}

export function Equation({ src }) {
  return <span dangerouslySetInnerHTML={katex.renderToString(src)}></span>;
}
