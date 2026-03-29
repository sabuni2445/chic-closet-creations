import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Basic Heartbeat
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- CATEGORIES ---
app.get('/api/categories', async (req, res) => {
    const categories = await prisma.category.findMany();
    res.json(categories);
});

// --- PRODUCTS ---
app.get('/api/products', async (req, res) => {
    const products = await prisma.product.findMany({ include: { variants: true } });
    res.json(products);
});

app.post('/api/products', async (req, res) => {
    const data = req.body;
    console.log("Creating product with data:", JSON.stringify(data, null, 2));
    try {
        const product = await prisma.product.create({ data });
        console.log("Product created successfully:", product.id);
        res.json(product);
    } catch (error: any) {
        console.error("Error creating product:", error);
        if (error.code === 'P1017') {
            res.status(400).json({ error: 'Database connection closed. The image files might be too large for the server configuration. Please use smaller images.' });
        } else {
            res.status(400).json({ error: error.message });
        }
    }
});

// --- RESERVATIONS ---
app.get('/api/reservations', async (req, res) => {
    const reservations = await prisma.reservation.findMany({
        include: {
            variant: {
                include: {
                    product: true
                }
            },
            employee: true
        }
    });
    res.json(reservations);
});

app.post('/api/batches', async (req, res) => {
    const { product_variant_id, location_id, quantity_remaining, unit_cost, purchase_date } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const batchId = uuidv4();
            const timestamp = purchase_date ? new Date(purchase_date) : new Date();

            const batch = await tx.inventoryBatch.create({
                data: {
                    id: batchId,
                    product_variant_id,
                    location_id,
                    quantity_remaining,
                    unit_cost: Number(unit_cost),
                    purchase_date: timestamp,
                    status: 'active'
                }
            });

            // Create Inventory Transaction
            await tx.inventoryTransaction.create({
                data: {
                    product_variant_id,
                    batch_id: batchId,
                    location_id,
                    type: 'IN',
                    quantity: quantity_remaining,
                    reference_type: 'PURCHASE',
                    reference_id: batchId,
                    created_at: timestamp
                }
            });

            // Create Journal Entry (Debit Inventory, Credit Accounts Payable for now)
            const totalValue = Number(unit_cost) * Number(quantity_remaining);
            const journalEntry = await tx.journalEntry.create({
                data: {
                    date: timestamp,
                    description: `Stock Purchase - Batch ${batchId}`,
                    reference_type: 'BATCH',
                    reference_id: batchId
                }
            });

            await tx.journalEntryItem.createMany({
                data: [
                    { journal_entry_id: journalEntry.id, account_name: 'Inventory', debit: totalValue, credit: 0 },
                    { journal_entry_id: journalEntry.id, account_name: 'Accounts Payable', debit: 0, credit: totalValue }
                ]
            });

            return batch;
        });

        res.status(201).json(result);
    } catch (error: any) {
        console.error("Batch Creation Error:", error);
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/reservations', async (req, res) => {
    try {
        const data = req.body;
        const newReservation = await prisma.reservation.create({
            data: {
                customer_name: data.customer_name,
                customer_phone: data.customer_phone,
                product_variant_id: data.product_variant_id,
                notes: data.notes,
                status: 'pending'
            }
        });
        res.status(201).json(newReservation);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create reservation' });
    }
});

// --- LOCATIONS ---
app.get('/api/locations', async (req, res) => {
    const locations = await prisma.location.findMany();
    res.json(locations);
});

app.post('/api/locations', async (req, res) => {
    const data = req.body;
    try {
        const location = await prisma.location.create({ data });
        res.json(location);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// --- BATCHES ---
app.get('/api/batches', async (req, res) => {
    const batches = await prisma.inventoryBatch.findMany({
        include: { variant: { include: { product: true } } }
    });
    res.json(batches);
});

// --- TRANSACTIONS ---
app.get('/api/transactions', async (req, res) => {
    const transactions = await prisma.inventoryTransaction.findMany({
        include: { variant: { include: { product: true } } }
    });
    res.json(transactions);
});

// --- JOURNAL ENTRIES ---
app.get('/api/journal-entries', async (req, res) => {
    const entries = await prisma.journalEntry.findMany({
        include: { items: true }
    });
    res.json(entries);
});

// --- EMPLOYEES ---
app.get('/api/employees', async (req, res) => {
    const employees = await prisma.employee.findMany();
    res.json(employees);
});

// --- BULK FETCH (FOR FRONTEND HYDRATION) ---
app.get('/api/erp/state', async (req, res) => {
    try {
        const [products, variants, batches, transactions, categories, brands, locations, reservations, journalEntries, employees, orders, invoices, payments, tasks] = await Promise.all([
            prisma.product.findMany({ include: { variants: true } }),
            prisma.variant.findMany(),
            prisma.inventoryBatch.findMany(),
            prisma.inventoryTransaction.findMany(),
            prisma.category.findMany(),
            prisma.brand.findMany(),
            prisma.location.findMany(),
            prisma.reservation.findMany(),
            prisma.journalEntry.findMany({ include: { items: true } }),
            prisma.employee.findMany(),
            prisma.order.findMany({ include: { items: { include: { batches: true } } } }),
            prisma.invoice.findMany({ include: { payments: true } }),
            prisma.payment.findMany(),
            prisma.employeeTask.findMany()
        ]);

        res.json({
            products,
            variants,
            batches,
            transactions,
            categories,
            brands,
            locations,
            reservations,
            journalEntries,
            employees,
            orders,
            invoices,
            payments,
            tasks
        });
    } catch (error) {
        console.error("Bulk fetch error:", error);
        res.status(500).json({ error: 'Failed to fetch ERP state' });
    }
});

// --- AUTHENTICATION ---
const JWT_SECRET = process.env.JWT_SECRET || 'rina-secret-key-12345';

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // Check if user exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { name, email, phone, password: hashedPassword, role: 'customer' }
        });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({ user, token });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body; // username can be identifier (email/username)

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: username },
                    { username: username }
                ]
            }
        });

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

        res.json({ user, token });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/api/users', async (req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
});

app.patch('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: data
        });
        res.json(updatedProduct);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.product.delete({ where: { id } });
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/variants', async (req, res) => {
    const data = req.body;
    console.log("Creating variant with data:", JSON.stringify(data, null, 2));
    try {
        const variant = await prisma.variant.create({ data });
        console.log("Variant created successfully:", variant.id);
        res.json(variant);
    } catch (error: any) {
        console.error("Error creating variant:", error);
        res.status(400).json({ error: error.message });
    }
});

app.patch('/api/variants/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
        const updatedVariant = await prisma.variant.update({
            where: { id },
            data: data
        });
        res.json(updatedVariant);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// --- CATEGORIES & BRANDS ---
app.get('/api/categories', async (req, res) => {
    const categories = await prisma.category.findMany();
    res.json(categories);
});

app.post('/api/categories', async (req, res) => {
    const { name } = req.body;
    try {
        const category = await prisma.category.create({ data: { name } });
        res.json(category);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.category.delete({ where: { id } });
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/brands', async (req, res) => {
    const brands = await prisma.brand.findMany();
    res.json(brands);
});

app.post('/api/brands', async (req, res) => {
    const { name } = req.body;
    try {
        const brand = await prisma.brand.create({ data: { name } });
        res.json(brand);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/brands/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.brand.delete({ where: { id } });
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// --- EMPLOYEES ---
app.get('/api/employees', async (req, res) => {
    const employees = await prisma.employee.findMany();
    res.json(employees);
});

app.post('/api/employees', async (req, res) => {
    const data = req.body;
    try {
        const employee = await prisma.employee.create({ data });
        res.json(employee);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.patch('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
        const updatedEmployee = await prisma.employee.update({
            where: { id },
            data: data
        });
        res.json(updatedEmployee);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.employee.delete({ where: { id } });
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// --- TASKS ---
app.post('/api/tasks', async (req, res) => {
    const data = req.body;
    try {
        const task = await prisma.employeeTask.create({ data });
        res.json(task);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.patch('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const updatedTask = await prisma.employeeTask.update({
            where: { id },
            data: { status }
        });
        res.json(updatedTask);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// --- STOCK ADJUSTMENTS ---
app.post('/api/adjust-stock', async (req, res) => {
    const { batchId, type, quantity, reason } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const batch = await tx.inventoryBatch.findUnique({ where: { id: batchId } });
            if (!batch) throw new Error("Batch not found");

            const delta = (type === 'damage' || type === 'loss') ? -Math.abs(Number(quantity)) : Math.abs(Number(quantity));
            const newQty = Math.max(0, batch.quantity_remaining + delta);
            const actualDelta = newQty - batch.quantity_remaining;

            const updatedBatch = await tx.inventoryBatch.update({
                where: { id: batchId },
                data: { quantity_remaining: newQty }
            });

            const timestamp = new Date();

            // Record transaction
            await tx.inventoryTransaction.create({
                data: {
                    product_variant_id: batch.product_variant_id,
                    batch_id: batchId,
                    location_id: batch.location_id,
                    type: actualDelta > 0 ? 'IN' : 'OUT',
                    quantity: Math.abs(actualDelta),
                    reference_type: type.toUpperCase(),
                    reference_id: batchId,
                    created_at: timestamp
                }
            });

            // Journal Entry for write-offs
            if ((type === 'damage' || type === 'loss') && actualDelta !== 0) {
                const lossValue = Math.abs(actualDelta) * Number(batch.unit_cost);
                const journalEntry = await tx.journalEntry.create({
                    data: {
                        date: timestamp,
                        description: `Stock ${type} adjustment - ${reason}`,
                        reference_type: 'ADJUSTMENT',
                        reference_id: batchId
                    }
                });

                await tx.journalEntryItem.createMany({
                    data: [
                        { journal_entry_id: journalEntry.id, account_name: `${type.charAt(0).toUpperCase() + type.slice(1)} Expense`, debit: lossValue, credit: 0 },
                        { journal_entry_id: journalEntry.id, account_name: 'Inventory', debit: 0, credit: lossValue }
                    ]
                });
            }

            return updatedBatch;
        });

        res.json(result);
    } catch (error: any) {
        console.error("Adjustment Error:", error);
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updated = await prisma.user.update({
            where: { id },
            data: data
        });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ error: 'Update failed' });
    }
});

app.post('/api/prepayments', async (req, res) => {
    const { id, amount, method } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const reservation = await tx.reservation.findUnique({
                where: { id }
            });

            if (!reservation) throw new Error("Reservation not found");

            // Update reservation
            const updatedReservation = await tx.reservation.update({
                where: { id },
                data: {
                    status: 'confirmed_prepaid',
                    prepayment_amount: {
                        increment: Number(amount)
                    }
                }
            });

            // Create Journal Entry
            const journalEntry = await tx.journalEntry.create({
                data: {
                    date: new Date(),
                    description: `Prepayment for Reservation ${id} from ${reservation.customer_name}`,
                    reference_type: 'PREPAYMENT',
                    reference_id: id
                }
            });

            // Add Journal Items
            await tx.journalEntryItem.createMany({
                data: [
                    { journal_entry_id: journalEntry.id, account_name: 'Cash', debit: Number(amount), credit: 0 },
                    { journal_entry_id: journalEntry.id, account_name: 'Customer Deposits (Unearned Revenue)', debit: 0, credit: Number(amount) }
                ]
            });

            return updatedReservation;
        });

        res.status(201).json(result);
    } catch (error: any) {
        console.error("Prepayment error:", error);
        res.status(400).json({ error: error.message });
    }
});

app.patch('/api/reservations/:id', async (req, res) => {
    const { id } = req.params;
    const { status, prepayment } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const reservation = await tx.reservation.findUnique({
                where: { id }
            });

            if (!reservation) throw new Error("Reservation not found");

            const previousStatus = reservation.status;
            const newStatus = status;
            const wasActive = ['pending', 'confirmed_prepaid', 'confirmed_no_prepayment', 'reserved'].includes(previousStatus);

            // Update status first
            const updatedReservation = await tx.reservation.update({
                where: { id },
                data: {
                    status: newStatus,
                    prepayment_amount: prepayment !== undefined ? Number(prepayment) : reservation.prepayment_amount
                }
            });

            if (wasActive) {
                if (newStatus === 'cancelled' || newStatus === 'expired') {
                    // Release reserved stock!
                    const reservedBatches = reservation.reserved_batches as any[] || [];
                    for (const rb of reservedBatches) {
                        await tx.inventoryBatch.update({
                            where: { id: rb.batch_id },
                            data: {
                                quantity_reserved: {
                                    decrement: rb.quantity
                                }
                            }
                        });
                    }
                } else if (newStatus === 'confirmed_paid_fully' || newStatus === 'completed') {
                    // Convert to sale
                    const reservedBatches = reservation.reserved_batches as any[] || [];
                    const variantId = reservation.product_variant_id;
                    const orderId = uuidv4();
                    const timestamp = new Date();
                    let totalCOGS = 0;

                    const variant = await tx.variant.findUnique({
                        where: { id: variantId },
                        include: { product: true }
                    });

                    const finalPrice = variant?.product?.selling_price ? Number(variant.product.selling_price) : 0;
                    const totalRevenue = finalPrice * (reservedBatches[0]?.quantity || 1);

                    const order = await tx.order.create({
                        data: {
                            id: orderId,
                            customer_id: reservation.customer_name,
                            status: 'completed',
                            total_amount: totalRevenue,
                            created_at: timestamp
                        }
                    });

                    const orderItemId = uuidv4();
                    const orderItem = await tx.orderItem.create({
                        data: {
                            id: orderItemId,
                            order_id: orderId,
                            product_variant_id: variantId,
                            quantity: reservedBatches[0]?.quantity || 1,
                            price_at_time: finalPrice,
                            cost_at_time: 0 // Update later
                        }
                    });

                    for (const rb of reservedBatches) {
                        const batch = await tx.inventoryBatch.findUnique({ where: { id: rb.batch_id } });
                        if (batch) {
                            await tx.inventoryBatch.update({
                                where: { id: batch.id },
                                data: {
                                    quantity_remaining: { decrement: rb.quantity },
                                    quantity_reserved: { decrement: rb.quantity }
                                }
                            });

                            totalCOGS += (rb.quantity * Number(batch.unit_cost));

                            await tx.orderItemBatch.create({
                                data: {
                                    order_item_id: orderItemId,
                                    batch_id: batch.id,
                                    quantity: rb.quantity,
                                    cost_at_time: batch.unit_cost
                                }
                            });

                            await tx.inventoryTransaction.create({
                                data: {
                                    product_variant_id: variantId,
                                    batch_id: batch.id,
                                    location_id: batch.location_id,
                                    type: 'OUT',
                                    quantity: rb.quantity,
                                    reference_type: 'SALE',
                                    reference_id: orderId,
                                    created_at: timestamp
                                }
                            });
                        }
                    }

                    await tx.orderItem.update({
                        where: { id: orderItemId },
                        data: { cost_at_time: totalCOGS / (reservedBatches[0]?.quantity || 1) }
                    });

                    await tx.invoice.create({
                        data: {
                            customer_id: reservation.customer_name,
                            order_id: orderId,
                            total_amount: totalRevenue,
                            paid_amount: totalRevenue,
                            status: 'paid'
                        }
                    });

                    const existingPrepayment = reservation.prepayment_amount ? Number(reservation.prepayment_amount) : 0;
                    const remainingToPay = Math.max(0, totalRevenue - existingPrepayment);

                    const journalEntry = await tx.journalEntry.create({
                        data: {
                            date: timestamp,
                            description: `Sale from Reservation ${id} (Prepayment: $${existingPrepayment})`,
                            reference_type: 'SALE',
                            reference_id: orderId
                        }
                    });

                    const journalItems = [
                        { journal_entry_id: journalEntry.id, account_name: 'Sales Revenue', debit: 0, credit: totalRevenue },
                        { journal_entry_id: journalEntry.id, account_name: 'COGS', debit: totalCOGS, credit: 0 },
                        { journal_entry_id: journalEntry.id, account_name: 'Inventory', debit: 0, credit: totalCOGS }
                    ];

                    if (existingPrepayment > 0) {
                        journalItems.push({
                            journal_entry_id: journalEntry.id,
                            account_name: 'Customer Deposits (Unearned Revenue)',
                            debit: Math.min(existingPrepayment, totalRevenue),
                            credit: 0
                        });
                    }
                    if (remainingToPay > 0) {
                        journalItems.push({
                            journal_entry_id: journalEntry.id,
                            account_name: 'Cash',
                            debit: remainingToPay,
                            credit: 0
                        });
                    }

                    await tx.journalEntryItem.createMany({ data: journalItems });
                }
            }

            return updatedReservation;
        });

        res.json(result);
    } catch (error: any) {
        console.error("Reservation Update Error:", error);
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/payments', async (req, res) => {
    const { invoiceId, amount, paymentMethod } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.findUnique({
                where: { id: invoiceId }
            });

            if (!invoice) throw new Error("Invoice not found");

            const newPaidAmount = Number(invoice.paid_amount) + Number(amount);
            const newStatus = newPaidAmount >= Number(invoice.total_amount) ? 'paid' : 'partial';

            // Update invoice
            const updatedInvoice = await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    paid_amount: newPaidAmount,
                    status: newStatus
                }
            });

            // Create payment record
            const payment = await tx.payment.create({
                data: {
                    invoice_id: invoiceId,
                    amount: Number(amount),
                    payment_method: paymentMethod,
                    payment_date: new Date()
                }
            });

            // Create Journal Entry
            const journalEntry = await tx.journalEntry.create({
                data: {
                    date: new Date(),
                    description: `Payment for Invoice ${invoiceId}`,
                    reference_type: 'PAYMENT',
                    reference_id: payment.id
                }
            });

            // Add Journal Items (Cash debit, Accounts Receivable credit)
            await tx.journalEntryItem.createMany({
                data: [
                    { journal_entry_id: journalEntry.id, account_name: 'Cash', debit: Number(amount), credit: 0 },
                    { journal_entry_id: journalEntry.id, account_name: 'Accounts Receivable', debit: 0, credit: Number(amount) }
                ]
            });

            return updatedInvoice;
        });

        res.status(201).json(result);
    } catch (error: any) {
        console.error("Payment error:", error);
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/orders', async (req, res) => {
    const { customerId, items, costMethod = 'FIFO' } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const orderId = uuidv4();
            const timestamp = new Date();
            let totalOrderAmount = 0;
            let totalCOGS = 0;

            const order = await tx.order.create({
                data: {
                    id: orderId,
                    customer_id: customerId,
                    status: 'completed',
                    total_amount: 0, // Will update later
                    created_at: timestamp
                }
            });

            for (const item of items) {
                let remainingToDeduct = item.quantity;
                let itemCOGS = 0;

                // Find candidate batches for this variant
                const candidateBatches = await tx.inventoryBatch.findMany({
                    where: {
                        product_variant_id: item.variantId,
                        quantity_remaining: { gt: 0 }
                    },
                    orderBy: {
                        purchase_date: costMethod === 'FIFO' ? 'asc' : 'desc'
                    }
                });

                const availableStock = candidateBatches.reduce((sum, b) => sum + (b.quantity_remaining - (b.quantity_reserved || 0)), 0);
                if (availableStock < item.quantity) {
                    throw new Error(`Insufficient Stock for variant ${item.variantId}`);
                }

                const orderItem = await tx.orderItem.create({
                    data: {
                        order_id: orderId,
                        product_variant_id: item.variantId,
                        quantity: item.quantity,
                        price_at_time: item.price,
                        cost_at_time: 0 // Will update later
                    }
                });

                for (const batch of candidateBatches) {
                    if (remainingToDeduct <= 0) break;

                    const batchAvailable = batch.quantity_remaining - (batch.quantity_reserved || 0);
                    if (batchAvailable <= 0) continue;

                    const quantityFromBatch = Math.min(batchAvailable, remainingToDeduct);

                    // Update batch
                    await tx.inventoryBatch.update({
                        where: { id: batch.id },
                        data: {
                            quantity_remaining: batch.quantity_remaining - quantityFromBatch
                        }
                    });

                    // Create mapping
                    await tx.orderItemBatch.create({
                        data: {
                            order_item_id: orderItem.id,
                            batch_id: batch.id,
                            quantity: quantityFromBatch,
                            cost_at_time: batch.unit_cost
                        }
                    });

                    // Create transaction
                    await tx.inventoryTransaction.create({
                        data: {
                            product_variant_id: item.variantId,
                            batch_id: batch.id,
                            location_id: batch.location_id,
                            type: 'OUT',
                            quantity: quantityFromBatch,
                            reference_type: 'SALE',
                            reference_id: orderId,
                            created_at: timestamp
                        }
                    });

                    itemCOGS += (quantityFromBatch * Number(batch.unit_cost));
                    remainingToDeduct -= quantityFromBatch;
                }

                // Update OrderItem with correct average cost
                await tx.orderItem.update({
                    where: { id: orderItem.id },
                    data: { cost_at_time: itemCOGS / item.quantity }
                });

                totalOrderAmount += (item.quantity * item.price);
                totalCOGS += itemCOGS;
            }

            // Update Order total
            await tx.order.update({
                where: { id: orderId },
                data: { total_amount: totalOrderAmount }
            });

            // Create Invoice
            const invoice = await tx.invoice.create({
                data: {
                    customer_id: customerId,
                    order_id: orderId,
                    total_amount: totalOrderAmount,
                    paid_amount: 0,
                    status: 'unpaid'
                }
            });

            // Create Journal Entry
            const journalEntry = await tx.journalEntry.create({
                data: {
                    date: timestamp,
                    description: `Sale to ${customerId}`,
                    reference_type: 'SALE',
                    reference_id: orderId
                }
            });

            // Add Journal Items (Accounts Receivable, Revenue, COGS, Inventory)
            await tx.journalEntryItem.createMany({
                data: [
                    { journal_entry_id: journalEntry.id, account_name: 'Accounts Receivable', debit: totalOrderAmount, credit: 0 },
                    { journal_entry_id: journalEntry.id, account_name: 'Revenue', debit: 0, credit: totalOrderAmount },
                    { journal_entry_id: journalEntry.id, account_name: 'COGS', debit: totalCOGS, credit: 0 },
                    { journal_entry_id: journalEntry.id, account_name: 'Inventory', debit: 0, credit: totalCOGS }
                ]
            });

            return { orderId, totalOrderAmount };
        });

        res.status(201).json(result);
    } catch (error: any) {
        console.error("Sale Error:", error);
        res.status(400).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 ERP Backend running on http://localhost:${PORT}`);
});
