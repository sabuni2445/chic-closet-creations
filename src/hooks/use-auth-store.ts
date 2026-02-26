import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CustomerUser {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    created_at: string;
}

interface CustomerAuthState {
    currentUser: CustomerUser | null;
    users: (CustomerUser & { password: string })[];

    register: (name: string, email: string, phone: string, password: string) => { success: boolean; error?: string };
    login: (email: string, password: string) => { success: boolean; error?: string };
    logout: () => void;
    updateProfile: (data: Partial<Omit<CustomerUser, 'id' | 'created_at'>>) => void;
}

export const useAuthStore = create<CustomerAuthState>()(
    persist(
        (set, get) => ({
            currentUser: null,
            users: [],

            register: (name, email, phone, password) => {
                const { users } = get();
                if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
                    return { success: false, error: 'An account with that email already exists.' };
                }
                const newUser: CustomerUser & { password: string } = {
                    id: crypto.randomUUID(),
                    name,
                    email,
                    phone,
                    password,
                    created_at: new Date().toISOString(),
                };
                set({ users: [...users, newUser], currentUser: { id: newUser.id, name, email, phone, created_at: newUser.created_at } });
                return { success: true };
            },

            login: (email, password) => {
                const { users } = get();
                const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
                if (!user) return { success: false, error: 'Invalid email or password.' };
                set({ currentUser: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address, created_at: user.created_at } });
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
        }),
        { name: 'chic-closet-auth' }
    )
);
