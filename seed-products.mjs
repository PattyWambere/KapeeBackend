import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

// Define schemas inline for seeding
const userSchema = new mongoose.Schema({
    id: String,
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    role: String,
});

const productSchema = new mongoose.Schema({
    id: String,
    name: String,
    price: Number,
    description: String,
    categoryId: String,
    inStock: Boolean,
    quantity: Number,
    images: [String],
    createdBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

const UserModel = mongoose.model('User', userSchema);
const ProductModel = mongoose.model('Product', productSchema);

const products = [
    // Men's Clothing - T-Shirts
    {
        id: "mens-tshirt-white-001",
        name: "Classic White T-Shirt",
        price: 25.00,
        description: "Premium cotton white t-shirt. Perfect for casual wear. Comfortable and breathable fabric.",
        categoryId: "mens-clothing",
        inStock: true,
        quantity: 50,
        images: ["/images/mens_tshirt_white_1769413247505.png"]
    },
    {
        id: "mens-tshirt-black-002",
        name: "Essential Black T-Shirt",
        price: 25.00,
        description: "Classic black t-shirt made from premium cotton. A wardrobe essential.",
        categoryId: "mens-clothing",
        inStock: true,
        quantity: 45,
        images: ["/images/mens_tshirt_white_1769413247505.png"] // Using same image as placeholder
    },

    // Men's Clothing - Jeans
    {
        id: "mens-jeans-blue-001",
        name: "Slim Fit Blue Jeans",
        price: 45.00,
        description: "Modern slim fit jeans in classic blue denim. Comfortable stretch fabric for all-day wear.",
        categoryId: "mens-clothing",
        inStock: true,
        quantity: 30,
        images: ["/images/mens_jeans_blue_1769413266092.png"]
    },
    {
        id: "mens-jeans-black-002",
        name: "Black Denim Jeans",
        price: 48.00,
        description: "Sleek black jeans with a modern fit. Perfect for both casual and semi-formal occasions.",
        categoryId: "mens-clothing",
        inStock: true,
        quantity: 25,
        images: ["/images/mens_jeans_blue_1769413266092.png"]
    },

    // Men's Clothing - Jackets
    {
        id: "mens-jacket-leather-001",
        name: "Leather Biker Jacket",
        price: 150.00,
        description: "Premium leather biker jacket. Timeless style with modern comfort. Perfect for cool weather.",
        categoryId: "mens-clothing",
        inStock: true,
        quantity: 15,
        images: ["/images/leather_jacket_black_1769413295399.png"]
    },
    {
        id: "mens-jacket-denim-002",
        name: "Classic Denim Jacket",
        price: 65.00,
        description: "Vintage-style denim jacket. A versatile piece for layering.",
        categoryId: "mens-clothing",
        inStock: true,
        quantity: 20,
        images: ["/images/leather_jacket_black_1769413295399.png"]
    },

    // Women's Clothing - Dresses
    {
        id: "womens-dress-floral-001",
        name: "Floral Summer Dress",
        price: 55.00,
        description: "Beautiful floral print summer dress. Light and breezy fabric perfect for warm weather.",
        categoryId: "womens-clothing",
        inStock: true,
        quantity: 35,
        images: ["/images/womens_dress_floral_1769413280298.png"]
    },
    {
        id: "womens-dress-casual-002",
        name: "Casual Day Dress",
        price: 48.00,
        description: "Comfortable casual dress for everyday wear. Versatile and stylish.",
        categoryId: "womens-clothing",
        inStock: true,
        quantity: 40,
        images: ["/images/womens_dress_floral_1769413280298.png"]
    },

    // Women's Clothing - Tops
    {
        id: "womens-top-white-001",
        name: "White Cotton Top",
        price: 28.00,
        description: "Elegant white cotton top. Perfect for both casual and office wear.",
        categoryId: "womens-clothing",
        inStock: true,
        quantity: 50,
        images: ["/images/womens_dress_floral_1769413280298.png"]
    },
    {
        id: "womens-top-blouse-002",
        name: "Silk Blouse",
        price: 42.00,
        description: "Luxurious silk blouse. Sophisticated and comfortable.",
        categoryId: "womens-clothing",
        inStock: true,
        quantity: 30,
        images: ["/images/womens_dress_floral_1769413280298.png"]
    },

    // Accessories - Handbags
    {
        id: "accessories-handbag-001",
        name: "Classic Leather Handbag",
        price: 85.00,
        description: "Timeless leather handbag. Spacious and elegant design perfect for daily use.",
        categoryId: "accessories",
        inStock: true,
        quantity: 20,
        images: ["/images/handbag_classic_1769413309814.png"]
    },
    {
        id: "accessories-handbag-002",
        name: "Crossbody Bag",
        price: 65.00,
        description: "Stylish crossbody bag. Perfect for hands-free convenience.",
        categoryId: "accessories",
        inStock: true,
        quantity: 25,
        images: ["/images/handbag_classic_1769413309814.png"]
    },

    // Accessories - Belts
    {
        id: "accessories-belt-leather-001",
        name: "Leather Belt",
        price: 35.00,
        description: "Premium leather belt. Classic design that complements any outfit.",
        categoryId: "accessories",
        inStock: true,
        quantity: 40,
        images: ["/images/handbag_classic_1769413309814.png"]
    },

    // Accessories - Sunglasses
    {
        id: "accessories-sunglasses-001",
        name: "Classic Sunglasses",
        price: 45.00,
        description: "Stylish sunglasses with UV protection. Perfect for sunny days.",
        categoryId: "accessories",
        inStock: true,
        quantity: 30,
        images: ["/images/handbag_classic_1769413309814.png"]
    },
];

async function seedProducts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Create or find admin user for createdBy field
        let adminUser = await UserModel.findOne({ email: 'admin@klab.com' });

        if (!adminUser) {
            console.log('Creating admin user...');
            const hashedPassword = await bcrypt.hash('Admin@123', 10);
            adminUser = await UserModel.create({
                id: 'admin-seed-user',
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@klab.com',
                password: hashedPassword,
                role: 'admin',
            });
            console.log('Admin user created: admin@klab.com / Admin@123');
        } else {
            console.log('Using existing admin user');
        }

        // Clear existing products
        await ProductModel.deleteMany({});
        console.log('Cleared existing products');

        // Insert new products with admin as creator
        const productsWithCreator = products.map(product => ({
            ...product,
            createdBy: adminUser._id
        }));

        await ProductModel.insertMany(productsWithCreator);
        console.log(`Successfully seeded ${products.length} products!`);

        // Display summary
        console.log('\n=== Products Summary ===');
        console.log(`Men's Clothing: ${products.filter(p => p.categoryId === 'mens-clothing').length} products`);
        console.log(`Women's Clothing: ${products.filter(p => p.categoryId === 'womens-clothing').length} products`);
        console.log(`Accessories: ${products.filter(p => p.categoryId === 'accessories').length} products`);

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Error seeding products:', error);
        process.exit(1);
    }
}

seedProducts();
