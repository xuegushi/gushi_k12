import { create } from 'zustand'
import { db, type User } from '../lib/db'

interface UserState {
  currentUser: User | null
  users: User[]
  loading: boolean
  ensureGuest: () => Promise<User>
  switchUser: (user: User) => void
  createUser: (name: string) => Promise<User>
  loadUsers: () => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,
  users: [],
  loading: true,

  ensureGuest: async () => {
    // Get all guests, keep the first one, remove duplicates
    var allGuests = await db.users.where('guest').equals(1).toArray()
    var guest: User | null = null
    if (allGuests.length > 0) {
      allGuests.sort(function(a, b) { return (a.id || 0) - (b.id || 0) })
      guest = allGuests[0]
      for (var i = 1; i < allGuests.length; i++) {
        if (allGuests[i].id) await db.users.delete(allGuests[i].id!)
      }
    } else {
      var id = await db.users.add({ name: '游客', guest: 1, createdAt: new Date() })
      guest = { id: id as number, name: '游客', guest: 1, createdAt: new Date() }
    }
    var state = get()
    if (!state.currentUser) {
      var savedId = localStorage.getItem('currentUserId')
      if (savedId) {
        var saved = await db.users.get(Number(savedId))
        if (saved) { set({ currentUser: saved }); return saved }
      }
      if (guest) set({ currentUser: guest })
    }
    var cu = get().currentUser
    return cu || guest
  },

  switchUser: (user: User) => {
    set({ currentUser: user })
    localStorage.setItem('currentUserId', String(user.id!))
  },

  createUser: async (name: string) => {
    const guest = get().currentUser
    const id = await db.users.add({ name, guest: 0, createdAt: new Date() })
    const user = { id, name, guest: 0, createdAt: new Date() } as User

    // Inherit all data from guest mode
    if (guest?.guest === 1) {
      const plans = await db.studyPlans.where('userId').equals(guest.id!).toArray()
      for (const p of plans) await db.studyPlans.add({ ...p, userId: id, id: undefined })
      const reviews = await db.reviewRecords.where('userId').equals(guest.id!).toArray()
      for (const r of reviews) await db.reviewRecords.add({ ...r, userId: id, id: undefined })
      const favs = await db.favorites.where('userId').equals(guest.id!).toArray()
      for (const f of favs) await db.favorites.add({ ...f, userId: id, id: undefined })
      const ais = await db.aiConfigs.where('userId').equals(guest.id!).toArray()
      for (const a of ais) await db.aiConfigs.add({ ...a, userId: id, id: undefined })
    }

    get().switchUser(user)
    return user
  },

  loadUsers: async () => {
    var users = await db.users.toArray()
    set({ users, loading: false })
  },
}))
