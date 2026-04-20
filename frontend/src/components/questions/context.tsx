import { createContext, useContext } from "react"

export type RespondContextValue = {
  responseId: string | null
}

export const RespondContext = createContext<RespondContextValue>({
  responseId: null,
})

export function useRespondContext() {
  return useContext(RespondContext)
}
