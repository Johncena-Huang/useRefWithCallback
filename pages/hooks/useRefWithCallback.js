import { useCallback, useRef } from 'react'

function useRefWithCallback(onMount, onUnmount) {
  const ref = useRef(null)

  const setRef = useCallback(node => {
    if (ref.current) {
      onUnmount(ref.current)
    }

    if (node) {
      onMount(node)
    }
		
		ref.current = node
  }, [onMount, onUnmount])

  return [setRef]
}
export default useRefWithCallback;