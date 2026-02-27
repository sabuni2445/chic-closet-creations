import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    username?: string;
    role: string;
    address?: string;
    created_at: string;
}

interface AuthState {
    currentUser: User | null;
    users: (User & { password: string })[];

    register: (name: string, email: string, phone: string, password: string) => { success: boolean; error?: string };
    addUser: (user: User & { password: string }) => void;
    login: (identifier: string, password: string) => { success: boolean; error?: string };
    logout: () => void;
    updateProfile: (data: Partial<Omit<User, 'id' | 'created_at'>>) => void;
    updateUserRole: (id: string, role: string) => void;
    deleteUser: (id: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            currentUser: null,
            users: [],

            register: (name, email, phone, password) => {
                const { users } = get();
                if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
                    return { success: false, error: 'An account with that email already exists.' };
                }
                const newUser: User & { password: string } = {
                    id: crypto.randomUUID(),
                    name,
                    email,
                    phone,
                    password,
                    role: 'customer',
                    created_at: new Date().toISOString(),
                };
                set({ users: [...users, newUser], currentUser: newUser });
                return { success: true };
            },

            addUser: (user) => {
                const { users } = get();
                // Check if already exists to avoid duplicates
                if (users.find(u => u.id === user.id)) return;
                set({ users: [...users, user] });
            },

            login: (identifier, password) => {
                const { users } = get();
                // Support both email (customers) and username (staff) login
                const user = users.find(u =>
                    (u.email.toLowerCase() === identifier.toLowerCase() || (u.username && u.username.toLowerCase() === identifier.toLowerCase()))
                    && u.password === password
                );
                if (!user) return { success: false, error: 'Invalid credentials.' };
                set({ currentUser: user });
                return { success: true };
            },

            logout: () => set({ currentUser: null }),

            updateProfile: (data) => {
                const { currentUser, users } = get();
                if (!currentUser) return;
                const updatedUser = { ...currentUser, ...data };
                set({
                    currentUser: updatedUser,
                    users: users.map(u => u.id === currentUser.id ? { ...u, ...data } : u),
                });
            },
            updateUserRole: (id, role) => {
                set(state => ({
                    users: state.users.map(u => u.id === id ? { ...u, role } : u),
                    currentUser: state.currentUser?.id === id ? { ...state.currentUser, role } : state.currentUser
                }));
            },
            deleteUser: (id) => {
                set(state => ({
                    users: state.users.filter(u => u.id !== id),
                    currentUser: state.currentUser?.id === id ? null : state.currentUser
                }));
            },
        }),
        { name: 'chic-closet-auth' }
    )
);
