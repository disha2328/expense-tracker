import { useState } from "react";

function useLocalStorage(key, initialValue) {

  const [value, setValue] = useState(() => {
    const savedValue = localStorage.getItem(key);

    return savedValue
      ? JSON.parse(savedValue)
      : initialValue;
  });

  const saveValue = (newValue) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  };

  return [value, saveValue];
}

export default useLocalStorage;