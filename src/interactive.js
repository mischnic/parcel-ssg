import { render } from "preact";
import { useCallback, useState } from "preact/hooks";

function Counter() {
  const [value, setValue] = useState(0);
  const increment = useCallback(() => {
    setValue(value + 1);
  }, [value]);

  return <button onClick={increment}>Counter: {value}</button>;
}

render(<Counter />, document.getElementById("root"));
