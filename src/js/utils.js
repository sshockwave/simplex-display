// Out-of-place version of Array.prototype.splice()
export function array_splice(arr, ...args) {
  arr = arr.slice();
  arr.splice(...args);
  return arr;
}
