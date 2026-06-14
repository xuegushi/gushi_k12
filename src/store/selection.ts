import { create } from 'zustand'

interface SelectionState {
  selectedText: string
  poemContext: { title: string; author: string; content: string } | null
  aiPrompt: string
  setSelectedText: (text: string) => void
  setPoemContext: (ctx: { title: string; author: string; content: string } | null) => void
  setAiPrompt: (text: string) => void
}

export const useSelectionStore = create<SelectionState>(set => ({
  selectedText: '',
  poemContext: null,
  aiPrompt: '',
  setSelectedText: (text) => set({ selectedText: text }),
  setPoemContext: (ctx) => set({ poemContext: ctx }),
  setAiPrompt: (text) => set({ aiPrompt: text }),
}))
