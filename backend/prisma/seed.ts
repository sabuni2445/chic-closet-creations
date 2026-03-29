import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Locations
    const warehouse = await prisma.location.upsert({
        where: { id: 'WH001' },
        update: {},
        create: {
            id: 'WH001',
            name: 'Main Warehouse',
            type: 'warehouse',
            address: 'Industrial Zone, Block A',
            contact_phone: '+251 911 223344'
        }
    });

    const boutique = await prisma.location.upsert({
        where: { id: 'BTQ001' },
        update: {},
        create: {
            id: 'BTQ001',
            name: 'Central Boutique',
            type: 'store',
            address: 'Central Mall, Room 402',
            contact_phone: '+251 911 556677'
        }
    });

    // 2. Categories
    const categoriesList = ['Evening', 'Bridal', 'Cocktail', 'Casual', 'Accessories', 'Summer'];
    for (const catName of categoriesList) {
        await prisma.category.upsert({
            where: { id: catName },
            update: {},
            create: {
                id: catName,
                name: catName
            }
        });
    }

    // 3. Brands
    const brand = await prisma.brand.upsert({
        where: { id: 'RINA' },
        update: {},
        create: {
            id: 'RINA',
            name: 'Rina Couture'
        }
    });

    // 4. Products & Variants
    const initialProducts = [
        { id: "1", name: "Blush Evening Gown", price: 289, category: "Evening", description: "A breathtaking blush evening gown featuring delicate lace detailing and a flowing silk skirt." },
        { id: "2", name: "Ivory Satin Dress", price: 199, category: "Cocktail", description: "Elegant ivory satin dress with a sophisticated silhouette and subtle sheen." },
        { id: "3", name: "Gold Champagne Maxi", price: 349, category: "Evening", description: "Radiant gold champagne maxi dress designed to turn heads." },
        { id: "4", name: "Dusty Rose Midi", price: 179, category: "Casual", description: "Charming dusty rose midi dress with a flattering wrap design and floral accents." },
        { id: "5", name: "Noir Velvet Gown", price: 399, category: "Evening", description: "Luxurious noir velvet gown that exudes elegance and mystery." },
        { id: "6", name: "Lavender Floral", price: 159, category: "Summer", description: "Lightweight lavender floral dress perfect for warm summer days." },
        { id: "7", name: "Emerald Silk Gown", price: 329, category: "Evening", description: "Stunning emerald silk gown with a rich color and smooth texture." },
        { id: "8", name: "Coral Wrap Dress", price: 189, category: "Summer", description: "Vibrant coral wrap dress that offers both comfort and style." },
    ];

    for (const p of initialProducts) {
        const product = await prisma.product.upsert({
            where: { id: p.id },
            update: {
                selling_price: p.price,
                description: p.description,
            },
            create: {
                id: p.id,
                name: p.name,
                description: p.description,
                category_id: p.category,
                brand_id: brand.id,
                selling_price: p.price,
                images: [],
                sizes: ["S", "M", "L", "XL"],
                colors: ["Original"],
            }
        });

        // Add variants
        const sizes = ["S", "M", "L", "XL"];
        for (const size of sizes) {
            await prisma.variant.upsert({
                where: { sku: `${p.name.slice(0, 3).toUpperCase()}-${size}` },
                update: {},
                create: {
                    product_id: product.id,
                    sku: `${p.name.slice(0, 3).toUpperCase()}-${size}`,
                    size: size,
                    color: "Original"
                }
            });
        }
    }

    // 5. Admin User
    const adminHashedPassword = await bcrypt.hash('adminpassword', 10);
    await prisma.user.upsert({
        where: { email: 'admin@rina.com' },
        update: {
            password: adminHashedPassword
        },
        create: {
            name: 'Rina Admin',
            email: 'admin@rina.com',
            password: adminHashedPassword,
            role: 'admin',
            phone: '+251000000000'
        }
    });

    console.log('✅ Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
