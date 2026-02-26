
export type TransactionType = 'IN' | 'OUT' | 'RETURN' | 'ADJUSTMENT';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'returned';
export type CostMethod = 'FIFO' | 'LIFO';

export interface Category {
    id: string;
    name: string;
}

export interface Brand {
    id: string;
    name: string;
}

export interface ERPProduct {
    id: string;
    name: string;
    description: string;
    category_id: string;
    brand_id: string;
    selling_price: number;
    images: string[];
    sizes: string[];
    colors: string[];
    is_active: boolean;
    created_at: string;
}

export interface ProductVariant {
    id: string;
    product_id: string;
    sku: string;
    size: string;
    color: string;
    created_at: string;
}

export interface InventoryBatch {
    id: string;
    product_variant_id: string;
    quantity_remaining: number;
    quantity_reserved?: number;
    unit_cost: number;
    purchase_date: string;
}

export interface InventoryTransaction {
    id: string;
    product_variant_id: string;
    batch_id: string;
    type: TransactionType;
    quantity: number;
    reference_type: string; // e.g., 'PURCHASE', 'SALE', 'RETURN'
    reference_id: string;
    created_at: string;
}

export interface Order {
    id: string;
    customer_id: string;
    status: OrderStatus;
    total_amount: number;
    created_at: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_variant_id: string;
    quantity: number;
    price_at_time: number;
    cost_at_time: number;
}

export interface OrderItemBatch {
    id: string;
    order_item_id: string;
    batch_id: string;
    quantity: number;
    cost_at_time: number;
}

export interface Invoice {
    id: string;
    customer_id: string;
    order_id: string;
    total_amount: number;
    paid_amount: number;
    status: PaymentStatus;
}

export interface Payment {
    id: string;
    invoice_id: string;
    amount: number;
    payment_method: string;
    payment_date: string;
}

export interface Return {
    id: string;
    order_id: string;
    reason: string;
    status: string;
    created_at: string;
}

export interface ReturnItem {
    id: string;
    return_id: string;
    order_item_id: string;
    quantity: number;
}

export interface Refund {
    id: string;
    return_id: string;
    amount: number;
    refund_method: string;
    created_at: string;
}

export type EmployeeDepartment = 'sales' | 'warehouse' | 'management';

export interface Employee {
    id: string;
    name: string;
    role: string;
    department: EmployeeDepartment;
    email: string;
    phone: string;
    salary: number;
    status: 'active' | 'inactive';
    joined_date: string;
    address?: string;
    national_id?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    guarantor_name?: string;
    guarantor_phone?: string;
}

export interface JournalEntry {
    id: string;
    date: string;
    description: string;
    reference_type: string;
    reference_id: string;
    items: JournalEntryItem[];
}

export interface JournalEntryItem {
    account_name: string;
    debit: number;
    credit: number;
}
export type ReservationStatus = 'pending' | 'confirmed_prepaid' | 'confirmed_paid_fully' | 'confirmed_no_prepayment' | 'completed' | 'cancelled' | 'expired';

export interface Reservation {
    id: string;
    customer_name: string;
    customer_phone: string;
    product_variant_id: string;
    status: ReservationStatus;
    created_at: string;
    assigned_employee_id?: string;
    prepayment_amount?: number;
    notes?: string;
    reserved_batches?: { batch_id: string, quantity: number }[];
}

export interface EmployeeTask {
    id: string;
    employee_id: string;
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    due_date?: string;
    created_at: string;
}
