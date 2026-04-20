import {
  createContext,
  useContext,
  useLayoutEffect,
  type DependencyList,
  type ReactNode,
} from "react"

type HeaderSlotSetter = (node: ReactNode | null) => void

export const HeaderActionContext = createContext<HeaderSlotSetter | null>(null)
export const HeaderNavContext = createContext<HeaderSlotSetter | null>(null)

function useHeaderSlot(
  context: typeof HeaderActionContext,
  render: () => ReactNode,
  deps: DependencyList,
) {
  const setNode = useContext(context)
  useLayoutEffect(() => {
    if (!setNode) return
    setNode(render())
    return () => setNode(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setNode, ...deps])
}

export function useHeaderAction(render: () => ReactNode, deps: DependencyList) {
  useHeaderSlot(HeaderActionContext, render, deps)
}

export function useHeaderNav(render: () => ReactNode, deps: DependencyList) {
  useHeaderSlot(HeaderNavContext, render, deps)
}
