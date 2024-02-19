import useHover from "./hooks/useHover"
import { useState } from "react";

function getRandomColor() {
  const colors = ["green", "blue", "purple", "red", "pink"];
  return colors[Math.floor(Math.random() * colors.length)];
}

export default function Home() {
  const [ref, hovering] = useHover();
  const [isVisible, toggleVisible] = useState(false);

  const backgroundColor = hovering
    ? `var(--${getRandomColor()})`
    : "var(--charcoal)";

  return (
    <section>
      <h1>Demo</h1>
      <button onClick={() => toggleVisible((prev) => !prev)}>Display</button>
      {isVisible && (
        <article ref={ref} style={{ backgroundColor }}>
          Hovering? {hovering ? "Yes" : "No"}
        </article>
      )}
    </section>
  );
}
