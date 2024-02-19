# useEffect, useRef常見錯誤

這篇用來記錄useEffect與useRef(用來拿取UI的ref)搭配使用時, 開發時最容易犯的錯誤之一, 和其解決方案, 實際上有很多知名的開源library在早期也犯了相同的錯誤, 其主要原因在於對實際可能碰到的情況做了***錯誤的假設***

# 常見錯誤

直接來看下面的程式碼:

```jsx
import { useHover } from "@uidotdev/usehooks";
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
```

當button在第一次被點擊時, 會觸發re-render, 而在該次最新的render,  isVisible為true, 不過hovering卻為false, 其原因就藏在useHover的源碼中, 如下方程式碼:

```jsx
export function useHover() {
  const [hovering, setHovering] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const node = ref.current;

    if (!node) return;

    const handleMouseEnter = () => {
      setHovering(true);
    };

    const handleMouseLeave = () => {
      setHovering(false);
    };

    node.addEventListener("mouseenter", handleMouseEnter);
    node.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      node.removeEventListener("mouseenter", handleMouseEnter);
      node.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return [ref, hovering];
}
```

看完之後我們會發現, article若不是在一開始(initial render)就出現, useEffect裡面的程式邏輯基本上也都不會執行, 因此事件也不會被綁在對應的DOM元素上, 這裡引出了早期開發者在使用useRef來存取DOM元素ref與useEffect時常做的***錯誤假設-*** ref的值總是被定義的(永遠都抓的到), 但在上述的情境中, ref是在button被點擊, re-render後才有定義, 因此在實際使用時, 我們***必須把以下的情況納入考慮***:

1. ref可能一開始並未被定義
2. ref所存取的DOM ref可能在接下來的re-render中變成另一個DOM ref
3. ref即使一開始有被定義, 也有可能在接下來的re-render被更新成**undefined**, **null**

# 官方解法

根據上面的討論, DOM ref必須被確實的更新, 官方給出的解決方法是搭配使用***useCallback***, ***useRef***則是一樣被用來儲存DOM ref, 如下方程式碼:

```jsx
import React, {useCallback, useRef} from 'react'

function useRefWithCallback() {
  const ref = useRef(null)
  const setRef = useCallback(node => {
    if (ref.current) {
      // 清除前一次的side effect
    }
    
    if (node) {
      // 執行該次的side effect
    }
    
    // 把dom ref儲存起來
    ref.current = node
  }, [])
  
  return [setRef]
}
// -----------------------------------------分割線--------------------------------------
function Component() {

  const [ref] = useRefWithCallback()
  
  return <div ref={ref}>Ref element</div>
}
```

在後來useHook更新的版本, 此bug也已經被修正過來了, 也是遵循官方解法的思路 如下:

```jsx
export function useHover() {
  const [hovering, setHovering] = React.useState(false);
  const previousNode = React.useRef(null);

  const handleMouseEnter = React.useCallback(() => {
    setHovering(true);
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    setHovering(false);
  }, []);

  const customRef = React.useCallback(
    (node) => {
      if (previousNode.current?.nodeType === Node.ELEMENT_NODE) {
        previousNode.current.removeEventListener(
          "mouseenter",
          handleMouseEnter
        );
        previousNode.current.removeEventListener(
          "mouseleave",
          handleMouseLeave
        );
      }

      if (node?.nodeType === Node.ELEMENT_NODE) {
        node.addEventListener("mouseenter", handleMouseEnter);
        node.addEventListener("mouseleave", handleMouseLeave);
      }

      previousNode.current = node;
    },
    [handleMouseEnter, handleMouseLeave]
  );

  return [customRef, hovering];
}
```

# 可重複使用的custom hook

不過上方給的useRefWithCallback例子中, ***如何清除前一次的side effect***與***如何執行該次的side effect***程式邏輯都是寫死在該hook裡面, 倘若想要增加該hook的可重複利用性(reusability), 我們可以這樣做改寫:

```jsx
import React, {useCallback, useRef} from 'react'

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
// -----------------------------------------分割線--------------------------------------
const setDivRef = useRefWithCallback(
  node => node.addEventListener("mousedown", onMouseDown),
  node => node.removeEventListener("mousedown", onMouseDown)
)
```

這樣一來, 我們可以根據每個component的需求, 在使用該hook時把處理side effect的相關邏輯傳入, 讓該hook在使用上能夠與個別component的商業邏輯切開, 達到更好的重複利用

# 參考資料

**[Is it safe to use ref.current as useEffect's dependency when ref points to a DOM element?](https://stackoverflow.com/questions/60476155/is-it-safe-to-use-ref-current-as-useeffects-dependency-when-ref-points-to-a-dom)**

**[Ref objects inside useEffect Hooks](https://medium.com/@teh_builder/ref-objects-inside-useeffect-hooks-eb7c15198780)**

**[useCallback Might Be What You Meant By useRef & useEffect](https://medium.com/welldone-software/usecallback-might-be-what-you-meant-by-useref-useeffect-773bc0278ae)**
