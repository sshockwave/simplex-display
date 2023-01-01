import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Out-of-place version of Array.prototype.splice()
export function splice(arr, ...args) {
  arr = arr.slice();
  arr.splice(...args);
  return arr;
}

export function clone(obj) {
  return Object.assign({}, obj);
}

export function useStateParams(initialState, paramsName, serialize, deserialize) {
  const navigate = useNavigate();
  const location = useLocation();
  const search = new URLSearchParams(location.search);

  const existingValue = search.get(paramsName);
  const [state, setState] = useState(
    existingValue ? deserialize(existingValue) : initialState
  );

  useEffect(() => {
    // Updates state when user navigates backwards or forwards in browser history
    if (existingValue && deserialize(existingValue) !== state) {
      setState(deserialize(existingValue));
    }
  }, [existingValue]);

  const onChange = (s) => {
    setState(s);
    const searchParams = new URLSearchParams(location.search);
    searchParams.set(paramsName, serialize(s));
    const pathname = location.pathname;
    navigate({ pathname, search: searchParams.toString() });
  };

  return [state, onChange];
}
