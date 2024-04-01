import { useEffect } from "react";

export function useKey(key, onSelectClose) {
  useEffect(
    function () {
      function callBack(e) {
        if (e.code.toLowerCase() === key.toLowerCase()) {
          onSelectClose();
        }
      }

      document.addEventListener("keydown", callBack);

      return function () {
        document.removeEventListener("keydown", callBack);
      };
    },
    [onSelectClose, key]
  );
}
