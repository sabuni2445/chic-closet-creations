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
    addLocation: (location: ERPLocation) => void;
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
    addProduct: (product: ERPProduct) => void;
    updateProduct: (id: string, product: Partial<ERPProduct>) => void;
    deleteProduct: (id: string) => void;
    addVariant: (variant: ProductVariant) => void;
    updateVariant: (id: string, variant: Partial<ProductVariant>) => void;
    addCategory: (category: Category) => void;
    addBrand: (brand: Brand) => void;
    deleteCategory: (id: string) => void;
    deleteBrand: (id: string) => void;
    addBatch: (batch: Omit<InventoryBatch, 'id'>) => void;
    setCostMethod: (method: CostMethod) => void;

    // Modified Actions for Financial Integrity
    voidBatch: (id: string, reason: string) => void;
    updateBatch: (id: string, batch: Partial<InventoryBatch>) => void;
    addEmployee: (employee: Employee) => void;
    updateEmployee: (id: string, employee: Partial<Employee>) => void;
    deleteEmployee: (id: string) => void;
    lockPeriod: () => void;
    unlockPeriod: () => void;

    // Transactional Business Logic
    processSale: (customerId: string, items: { variantId: string, quantity: number, price: number }[]) => string | null;
    processPayment: (invoiceId: string, amount: number, method: string) => void;
    processReturn: (orderId: string, items: { orderItemId: string, quantity: number }[]) => void;
    processRefund: (returnId: string, amount: number, method: string) => void;

    // Reservation & Staff Actions
    requestReservation: (reservation: Omit<Reservation, 'id' | 'status' | 'created_at'>) => void;
    updateReservationStatus: (id: string, status: ReservationStatus, prepayment?: number) => void;
    recordPrepayment: (id: string, amount: number, method: string) => void;
    addTask: (task: Omit<EmployeeTask, 'id' | 'created_at'>) => void;
    updateTaskStatus: (id: string, status: EmployeeTask['status']) => void;

    // Stock Adjustment (Damage / Loss / Correction / Return)
    adjustStock: (params: {
        batchId: string;
        type: 'damage' | 'loss' | 'correction' | 'return';
        quantity: number;   // positive = add, negative = remove
        reason: string;
    }) => void;

    // Helpers
    getInventoryValue: () => number;
    getTotalRevenue: () => number;
    getCashReceived: () => number;
    getTotalCOGS: () => number;
    getNetProfit: () => number;
    addLog: (action: string, entity: string, id: string, details: string) => void;
}

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
            categories: [
                { id: "Evening", name: "Evening" },
                { id: "Cocktail", name: "Cocktail" },
                { id: "Bridal", name: "Bridal" },
                { id: "Casual", name: "Casual" },
                { id: "Summer", name: "Summer" }
            ],
            brands: [{ id: "Rinas Closet", name: "Rinas Closet" }],
            costMethod: 'FIFO',
            currentUser: null,
            locations: [
                { id: "main", name: "Rinas Boutique (Atelier)", type: "store", address: "Bole Road, Addis Ababa", contact_phone: "+251911..." }
            ],

            login: (username, password) => {
                const u = username.trim().toLowerCase();
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

            addLocation: (loc) => set(state => ({ locations: [...state.locations, loc] })),
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

            addProduct: (product) => {
                set((state) => ({ products: [...state.products, product] }));
                get().addLog("CREATE", "Product", product.id, `Added product: ${product.name}`);
            },

            updateProduct: (id, data) => {
                set((state) => ({
                    products: state.products.map(p => p.id === id ? { ...p, ...data } : p)
                }));
                get().addLog("UPDATE", "Product", id, `Updated product details`);
            },

            deleteProduct: (id) => {
                const product = get().products.find(p => p.id === id);
                set((state) => ({
                    products: state.products.filter(p => p.id !== id),
                    variants: state.variants.filter(v => v.product_id !== id)
                }));
                get().addLog("DELETE", "Product", id, `Removed product: ${product?.name}`);
            },

            addVariant: (variant) => set((state) => ({ variants: [...state.variants, variant] })),

            updateVariant: (id, data) => set((state) => ({
                variants: state.variants.map(v => v.id === id ? { ...v, ...data } : v)
            })),
            addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
            addBrand: (brand) => set((state) => ({ brands: [...state.brands, brand] })),
            deleteCategory: (id) => set((state) => ({ categories: state.categories.filter(c => c.id !== id) })),
            deleteBrand: (id) => set((state) => ({ brands: state.brands.filter(b => b.id !== id) })),

            addBatch: (batch) => {
                const id = crypto.randomUUID();
                const locId = batch.location_id || "main"; // Fallback to main
                set((state) => ({
                    batches: [...state.batches, { ...batch, id, location_id: locId }]
                }));
                get().addLog("STOCK", "Batch", id, `Added stock to ${locId}: ${batch.quantity_remaining} units`);
            },

            setCostMethod: (method) => {
                set({ costMethod: method });
                get().addLog("CONFIG", "System", "CostMethod", `Costing method set to ${method}`);
            },

            addEmployee: (employee) => {
                set((state) => ({ employees: [...state.employees, employee] }));
                get().addLog("HIRE", "Employee", employee.id, `Hired: ${employee.name}`);
            },

            updateEmployee: (id, data) => set((state) => ({
                employees: state.employees.map(emp => emp.id === id ? { ...emp, ...data } : emp)
            })),

            deleteEmployee: (id) => {
                const emp = get().employees.find(e => e.id === id);
                set((state) => ({ employees: state.employees.filter(emp => emp.id !== id) }));
                get().addLog("TERMINATE", "Employee", id, `Removed record: ${emp?.name}`);
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

            processSale: (customerId, saleItems) => {
                const state = get();
                if (state.isPeriodLocked) return null;

                const orderId = crypto.randomUUID();
                const timestamp = new Date().toISOString();
                let totalOrderAmount = 0;
                let totalCOGS = 0;

                const newOrderItems: OrderItem[] = [];
                const newOrderItemBatches: OrderItemBatch[] = [];
                const updatedBatches = [...state.batches];
                const newTransactions: InventoryTransaction[] = [];

                try {
                    for (const item of saleItems) {
                        let remainingToDeduct = item.quantity;
                        let itemCOGS = 0;
                        const orderItemId = crypto.randomUUID();

                        let candidateBatches = updatedBatches
                            .filter(b => b.product_variant_id === item.variantId && (b.quantity_remaining - (b.quantity_reserved || 0)) > 0);

                        // If sale doesn't specify location, it takes from any location (for now)
                        // In a real system, we'd pass locationId to processSale
                        // Let's assume most sales happen at 'main' (Boutique)
                        candidateBatches = candidateBatches.sort((a, b) => {
                            if (a.location_id === 'main' && b.location_id !== 'main') return -1;
                            if (a.location_id !== 'main' && b.location_id === 'main') return 1;
                            return 0;
                        });

                        candidateBatches.sort((a, b) => {
                            const timeA = new Date(a.purchase_date).getTime();
                            const timeB = new Date(b.purchase_date).getTime();
                            return state.costMethod === 'FIFO' ? timeA - timeB : timeB - timeA;
                        });

                        const availableStock = candidateBatches.reduce((sum, b) => sum + (b.quantity_remaining - (b.quantity_reserved || 0)), 0);
                        if (availableStock < item.quantity) throw new Error("Insufficient Stock");

                        for (const batch of candidateBatches) {
                            if (remainingToDeduct <= 0) break;
                            const batchAvailable = batch.quantity_remaining - (batch.quantity_reserved || 0);
                            const quantityFromBatch = Math.min(batchAvailable, remainingToDeduct);

                            const bIdx = updatedBatches.findIndex(b => b.id === batch.id);
                            updatedBatches[bIdx] = { ...updatedBatches[bIdx], quantity_remaining: updatedBatches[bIdx].quantity_remaining - quantityFromBatch };

                            newOrderItemBatches.push({
                                id: crypto.randomUUID(),
                                order_item_id: orderItemId,
                                batch_id: batch.id,
                                quantity: quantityFromBatch,
                                cost_at_time: batch.unit_cost
                            });

                            newTransactions.push({
                                id: crypto.randomUUID(),
                                product_variant_id: item.variantId,
                                batch_id: batch.id,
                                location_id: batch.location_id,
                                type: 'OUT',
                                quantity: quantityFromBatch,
                                reference_type: 'SALE',
                                reference_id: orderId,
                                created_at: timestamp
                            });

                            itemCOGS += (quantityFromBatch * batch.unit_cost);
                            remainingToDeduct -= quantityFromBatch;
                        }

                        newOrderItems.push({
                            id: orderItemId,
                            order_id: orderId,
                            product_variant_id: item.variantId,
                            quantity: item.quantity,
                            price_at_time: item.price,
                            cost_at_time: itemCOGS / item.quantity
                        });

                        totalOrderAmount += (item.quantity * item.price);
                        totalCOGS += itemCOGS;
                    }

                    const newOrder: Order = { id: orderId, customer_id: customerId, status: 'completed', total_amount: totalOrderAmount, created_at: timestamp };
                    const newInvoice: Invoice = { id: crypto.randomUUID(), customer_id: customerId, order_id: orderId, total_amount: totalOrderAmount, paid_amount: 0, status: 'unpaid' };
                    const journalEntry: JournalEntry = {
                        id: crypto.randomUUID(),
                        date: timestamp,
                        description: `Sale to ${customerId}`,
                        reference_type: 'SALE',
                        reference_id: orderId,
                        items: [
                            { account_name: 'Accounts Receivable', debit: totalOrderAmount, credit: 0 },
                            { account_name: 'Revenue', debit: 0, credit: totalOrderAmount },
                            { account_name: 'COGS', debit: totalCOGS, credit: 0 },
                            { account_name: 'Inventory', debit: 0, credit: totalCOGS }
                        ]
                    };

                    set((state) => ({
                        orders: [...state.orders, newOrder],
                        orderItems: [...state.orderItems, ...newOrderItems],
                        orderItemBatches: [...state.orderItemBatches, ...newOrderItemBatches],
                        batches: updatedBatches,
                        transactions: [...state.transactions, ...newTransactions],
                        invoices: [...state.invoices, newInvoice],
                        journalEntries: [...state.journalEntries, journalEntry]
                    }));
                    get().addLog("SALE", "Order", orderId, `Processed sale: $${totalOrderAmount}`);
                    return orderId;
                } catch (e) {
                    console.error("Sale transaction failed, state unchanged.", e);
                    return null;
                }
            },

            processPayment: (invoiceId, amount, method) => {
                if (get().isPeriodLocked) return;
                set((state) => {
                    const invoiceIndex = state.invoices.findIndex(inv => inv.id === invoiceId);
                    if (invoiceIndex === -1) return state;

                    const updatedInvoices = [...state.invoices];
                    const invoice = { ...updatedInvoices[invoiceIndex] };
                    invoice.paid_amount += amount;
                    invoice.status = invoice.paid_amount >= invoice.total_amount ? 'paid' : 'partial';
                    updatedInvoices[invoiceIndex] = invoice;

                    const payment: Payment = { id: crypto.randomUUID(), invoice_id: invoiceId, amount, payment_method: method, payment_date: new Date().toISOString() };
                    const journalEntry: JournalEntry = {
                        id: crypto.randomUUID(),
                        date: new Date().toISOString(),
                        description: `Payment for Invoice ${invoiceId}`,
                        reference_type: 'PAYMENT',
                        reference_id: payment.id,
                        items: [
                            { account_name: 'Cash', debit: amount, credit: 0 },
                            { account_name: 'Accounts Receivable', debit: 0, credit: amount }
                        ]
                    };

                    return { invoices: updatedInvoices, payments: [...state.payments, payment], journalEntries: [...state.journalEntries, journalEntry] };
                });
                get().addLog("PAYMENT", "Invoice", invoiceId, `Recorded payment of $${amount}`);
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

            requestReservation: (res) => {
                const state = get();
                const variantId = res.product_variant_id;

                // Find available stock
                const candidateBatches = [...state.batches].filter(b => b.product_variant_id === variantId);
                candidateBatches.sort((a, b) => new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime());

                let quantityToReserve = 1;
                let available = 0;
                for (const b of candidateBatches) {
                    available += (b.quantity_remaining - (b.quantity_reserved || 0));
                }

                if (available < quantityToReserve) {
                    console.warn("Insufficient available physical stock to fully link this reservation to a batch, but recording request anyway.");
                }

                const reserved_batches: { batch_id: string, quantity: number }[] = [];
                const updatedBatches = [...state.batches];

                for (const batch of candidateBatches) {
                    if (quantityToReserve <= 0) break;
                    const batchAvailable = batch.quantity_remaining - (batch.quantity_reserved || 0);
                    if (batchAvailable > 0) {
                        const reserveQty = Math.min(batchAvailable, quantityToReserve);
                        reserved_batches.push({ batch_id: batch.id, quantity: reserveQty });

                        const bIdx = updatedBatches.findIndex(b => b.id === batch.id);
                        updatedBatches[bIdx] = {
                            ...updatedBatches[bIdx],
                            quantity_reserved: (updatedBatches[bIdx].quantity_reserved || 0) + reserveQty
                        };

                        quantityToReserve -= reserveQty;
                    }
                }

                const id = crypto.randomUUID();
                const newRes: Reservation = {
                    ...res,
                    id,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                    reserved_batches
                };
                set({ reservations: [...state.reservations, newRes], batches: updatedBatches });
                get().addLog("RESERVE", "Reservation", id, `New reservation request from ${res.customer_name}`);
            },

            updateReservationStatus: (id, status, prepayment) => {
                const state = get();
                const reservation = state.reservations.find(r => r.id === id);
                if (!reservation) return;

                const previousStatus = reservation.status;
                const newStatus = status;

                // Only process stock changes if we are coming from an active reservation state
                const wasActive = ['pending', 'confirmed_prepaid', 'confirmed_no_prepayment', 'reserved'].includes(previousStatus);


                let updatedBatches = [...state.batches];
                let transactions = [...state.transactions];
                let journalEntries = [...state.journalEntries];

                if (wasActive) {
                    if (newStatus === 'cancelled' || newStatus === 'expired') {
                        // Release reserved stock!
                        const reservedBatches = reservation.reserved_batches || [];
                        for (const rb of reservedBatches) {
                            const bIdx = updatedBatches.findIndex(b => b.id === rb.batch_id);
                            if (bIdx !== -1) {
                                updatedBatches[bIdx] = {
                                    ...updatedBatches[bIdx],
                                    quantity_reserved: Math.max(0, (updatedBatches[bIdx].quantity_reserved || 0) - rb.quantity)
                                };
                            }
                        }
                    } else if (newStatus === 'confirmed_paid_fully' || newStatus === 'completed') {
                        // Convert to sale
                        const reservedBatches = reservation.reserved_batches || [];
                        const variantId = reservation.product_variant_id;
                        const orderId = crypto.randomUUID();
                        let totalCOGS = 0;
                        let totalRevenue = prepayment || 0;

                        const newTransactions: InventoryTransaction[] = [];
                        const varObj = state.variants.find(v => v.id === variantId);
                        const prodObj = state.products.find(p => p.id === varObj?.product_id);
                        const finalPrice = prodObj?.selling_price || 0;
                        totalRevenue = finalPrice * (reservedBatches[0]?.quantity || 1);

                        const orderItemId = crypto.randomUUID();
                        const newOrderItems: OrderItem[] = [];
                        const newOrderItemBatchesArr: OrderItemBatch[] = [];

                        for (const rb of reservedBatches) {
                            const bIdx = updatedBatches.findIndex(b => b.id === rb.batch_id);
                            if (bIdx !== -1) {
                                const batch = updatedBatches[bIdx];
                                updatedBatches[bIdx] = {
                                    ...batch,
                                    quantity_remaining: Math.max(0, batch.quantity_remaining - rb.quantity),
                                    quantity_reserved: Math.max(0, (batch.quantity_reserved || 0) - rb.quantity)
                                };
                                totalCOGS += (rb.quantity * batch.unit_cost);
                                newTransactions.push({
                                    id: crypto.randomUUID(),
                                    product_variant_id: variantId,
                                    batch_id: batch.id,
                                    location_id: batch.location_id,
                                    type: 'OUT',
                                    quantity: rb.quantity,
                                    reference_type: 'SALE',
                                    reference_id: orderId,
                                    created_at: new Date().toISOString()
                                });
                                newOrderItemBatchesArr.push({
                                    id: crypto.randomUUID(),
                                    order_item_id: orderItemId,
                                    batch_id: batch.id,
                                    quantity: rb.quantity,
                                    cost_at_time: batch.unit_cost
                                });
                            }
                        }

                        newOrderItems.push({
                            id: orderItemId,
                            order_id: orderId,
                            product_variant_id: variantId,
                            quantity: reservedBatches[0]?.quantity || 1,
                            price_at_time: finalPrice,
                            cost_at_time: totalCOGS / (reservedBatches[0]?.quantity || 1)
                        });

                        const newOrder: Order = {
                            id: orderId,
                            customer_id: reservation.customer_name, // fallback use name as ID for guests
                            status: 'completed',
                            total_amount: totalRevenue,
                            created_at: new Date().toISOString()
                        };
                        const newInvoice: Invoice = {
                            id: crypto.randomUUID(),
                            customer_id: reservation.customer_name,
                            order_id: orderId,
                            total_amount: totalRevenue,
                            paid_amount: totalRevenue,
                            status: 'paid'
                        };

                        const existingPrepayment = reservation.prepayment_amount || 0;
                        const remainingToPay = Math.max(0, totalRevenue - existingPrepayment);

                        const journalItems = [
                            { account_name: 'Sales Revenue', debit: 0, credit: totalRevenue },
                            { account_name: 'COGS', debit: totalCOGS, credit: 0 },
                            { account_name: 'Inventory', debit: 0, credit: totalCOGS }
                        ];

                        if (existingPrepayment > 0) {
                            journalItems.push({ account_name: 'Customer Deposits (Unearned Revenue)', debit: Math.min(existingPrepayment, totalRevenue), credit: 0 });
                        }
                        if (remainingToPay > 0) {
                            journalItems.push({ account_name: 'Cash', debit: remainingToPay, credit: 0 });
                        }

                        const journalEntry: JournalEntry = {
                            id: crypto.randomUUID(),
                            date: new Date().toISOString(),
                            description: `Sale from Reservation ${id} (Prepayment Applied: $${existingPrepayment})`,
                            reference_type: 'SALE',
                            reference_id: orderId,
                            items: journalItems
                        };

                        set({
                            reservations: state.reservations.map(r =>
                                r.id === id ? { ...r, status: newStatus } : r
                            ),
                            batches: updatedBatches,
                            orders: [...state.orders, newOrder],
                            orderItems: [...state.orderItems, ...newOrderItems],
                            orderItemBatches: [...state.orderItemBatches, ...newOrderItemBatchesArr],
                            transactions: [...state.transactions, ...newTransactions],
                            invoices: [...state.invoices, newInvoice],
                            journalEntries: [...state.journalEntries, journalEntry]
                        });
                        get().addLog("UPDATE", "Reservation", id, `Status updated to ${newStatus} (Sale recorded, prepayment applied)`);
                        return;
                    }
                }

                if (prepayment && prepayment > 0) {
                    get().recordPrepayment(id, prepayment, "Initial Deposit");
                    return; // recordPrepayment handles the set call
                }

                set({
                    reservations: state.reservations.map(r =>
                        r.id === id ? { ...r, status: newStatus } : r
                    ),
                    batches: updatedBatches
                });
                get().addLog("UPDATE", "Reservation", id, `Status updated to ${newStatus}`);
            },

            recordPrepayment: (id, amount, method) => {
                const state = get();
                const res = state.reservations.find(r => r.id === id);
                if (!res) return;

                const timestamp = new Date().toISOString();
                const journalEntry: JournalEntry = {
                    id: crypto.randomUUID(),
                    date: timestamp,
                    description: `Prepayment for Reservation ${id} from ${res.customer_name}`,
                    reference_type: 'PREPAYMENT',
                    reference_id: id,
                    items: [
                        { account_name: 'Cash', debit: amount, credit: 0 },
                        { account_name: 'Customer Deposits (Unearned Revenue)', debit: 0, credit: amount }
                    ]
                };

                set({
                    reservations: state.reservations.map(r =>
                        r.id === id ? { ...r, prepayment_amount: (r.prepayment_amount || 0) + amount, status: 'confirmed_prepaid' } : r
                    ),
                    journalEntries: [...state.journalEntries, journalEntry]
                });
                get().addLog("PAYMENT", "Reservation", id, `Recorded $${amount} prepayment via ${method}`);
            },

            addTask: (task) => {
                const id = crypto.randomUUID();
                const newTask: EmployeeTask = {
                    ...task,
                    id,
                    created_at: new Date().toISOString()
                };
                set((state) => ({ tasks: [...state.tasks, newTask] }));
                get().addLog("TASK", "Employee", task.employee_id, `New task assigned: ${task.title}`);
            },

            updateTaskStatus: (id, status) => {
                set((state) => ({
                    tasks: state.tasks.map(t => t.id === id ? { ...t, status } : t)
                }));
            },

            adjustStock: ({ batchId, type, quantity, reason }) => {
                const state = get();
                const batch = state.batches.find(b => b.id === batchId);
                if (!batch) throw new Error("Batch not found");

                // For removals (damage/loss), quantity should be negative or we negate it
                const delta = (type === 'damage' || type === 'loss') ? -Math.abs(quantity) : Math.abs(quantity);
                const newQty = Math.max(0, batch.quantity_remaining + delta);
                const actualDelta = newQty - batch.quantity_remaining; // real change (may be clamped)

                // Update batch quantity_remaining
                set(state => ({
                    batches: state.batches.map(b => b.id === batchId ? { ...b, quantity_remaining: newQty } : b)
                }));

                // Record inventory transaction
                const txn: InventoryTransaction = {
                    id: crypto.randomUUID(),
                    product_variant_id: batch.product_variant_id,
                    batch_id: batchId,
                    location_id: batch.location_id,
                    type: delta > 0 ? 'IN' : 'OUT',
                    quantity: Math.abs(actualDelta),
                    reference_type: type.toUpperCase() as any,
                    reference_id: batchId,
                    created_at: new Date().toISOString(),
                };
                set(state => ({ transactions: [...state.transactions, txn] }));

                // Journal entry for write-offs (damage / loss reduce asset value)
                if ((type === 'damage' || type === 'loss') && actualDelta !== 0) {
                    const lossValue = Math.abs(actualDelta) * batch.unit_cost;
                    const journalEntry: JournalEntry = {
                        id: crypto.randomUUID(),
                        date: new Date().toISOString(),
                        description: `Stock ${type} adjustment — ${reason}`,
                        reference_type: 'ADJUSTMENT',
                        reference_id: batchId,
                        items: [
                            { account_name: `${type.charAt(0).toUpperCase() + type.slice(1)} Expense`, debit: lossValue, credit: 0 },
                            { account_name: 'Inventory', debit: 0, credit: lossValue },
                        ]
                    };
                    set(state => ({ journalEntries: [...state.journalEntries, journalEntry] }));
                }

                get().addLog("ADJUST", "Batch", batchId, `${type.toUpperCase()} adjustment of ${Math.abs(quantity)} units. Reason: ${reason}`);
            },

            getInventoryValue: () => get().batches.reduce((sum, b) => sum + (b.quantity_remaining * b.unit_cost), 0),
            getTotalRevenue: () => get().orders.reduce((sum, o) => sum + o.total_amount, 0),
            getCashReceived: () => get().payments.reduce((sum, p) => sum + p.amount, 0),
            getTotalCOGS: () => get().orderItems.reduce((sum, item) => sum + (item.cost_at_time * (item.quantity)), 0),
            getNetProfit: () => get().getTotalRevenue() - get().getTotalCOGS()
        }),
        { name: "rina-atelier-erp-v2" }
    )
);
