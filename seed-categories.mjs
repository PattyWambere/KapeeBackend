import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const categorySchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    subcategories: [{
        title: { type: String, required: true },
        items: [{ type: String }]
    }]
});

const CategoryModel = mongoose.model('Category', categorySchema);

const categories = [
    {
        id: "mens-clothing",
        name: "Men's Clothing",
        description: "Men's fashion and apparel",
        subcategories: [
            { title: "Top wear", items: ["T-Shirts", "Shirts", "Suits & Blazers", "Jackets"] },
            { title: "Bottom wear", items: ["Jeans", "Trousers", "Shorts", "Cargos", "Track pants"] },
            { title: "Winter wear", items: ["Sweaters", "Jackets", "Sweatshirts", "Thermals", "Pullovers"] },
            { title: "Sports wear", items: ["Sports T-Shirts", "Track Pants", "Track Suits", "Shorts", "Innerwear"] },
            { title: "Innerwear & Sleepwear", items: ["Briefs & Trunks", "Vests", "Boxers", "Thermals"] },
            { title: "Accessories", items: ["Backpacks", "Belts", "Sunglasses", "Luggage & Travel", "Frames", "Jewellery"] },
        ],
    },
    {
        id: "womens-clothing",
        name: "Women's Clothing",
        description: "Women's fashion and apparel",
        subcategories: [
            { title: "Western Wear", items: ["Tops", "T-Shirts", "Shirts", "Jeans & Jeggings", "Trousers & Capris"] },
            { title: "Fusion Wear", items: ["Sweaters & Sweatshirts", "Coats & Blazers", "Jackets & Waistcoats", "Shorts & Skirts", "Camisoles & Slips"] },
            { title: "Sports & Active Wear", items: ["Clothing", "Footwear", "T-Shirts", "Sports Accessories", "Sports Equipment"] },
            { title: "Lingerie & Sleepwear", items: ["Bras & Lingerie Sets", "Briefs", "Shapewear", "Sleepwear & Loungewear", "Camisoles & Thermals"] },
            { title: "Beauty & Personal Care", items: ["Makeup", "Skincare", "Premium Beauty", "Lipsticks"] },
            { title: "Accessories", items: ["Smart Bands", "Handbags"] },
        ],
    },
    {
        id: "accessories",
        name: "Accessories",
        description: "Fashion accessories",
        subcategories: [],
    },
];

async function seedCategories() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing categories
        await CategoryModel.deleteMany({});
        console.log('Cleared existing categories');

        // Insert new categories
        await CategoryModel.insertMany(categories);
        console.log('Categories seeded successfully!');
        console.log(`Inserted ${categories.length} categories`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error seeding categories:', error);
        process.exit(1);
    }
}

seedCategories();
