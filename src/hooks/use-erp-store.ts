import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    ERPProduct, ProductVariant, InventoryBatch, InventoryTransaction,
    Order, OrderItem, OrderItemBatch, Invoice, Payment,
    JournalEntry, CostMethod, TransactionType, Employee,
    Category, Brand, Reservation, EmployeeTask, ReservationStatus,
    ERPLocation, ERPLocationType
} from "../types/erp";

export interface ERPLog {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    entity: string;
    entity_id: string;
    details: string;
}

interface ERPState {
    products: ERPProduct[];
    variants: ProductVariant[];
    batches: InventoryBatch[];
    transactions: InventoryTransaction[];
    orders: Order[];
    orderItems: OrderItem[];
    orderItemBatches: OrderItemBatch[];
    invoices: Invoice[];
    payments: Payment[];
    journalEntries: JournalEntry[];
    employees: Employee[];
    categories: Category[];
    brands: Brand[];
    logs: ERPLog[];
    costMethod: CostMethod;
    isPeriodLocked: boolean;
    reservations: Reservation[];
    tasks: EmployeeTask[];
    currentUser: Employee | null;
    locations: ERPLocation[];
    login: (username: string, password: string) => boolean;
    logout: () => void;
    addLocation: (location: ERPLocation) => Promise<void>;
    updateLocation: (id: string, location: Partial<ERPLocation>) => void;
    deleteLocation: (id: string) => void;
    transferStock: (params: {
        variantId: string;
        fromLocationId: string;
        toLocationId: string;
        quantity: number;
        reason?: string;
    }) => void;

    // Core Actions
    addProduct: (product: ERPProduct) => Promise<void>;
    updateProduct: (id: string, product: Partial<ERPProduct>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    addVariant: (variant: ProductVariant) => Promise<void>;
    updateVariant: (id: string, variant: Partial<ProductVariant>) => Promise<void>;
    addCategory: (category: Category) => Promise<void>;
    addBrand: (brand: Brand) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    deleteBrand: (id: string) => Promise<void>;
    addBatch: (batch: Omit<InventoryBatch, 'id'>) => Promise<void>;
    setCostMethod: (method: CostMethod) => void;

    // Modified Actions for Financial Integrity
    voidBatch: (id: string, reason: string) => void;
    updateBatch: (id: string, batch: Partial<InventoryBatch>) => void;
    addEmployee: (employee: Employee) => Promise<void>;
    updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
    deleteEmployee: (id: string) => Promise<void>;
    lockPeriod: () => void;
    unlockPeriod: () => void;

    // Transactional Business Logic
    processSale: (customerId: string, items: { variantId: string, quantity: number, price: number }[]) => Promise<string | null>;
    processPayment: (invoiceId: string, amount: number, method: string) => Promise<void>;
    processReturn: (orderId: string, items: { orderItemId: string, quantity: number }[]) => void;
    processRefund: (returnId: string, amount: number, method: string) => void;

    // Reservation & Staff Actions
    requestReservation: (reservation: Omit<Reservation, 'id' | 'status' | 'created_at'>) => Promise<void>;
    updateReservationStatus: (id: string, status: ReservationStatus, prepayment?: number) => Promise<void>;
    recordPrepayment: (id: string, amount: number, method: string) => Promise<void>;
    addTask: (task: Omit<EmployeeTask, 'id' | 'created_at'>) => Promise<void>;
    updateTaskStatus: (id: string, status: EmployeeTask['status']) => Promise<void>;

    // Stock Adjustment (Damage / Loss / Correction / Return)
    adjustStock: (params: {
        batchId: string;
        type: 'damage' | 'loss' | 'found' | 'correction';
        quantity: number;   // positive = add, negative = remove
        reason: string;
    }) => Promise<void>;

    // Helpers
    getInventoryValue: () => number;
    getTotalRevenue: () => number;
    getCashReceived: () => number;
    getTotalCOGS: () => number;
    getNetProfit: () => number;
    addLog: (action: string, entity: string, id: string, details: string) => void;
    fetchERPState: () => Promise<void>;
}

import { api } from "../lib/api";

export const useERPStore = create<ERPState>()(
    persist(
        (set, get) => ({
            products: [],
            variants: [],
            batches: [],
            transactions: [],
            orders: [],
            orderItems: [],
            orderItemBatches: [],
            invoices: [],
            payments: [],
            journalEntries: [],
            employees: [],
            logs: [],
            isPeriodLocked: false,
            reservations: [],
            tasks: [],
            categories: [], // Loaded from backend
            brands: [],     // Loaded from backend
            costMethod: 'FIFO',
            currentUser: null,
            locations: [],  // Loaded from backend

            fetchERPState: async () => {
                try {
                    const state = await api.get('/erp/state');
                    set({
                        products: state.products || [],
                        variants: state.variants || [],
                        batches: state.batches || [],
                        transactions: state.transactions || [],
                        categories: state.categories || [],
                        brands: state.brands || [],
                        locations: state.locations || [],
                        reservations: state.reservations || [],
                        journalEntries: state.journalEntries || [],
                        employees: state.employees || [],
                        orders: state.orders || [],
                        invoices: state.invoices || [],
                        payments: state.payments || [],
                        tasks: state.tasks || []
                    });
                    console.log("ERP State synced with MySQL");
                } catch (error) {
                    console.error("Failed to sync with MySQL:", error);
                }
            },

            login: (username, password) => {
                const u = username.trim().toLowerCase().replace(/^@/, '');
                const p = password.trim();
                const emp = get().employees.find(e =>
                    (e.username?.toLowerCase() === u || e.email.toLowerCase() === u) &&
                    e.password === p &&
                    e.status === 'active'
                );
                if (emp) {
                    set({ currentUser: emp });
                    get().addLog("LOGIN", "Auth", emp.id, `User ${emp.name} logged in`);
                    return true;
                }
                return false;
            },

            logout: () => {
                const user = get().currentUser;
                if (user) get().addLog("LOGOUT", "Auth", user.id, `User ${user.name} logged out`);
                set({ currentUser: null });
            },

            addLog: (action, entity, id, details) => set((state) => ({
                logs: [{
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                    user: "Admin",
                    action,
                    entity,
                    entity_id: id,
                    details
                }, ...state.logs].slice(0, 500)
            })),

            addLocation: async (location) => {
                try {
                    await api.post('/locations', location);
                    await get().fetchERPState();
                    get().addLog("CREATE", "Location", location.id, `Added location: ${location.name}`);
                } catch (e: any) {
                    console.error("Failed to add location:", e);
                }
            },
            updateLocation: (id, loc) => set(state => ({
                locations: state.locations.map(l => l.id === id ? { ...l, ...loc } : l)
            })),
            deleteLocation: (id) => set(state => ({
                locations: state.locations.filter(l => l.id !== id)
            })),

            transferStock: ({ variantId, fromLocationId, toLocationId, quantity, reason = "Internal Transfer" }) => {
                const state = get();
                const availableAtOrigin = state.batches
                    .filter(b => b.product_variant_id === variantId && b.location_id === fromLocationId)
                    .reduce((sum, b) => sum + b.quantity_remaining, 0);

                if (availableAtOrigin < quantity) throw new Error("Insufficient stock at origin location");

                let remainingToTransfer = quantity;
                const updatedBatches = [...state.batches];
                const newTransactions: InventoryTransaction[] = [];
                const timestamp = new Date().toISOString();

                // Find batches at origin to deduct from
                const originBatches = updatedBatches.filter(b => b.product_variant_id === variantId && b.location_id === fromLocationId);

                for (const batch of originBatches) {
                    if (remainingToTransfer <= 0) break;
                    const canTake = Math.min(batch.quantity_remaining, remainingToTransfer);

                    const bIdx = updatedBatches.findIndex(b => b.id === batch.id);
                    updatedBatches[bIdx].quantity_remaining -= canTake;

                    // Create new batch at destination for the transfer
                    const newBatchId = crypto.randomUUID();
                    updatedBatches.push({
                        ...batch,
                        id: newBatchId,
                        location_id: toLocationId,
                        quantity_remaining: canTake,
                        quantity_reserved: 0,
                    });

                    // Log OUT from origin
                    newTransactions.push({
                        id: crypto.randomUUID(), product_variant_id: variantId, batch_id: batch.id,
                        location_id: fromLocationId, type: 'TRANSFER', quantity: canTake,
                        reference_type: 'TRANSFER_OUT', reference_id: toLocationId, created_at: timestamp
                    });

                    // Log IN to destination
                    newTransactions.push({
                        id: crypto.randomUUID(), product_variant_id: variantId, batch_id: newBatchId,
                        location_id: toLocationId, type: 'TRANSFER', quantity: canTake,
                        reference_type: 'TRANSFER_IN', reference_id: fromLocationId, created_at: timestamp
                    });

                    remainingToTransfer -= canTake;
                }

                set({ batches: updatedBatches, transactions: [...state.transactions, ...newTransactions] });
                get().addLog("TRANSFER", "Stock", variantId, `Moved ${quantity} units from ${fromLocationId} to ${toLocationId}`);
            },

            addProduct: async (product) => {
                try {
                    await api.post('/products', product);
                    await get().fetchERPState();
                    get().addLog("CREATE", "Product", product.id, `Added product: ${product.name}`);
                } catch (e: any) {
                    console.error("Failed to add product:", e);
                    throw e;
                }
            },

            updateProduct: async (id, data) => {
                try {
                    await api.patch(`/products/${id}`, data);

                    // Refresh full state
                    await get().fetchERPState();

                    get().addLog("UPDATE", "Product", id, `Updated product details`);
                } catch (e: any) {
                    console.error("Failed to update product:", e);
                    throw e;
                }
            },

            deleteProduct: async (id) => {
                try {
                    await api.delete(`/products/${id}`);
                    await get().fetchERPState();
                    get().addLog("DELETE", "Product", id, `Removed product from system`);
                } catch (e: any) {
                    console.error("Failed to delete product:", e);
                    throw e;
                }
            },

            addVariant: async (variant) => {
                try {
                    await api.post('/variants', variant);
                    await get().fetchERPState();
                } catch (e: any) {
                    console.error("Failed to add variant:", e);
                    throw e;
                }
            },

            updateVariant: async (id, data) => {
                try {
                    await api.patch(`/variants/${id}`, data);
                    await get().fetchERPState();
                } catch (e: any) {
                    console.error("Failed to update variant:", e);
                }
            },

            addCategory: async (category) => {
                try {
                    await api.post('/categories', { name: category.name });
                    await get().fetchERPState();
                } catch (e: any) {
                    console.error("Failed to add category:", e);
                }
            },

            addBrand: async (brand) => {
                try {
                    await api.post('/brands', { name: brand.name });
                    await get().fetchERPState();
                } catch (e: any) {
                    console.error("Failed to add brand:", e);
                }
            },

            deleteCategory: async (id) => {
                try {
                    await api.delete(`/categories/${id}`);
                    await get().fetchERPState();
                } catch (e: any) {
                    console.error("Failed to delete category:", e);
                }
            },

            deleteBrand: async (id) => {
                try {
                    await api.delete(`/brands/${id}`);
                    await get().fetchERPState();
                } catch (e: any) {
                    console.error("Failed to delete brand:", e);
                }
            },

            addBatch: async (batch) => {
                const locId = batch.location_id || "main"; // Fallback to main
                try {
                    await api.post('/batches', {
                        ...batch,
                        location_id: locId,
                        unit_cost: Number(batch.unit_cost)
                    });

                    // Refresh full state
                    await get().fetchERPState();

                    get().addLog("STOCK", "Batch", "NEW", `Added stock to ${locId}: ${batch.quantity_remaining} units`);
                } catch (e: any) {
                    console.error("Batch creation failed:", e);
                }
            },

            setCostMethod: (method) => {
                set({ costMethod: method });
                get().addLog("CONFIG", "System", "CostMethod", `Costing method set to ${method}`);
            },

            addEmployee: async (employee) => {
                try {
                    await api.post('/employees', employee);
                    await get().fetchERPState();
                    get().addLog("HIRE", "Employee", employee.id, `Hired: ${employee.name}`);
                } catch (e: any) {
                    console.error("Failed to add employee:", e);
                }
            },

            updateEmployee: async (id, data) => {
                try {
                    await api.patch(`/employees/${id}`, data);
                    await get().fetchERPState();
                } catch (e: any) {
                    console.error("Failed to update employee:", e);
                }
            },

            deleteEmployee: async (id) => {
                try {
                    await api.delete(`/employees/${id}`);
                    await get().fetchERPState();
                    get().addLog("TERMINATE", "Employee", id, `Removed record`);
                } catch (e: any) {
                    console.error("Failed to delete employee:", e);
                }
            },

            lockPeriod: () => {
                set({ isPeriodLocked: true });
                get().addLog("LOCK", "System", "Period", "Fiscal period locked");
            },

            unlockPeriod: () => {
                set({ isPeriodLocked: false });
                get().addLog("UNLOCK", "System", "Period", "Fiscal period unlocked");
            },

            voidBatch: (id, reason) => {
                const batch = get().batches.find(b => b.id === id);
                if (!batch) return;

                set((state) => ({
                    batches: state.batches.map(b => b.id === id ? { ...b, quantity_remaining: 0, status: 'void' } as any : b)
                }));
                get().addLog("VOID", "Batch", id, `Voided batch. Reason: ${reason}`);
            },

            updateBatch: (id, data) => set((state) => ({
                batches: state.batches.map(b => b.id === id ? { ...b, ...data } : b)
            })),

            processSale: async (customerId, items) => {
                if (get().isPeriodLocked) return null;

                try {
                    const result = await api.post('/orders', {
                        customerId,
                        items,
                        costMethod: get().costMethod
                    });

                    // Refresh full state to stay in sync
                    await get().fetchERPState();

                    get().addLog("SALE", "Order", result.orderId, `Processed sale: $${result.totalOrderAmount}`);
                    return result.orderId;
                } catch (e: any) {
                    console.error("Sale transaction failed:", e);
                    return null;
                }
            },

            processPayment: async (invoiceId, amount, method) => {
                if (get().isPeriodLocked) return;
                try {
                    await api.post('/payments', { invoiceId, amount, paymentMethod: method });

                    // Refresh full state
                    await get().fetchERPState();

                    get().addLog("PAYMENT", "Invoice", invoiceId, `Recorded payment of $${amount}`);
                } catch (e: any) {
                    console.error("Payment registration failed:", e);
                }
            },

            processReturn: (orderId, returnItems) => {
                if (get().isPeriodLocked) return;
                set((state) => {
                    const updatedBatches = [...state.batches];
                    const newTransactions: InventoryTransaction[] = [];
                    let totalCOGSReversal = 0;
                    let totalRevenueReversal = 0;

                    for (const ret of returnItems) {
                        const orderItem = state.orderItems.find(oi => oi.id === ret.orderItemId);
                        if (!orderItem) continue;
                        totalRevenueReversal += (ret.quantity * orderItem.price_at_time);
                        const itemBatches = state.orderItemBatches.filter(oib => oib.order_item_id === ret.orderItemId);
                        let remainingToRestore = ret.quantity;

                        for (const ib of itemBatches) {
                            if (remainingToRestore <= 0) break;
                            const restoreQty = Math.min(ib.quantity, remainingToRestore);
                            const bIdx = updatedBatches.findIndex(b => b.id === ib.batch_id);
                            if (bIdx !== -1) {
                                updatedBatches[bIdx] = { ...updatedBatches[bIdx], quantity_remaining: updatedBatches[bIdx].quantity_remaining + restoreQty };
                                totalCOGSReversal += (restoreQty * ib.cost_at_time);
                                newTransactions.push({
                                    id: crypto.randomUUID(), product_variant_id: orderItem.product_variant_id,
                                    batch_id: ib.batch_id, location_id: (updatedBatches[bIdx].location_id || "main"),
                                    type: 'RETURN', quantity: restoreQty,
                                    reference_type: 'RETURN', reference_id: orderId, created_at: new Date().toISOString()
                                });
                                remainingToRestore -= restoreQty;
                            }
                        }
                    }

                    const journalEntry: JournalEntry = {
                        id: crypto.randomUUID(), date: new Date().toISOString(),
                        description: `Return for Order ${orderId}`, reference_type: 'RETURN', reference_id: orderId,
                        items: [
                            { account_name: 'Sales Returns', debit: totalRevenueReversal, credit: 0 },
                            { account_name: 'Accounts Receivable', debit: 0, credit: totalRevenueReversal },
                            { account_name: 'Inventory', debit: totalCOGSReversal, credit: 0 },
                            { account_name: 'COGS', debit: 0, credit: totalCOGSReversal }
                        ]
                    };

                    return { batches: updatedBatches, transactions: [...state.transactions, ...newTransactions], journalEntries: [...state.journalEntries, journalEntry] };
                });
                get().addLog("RETURN", "Order", orderId, "Processed customer return items");
            },

            processRefund: (returnId, amount, method) => {
                const journalEntry: JournalEntry = {
                    id: crypto.randomUUID(), date: new Date().toISOString(), description: `Refund for Return ${returnId}`, reference_type: 'REFUND', reference_id: returnId,
                    items: [
                        { account_name: 'Accounts Receivable', debit: amount, credit: 0 },
                        { account_name: 'Cash', debit: 0, credit: amount }
                    ]
                };
                set((state) => ({ journalEntries: [...state.journalEntries, journalEntry] }));
                get().addLog("REFUND", "Return", returnId, `Refunded $${amount}`);
            },

            requestReservation: async (res) => {
                const state = get();
                const variantId = res.product_variant_id;

                try {
                    // 1. Post to backend
                    await api.post('/reservations', {
                        customer_name: res.customer_name,
                        customer_phone: res.customer_phone,
                        product_variant_id: variantId,
                        notes: res.notes
                    });

                    // 2. Refresh full state from backend to get the new ID and updated stock
                    await get().fetchERPState();

                    get().addLog("RESERVE", "Reservation", "NEW", `New reservation request from ${res.customer_name}`);
                } catch (error) {
                    console.error("Reservation Error:", error);
                    throw error;
                }
            },

            updateReservationStatus: async (id, status, prepayment) => {
                try {
                    await api.patch(`/reservations/${id}`, { status, prepayment });

                    // Refresh full state
                    await get().fetchERPState();

                    get().addLog("STATUS", "Reservation", id, `Updated reservation status to ${status}`);
                } catch (e: any) {
                    console.error("Failed to update reservation status:", e);
                }
            },

            recordPrepayment: async (id, amount, method) => {
                try {
                    await api.post('/prepayments', { id, amount, method });

                    // Refresh full state
                    await get().fetchERPState();

                    get().addLog("PAYMENT", "Reservation", id, `Recorded $${amount} prepayment via ${method}`);
                } catch (e: any) {
                    console.error("Failed to record prepayment:", e);
                }
            },

            addTask: async (task) => {
                try {
                    await api.post('/tasks', task);
                    await get().fetchERPState();
                    get().addLog("TASK", "Employee", task.employee_id, `New task assigned: ${task.title}`);
                } catch (e: any) {
                    console.error("Failed to add task:", e);
                }
            },

            updateTaskStatus: async (id, status) => {
                try {
                    await api.patch(`/tasks/${id}`, { status });
                    await get().fetchERPState();
                } catch (e: any) {
                    console.error("Failed to update task status:", e);
                }
            },

            adjustStock: async ({ batchId, type, quantity, reason }) => {
                try {
                    await api.post('/adjust-stock', { batchId, type, quantity, reason });
                    await get().fetchERPState();
                    get().addLog("ADJUST", "Batch", batchId, `${type.toUpperCase()} adjustment of ${Math.abs(quantity)} units. Reason: ${reason}`);
                } catch (e: any) {
                    console.error("Stock adjustment failed:", e);
                }
            },

            getInventoryValue: () => get().batches.reduce((sum, b) => sum + (Number(b.quantity_remaining) * Number(b.unit_cost)), 0),
            getTotalRevenue: () => get().orders.reduce((sum, o) => sum + Number(o.total_amount), 0),
            getCashReceived: () => get().payments.reduce((sum, p) => sum + Number(p.amount), 0),
            getTotalCOGS: () => get().orderItems.reduce((sum, item) => sum + (Number(item.cost_at_time) * (item.quantity)), 0),
            getNetProfit: () => get().getTotalRevenue() - get().getTotalCOGS()
        }),
        { name: "rina-atelier-erp-v2" }
    )
);
