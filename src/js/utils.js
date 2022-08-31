// Out-of-place version of Array.prototype.splice()
export function splice(arr, ...args) {
  arr = arr.slice();
  arr.splice(...args);
  return arr;
}

export function clone(obj) {
  return Object.assign({}, obj);
}
