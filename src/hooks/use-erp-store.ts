import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    ERPProduct, ProductVariant, InventoryBatch, InventoryTransaction,
    Order, OrderItem, OrderItemBatch, Invoice, Payment,
    JournalEntry, CostMethod, TransactionType, Employee
} from "../types/erp";

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
    costMethod: CostMethod;

    // Actions
    addProduct: (product: ERPProduct) => void;
    addBatch: (batch: Omit<InventoryBatch, 'id'>) => void;
    setCostMethod: (method: CostMethod) => void;

    // Employee Actions
    addEmployee: (employee: Employee) => void;
    updateEmployeeStatus: (id: string, status: 'active' | 'inactive') => void;

    // The big one: Create Order with FIFO/LIFO logic
    processSale: (customerId: string, items: { variantId: string, quantity: number, price: number }[]) => string | null;

    // Payment process
    processPayment: (invoiceId: string, amount: number, method: string) => void;

    // Return process
    processReturn: (orderId: string, items: { orderItemId: string, quantity: number }[]) => void;
    // Refund process
    processRefund: (returnId: string, amount: number, method: string) => void;

    // Dashboard helpers
    getInventoryValue: () => number;
    getTotalRevenue: () => number;
    getTotalCOGS: () => number;
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
            costMethod: 'FIFO',

            addProduct: (product) => set((state) => ({ products: [...state.products, product] })),

            addEmployee: (employee) => set((state) => ({ employees: [...state.employees, employee] })),

            updateEmployeeStatus: (id, status) => set((state) => ({
                employees: state.employees.map(emp => emp.id === id ? { ...emp, status } : emp)
            })),

            addBatch: (batchData) => {
                const id = crypto.randomUUID();
                const newBatch = { ...batchData, id };

                set((state) => {
                    const newTransaction: InventoryTransaction = {
                        id: crypto.randomUUID(),
                        product_variant_id: batchData.product_variant_id,
                        batch_id: id,
                        type: 'IN',
                        quantity: batchData.quantity_remaining,
                        reference_type: 'PURCHASE',
                        reference_id: id,
                        created_at: new Date().toISOString()
                    };

                    // Automatic Journal Entry for Purchase
                    const journalEntry: JournalEntry = {
                        id: crypto.randomUUID(),
                        date: new Date().toISOString(),
                        description: `Purchase of stock - Batch ${id}`,
                        reference_type: 'PURCHASE',
                        reference_id: id,
                        items: [
                            { account_name: 'Inventory', debit: batchData.quantity_remaining * batchData.unit_cost, credit: 0 },
                            { account_name: 'Accounts Payable', debit: 0, credit: batchData.quantity_remaining * batchData.unit_cost }
                        ]
                    };

                    return {
                        batches: [...state.batches, newBatch],
                        transactions: [...state.transactions, newTransaction],
                        journalEntries: [...state.journalEntries, journalEntry]
                    };
                });
            },

            setCostMethod: (method) => set({ costMethod: method }),

            processSale: (customerId, saleItems) => {
                const state = get();
                const orderId = crypto.randomUUID();
                const timestamp = new Date().toISOString();
                let totalOrderAmount = 0;
                let totalCOGS = 0;

                const newOrderItems: OrderItem[] = [];
                const newOrderItemBatches: OrderItemBatch[] = [];
                const updatedBatches = [...state.batches];
                const newTransactions: InventoryTransaction[] = [];

                for (const item of saleItems) {
                    let remainingToDeduct = item.quantity;
                    let itemCOGS = 0;
                    const orderItemId = crypto.randomUUID();

                    // Select candidate batches
                    let candidateBatches = updatedBatches
                        .filter(b => b.product_variant_id === item.variantId && b.quantity_remaining > 0);

                    // Sort based on FIFO/LIFO
                    candidateBatches.sort((a, b) => {
                        const timeA = new Date(a.purchase_date).getTime();
                        const timeB = new Date(b.purchase_date).getTime();
                        return state.costMethod === 'FIFO' ? timeA - timeB : timeB - timeA;
                    });

                    // Check if enough stock
                    const availableStock = candidateBatches.reduce((sum, b) => sum + b.quantity_remaining, 0);
                    if (availableStock < item.quantity) {
                        console.error(`Not enough stock for variant ${item.variantId}`);
                        return null;
                    }

                    for (const batch of candidateBatches) {
                        if (remainingToDeduct <= 0) break;

                        const quantityFromBatch = Math.min(batch.quantity_remaining, remainingToDeduct);

                        // Deduct from temporary updated batches
                        const batchIndex = updatedBatches.findIndex(b => b.id === batch.id);
                        updatedBatches[batchIndex].quantity_remaining -= quantityFromBatch;

                        // Record batch consumption
                        newOrderItemBatches.push({
                            id: crypto.randomUUID(),
                            order_item_id: orderItemId,
                            batch_id: batch.id,
                            quantity: quantityFromBatch,
                            cost_at_time: batch.unit_cost
                        });

                        // Log Transaction
                        newTransactions.push({
                            id: crypto.randomUUID(),
                            product_variant_id: item.variantId,
                            batch_id: batch.id,
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

                // Create Order and Invoice
                const newOrder: Order = {
                    id: orderId,
                    customer_id: customerId,
                    status: 'completed',
                    total_amount: totalOrderAmount,
                    created_at: timestamp
                };

                const newInvoice: Invoice = {
                    id: crypto.randomUUID(),
                    customer_id: customerId,
                    order_id: orderId,
                    total_amount: totalOrderAmount,
                    paid_amount: 0,
                    status: 'unpaid'
                };

                // Journal Entry for Sale
                const journalEntry: JournalEntry = {
                    id: crypto.randomUUID(),
                    date: timestamp,
                    description: `Sale Order ${orderId}`,
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

                return orderId;
            },

            processPayment: (invoiceId, amount, method) => {
                set((state) => {
                    const invoiceIndex = state.invoices.findIndex(inv => inv.id === invoiceId);
                    if (invoiceIndex === -1) return state;

                    const updatedInvoices = [...state.invoices];
                    const invoice = updatedInvoices[invoiceIndex];
                    invoice.paid_amount += amount;

                    if (invoice.paid_amount >= invoice.total_amount) {
                        invoice.status = 'paid';
                    } else if (invoice.paid_amount > 0) {
                        invoice.status = 'partial';
                    }

                    const payment: Payment = {
                        id: crypto.randomUUID(),
                        invoice_id: invoiceId,
                        amount: amount,
                        payment_method: method,
                        payment_date: new Date().toISOString()
                    };

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

                    return {
                        invoices: updatedInvoices,
                        payments: [...state.payments, payment],
                        journalEntries: [...state.journalEntries, journalEntry]
                    };
                });
            },

            processReturn: (orderId, returnItems) => {
                set((state) => {
                    const updatedBatches = [...state.batches];
                    const newTransactions: InventoryTransaction[] = [];
                    let totalCOGSReversal = 0;
                    let totalRevenueReversal = 0;

                    for (const ret of returnItems) {
                        const orderItem = state.orderItems.find(oi => oi.id === ret.orderItemId);
                        if (!orderItem) continue;

                        totalRevenueReversal += (ret.quantity * orderItem.price_at_time);

                        // Find which batches were used for this item
                        const itemBatches = state.orderItemBatches.filter(oib => oib.order_item_id === ret.orderItemId);
                        let remainingToRestore = ret.quantity;

                        for (const ib of itemBatches) {
                            if (remainingToRestore <= 0) break;

                            const restoreQty = Math.min(ib.quantity, remainingToRestore);
                            const batchIndex = updatedBatches.findIndex(b => b.id === ib.batch_id);

                            if (batchIndex !== -1) {
                                updatedBatches[batchIndex].quantity_remaining += restoreQty;
                                totalCOGSReversal += (restoreQty * ib.cost_at_time);

                                newTransactions.push({
                                    id: crypto.randomUUID(),
                                    product_variant_id: orderItem.product_variant_id,
                                    batch_id: ib.batch_id,
                                    type: 'RETURN',
                                    quantity: restoreQty,
                                    reference_type: 'RETURN',
                                    reference_id: orderId,
                                    created_at: new Date().toISOString()
                                });
                                remainingToRestore -= restoreQty;
                            }
                        }
                    }

                    const journalEntry: JournalEntry = {
                        id: crypto.randomUUID(),
                        date: new Date().toISOString(),
                        description: `Return for Order ${orderId}`,
                        reference_type: 'RETURN',
                        reference_id: orderId,
                        items: [
                            { account_name: 'Sales Returns', debit: totalRevenueReversal, credit: 0 },
                            { account_name: 'Accounts Receivable', debit: 0, credit: totalRevenueReversal },
                            { account_name: 'Inventory', debit: totalCOGSReversal, credit: 0 },
                            { account_name: 'COGS', debit: 0, credit: totalCOGSReversal }
                        ]
                    };

                    return {
                        batches: updatedBatches,
                        transactions: [...state.transactions, ...newTransactions],
                        journalEntries: [...state.journalEntries, journalEntry]
                    };
                });
            },

            processRefund: (returnId, amount, method) => {
                set((state) => {
                    const journalEntry: JournalEntry = {
                        id: crypto.randomUUID(),
                        date: new Date().toISOString(),
                        description: `Refund for Return ${returnId}`,
                        reference_type: 'REFUND',
                        reference_id: returnId,
                        items: [
                            { account_name: 'Accounts Receivable', debit: amount, credit: 0 },
                            { account_name: 'Cash', debit: 0, credit: amount }
                        ]
                    };
                    return {
                        journalEntries: [...state.journalEntries, journalEntry]
                    };
                });
            },

            getInventoryValue: () => {
                return get().batches.reduce((sum, b) => sum + (b.quantity_remaining * b.unit_cost), 0);
            },

            getTotalRevenue: () => {
                return get().invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
            },

            getTotalCOGS: () => {
                const revenue = get().invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
                // Simplified COGS based on sold items minus returns
                return get().orderItems.reduce((sum, item) => sum + (item.cost_at_time * item.quantity), 0);
            }
        }),
        {
            name: "chic-closet-erp-store",
        }
    )
);
