import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

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
    users: User[];

    register: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
    login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateProfile: (data: Partial<Omit<User, 'id' | 'created_at'>>) => void;
    updateUserRole: (id: string, role: string) => void;
    deleteUser: (id: string) => void;
    fetchUsers: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            currentUser: null,
            users: [],

            fetchUsers: async () => {
                try {
                    const users = await api.get('/users');
                    set({ users });
                } catch (error) {
                    console.error("Failed to fetch users");
                }
            },

            register: async (name, email, phone, password) => {
                try {
                    const { user, token } = await api.post('/auth/register', { name, email, phone, password });
                    set({ currentUser: user });
                    localStorage.setItem('chic-closet-token', token);
                    await get().fetchUsers();
                    return { success: true };
                } catch (err: any) {
                    return { success: false, error: err.message || 'Registration failed' };
                }
            },

            login: async (identifier, password) => {
                try {
                    const { user, token } = await api.post('/auth/login', { username: identifier, password });
                    set({ currentUser: user });
                    localStorage.setItem('chic-closet-token', token);
                    return { success: true };
                } catch (err: any) {
                    return { success: false, error: 'Invalid credentials or login failed.' };
                }
            },

            logout: () => {
                set({ currentUser: null });
                localStorage.removeItem('chic-closet-token');
            },

            updateProfile: (data) => {
                const { currentUser, users } = get();
                if (!currentUser) return;
                const updatedUser = { ...currentUser, ...data };
                set({
                    currentUser: updatedUser,
                    users: users.map(u => u.id === currentUser.id ? { ...u, ...data } : u),
                });
            },
            updateUserRole: async (id, role) => {
                try {
                    await api.put(`/users/${id}`, { role });
                    await get().fetchUsers();
                    const { currentUser } = get();
                    if (currentUser?.id === id) {
                        set({ currentUser: { ...currentUser, role } });
                    }
                } catch (error) {
                    console.error("Failed to update user role");
                }
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
