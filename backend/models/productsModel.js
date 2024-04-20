const mongoose = require('mongoose');
// const User = require('./usermodels');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true},
});

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: Object, default: {} },
    brand: { type: String, required: true },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true },
    description: { type: String },
    purchasedPrice: { type: Number, required: true },
    sellingPriceRange: {
        minSellingPrice: { type: Number, required: true },
        maxSellingPrice: { type: Number, required: true },
    },
    includeVAT: { type: Boolean },
    VATamount: { type: Number, default: 0},
    quantity: { type: Number, required: true },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user',
    },
}, {
    timestamps: {
        currentTime: () => new Date().getTime() + (3 * 60 * 60 * 1000) // Adjust for GMT+3 (3 hours ahead of UTC)
      }
});

// const cumulativeProducts = productSchema.clone();
const cumulativeProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: Object, default: {} },
    brand: { type: String, required: true },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true },
    description: { type: String },
    purchasedPrice: { type: Number, required: true },
    sellingPriceRange: {
        minSellingPrice: { type: Number, required: true },
        maxSellingPrice: { type: Number, required: true },
    },
    totalVATamount: { type: Number, default: 0},
    quantity: { type: Number, required: true },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user',
    },
}, {
    timestamps: true,
});


const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Products', productSchema);
const CumulativeProducts = mongoose.model('cumulativeProducts', cumulativeProductSchema);
module.exports = {
    Category,
    Product,
    CumulativeProducts,
};