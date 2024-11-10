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

async function compressData(str) {
  const textEncoder = new TextEncoder();
  const uint8Array = textEncoder.encode(str);

  const cs = new CompressionStream('gzip');
  const compressedStream = new ReadableStream({
    async start(controller) {
      controller.enqueue(uint8Array);
      controller.close();
    }
  }).pipeThrough(cs);

  const reader = compressedStream.getReader();
  const chunks = [];
  while (({ done, value } = await reader.read()) && !done) {
    chunks.push(String.fromCharCode(...new Uint8Array(value)));
  }
  return btoa(chunks.join(''));
}

async function decompressData(str) {
  const textDecoder = new TextDecoder();
  const uint8Array = new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)));
  const cs = new DecompressionStream('gzip');
  const decompressedStream = new ReadableStream({
    async start(controller) {
      controller.enqueue(uint8Array);
      controller.close();
    }
  }).pipeThrough(cs);

  const reader = decompressedStream.getReader();
  const chunks = [];
  while (({ done, value } = await reader.read()) && !done) {
    chunks.push(value);
  }
  const joined_chunks = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    joined_chunks.set(chunk, offset);
    offset += chunk.length;
  }
  return textDecoder.decode(joined_chunks);
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
