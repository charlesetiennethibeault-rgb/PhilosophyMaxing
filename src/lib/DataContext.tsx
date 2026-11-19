import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { Family, Theme } from './types'

interface Data {
  families: Family[]
  themes: Theme[]
  family: (id: string) => Family
  familyIdx: (id: string) => number
}

const FALLBACK: Family = { id: '?', name: 'Sans famille', color: '#8a8070', order: 0 }
const Ctx = createContext<Data>({ families: [], themes: [], family: () => FALLBACK, familyIdx: () => 0 })

export function DataProvider({ families, themes, children }: { families: Family[]; themes: Theme[]; children: ReactNode }) {
  const value = useMemo<Data>(() => {
    const sorted = [...families].sort((a, b) => a.order - b.order)
    return {
      families: sorted,
      themes: [...themes].sort((a, b) => a.order - b.order),
      family: (id) => sorted.find((f) => f.id === id) ?? FALLBACK,
      familyIdx: (id) => Math.max(0, sorted.findIndex((f) => f.id === id)),
    }
  }, [families, themes])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useData = () => useContext(Ctx)
