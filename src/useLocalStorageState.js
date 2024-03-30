import { useState, useEffect } from "react";

export function useLocalStorageState(initialState, Key) {
  const [value, setValue] = useState(function () {
    const storeMovie = localStorage.getItem(Key);
    return JSON.parse(storeMovie) || initialState;
  });
  useEffect(
    function () {
      localStorage.setItem(Key, JSON.stringify(value));
    },
    [value, Key]
  );
  return [value, setValue];
}
