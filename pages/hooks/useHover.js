import React from 'react'
import useRefWithCallback from './useRefWithCallback'
export default function useHover() {
  const [hovering, setHovering] = React.useState(false);
  const handleMouseEnter = React.useCallback(() => {
    setHovering(true);
  }, []);
  const handleMouseLeave = React.useCallback(() => {
    setHovering(false);
  }, []);
  const [ref] = useRefWithCallback(
    (node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        node.addEventListener("mouseenter", handleMouseEnter);
        node.addEventListener("mouseleave", handleMouseLeave);
      }
    },
    (node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        node.removeEventListener("mouseenter", handleMouseEnter);
        node.removeEventListener("mouseleave", handleMouseLeave);
      }
    }
  )
  return [ref, hovering];
}