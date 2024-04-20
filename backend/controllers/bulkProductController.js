const  { Product, CumulativeProducts, Category } = require ("../models/productsModel")
const User = require('../models/usermodels');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Joi = require('joi');
const CustomError = require('../utils/customError');
const bulkProducts = require("./bulkproduct.json")

const CreateBulkProduct = asyncHandler(async (req, res) => {
    try {
    const products = req.body;
    console.log(req.body)
    const userId = req.user._id;
    // console.log(products);
    //vallidate data
    const schema = Joi.object({
        name: Joi.string().required(),
        category: Joi.string().required(),
        brand: Joi.string().required(),
        purchasedPrice: Joi.number().required(),
        minSellingPrice: Joi.number().required(),
        maxSellingPrice: Joi.number().required(),
        quantity: Joi.number().required(),
        image: Joi.string()
    });

    const categories = await Category.find({ name: { $in: products.map(p => p.category) } });
    console.log("category", categories);
    if (categories.length === 0) {
        res.status(400);
        throw new Error('Pleace first create all the needed categories');
    }
    const categoryMap = new Map(categories.map(c => [c.name, c._id]));

    const productsWithUserId = products.map(product => {
        const { name, category, brand, purchasedPrice, minSellingPrice, maxSellingPrice, quantity, description, image, includeVAT } = product;
        console.log(name, category, brand, purchasedPrice, minSellingPrice, maxSellingPrice, quantity, includeVAT)

        // adjust the prices to include VAT
        const adjustedPurchasedPrice = includeVAT ? product.purchasedPrice / 1.15 : product.purchasedPrice;
        const VATamount = includeVAT ? purchasedPrice - adjustedPurchasedPrice : 0;
        // console.log(product);
        const { error } = schema.validate(product);
        if (error) throw new Error(error.details[0].message);

        if (product.minSellingPrice > product.maxSellingPrice) {
            res.status(400);
            throw new Error('Minimum selling price cannot be greater than maximum selling price');
        }

        if (product.minSellingPrice < product.purchasedPrice) {
            res.status(400);
            throw new Error('Minimum selling price cannot be less than purchased price');
        }

        const categoryId = categoryMap.get(product.category);
        if (!categoryId) {
            console.log("category", categoryId);
            throw new Error('Invalid category');
        }
        return { ...product, 
            addedBy: userId, 
            sellingPriceRange: {
                minSellingPrice, 
                maxSellingPrice}, 
            category: categoryId,
            purchasedPrice: adjustedPurchasedPrice,
            VATamount,};
    });

    const bulkProduct = await Product.insertMany(productsWithUserId);

        //save it in commulative products
        await Promise.all(productsWithUserId.map(async (product) => {
            console.log(product);
            await CumulativeProducts.findOneAndUpdate(
                { name: product.name, category: product.category, brand: product.brand,},
                { 
                    $inc: { quantity: product.quantity, totalVATamount: product.VATamount }, // Increment quantity
                    name: product.name,
        category: product.category,
        brand: product.brand,
        purchasedPrice: product.purchasedPrice,
        sellingPriceRange: {
            minSellingPrice: product.sellingPriceRange.minSellingPrice,
            maxSellingPrice: product.sellingPriceRange.maxSellingPrice
        },
        addedBy: product.addedBy,
        description: product.description,
        image: product.image
                },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
        }));
        console.log("ok bulk");
        res.json(bulkProduct);
    } catch (error) {
        console.log(error);
        res.status(400);
        throw new Error(error.message);
    }
    });


    const updateBulkProduct = asyncHandler(async (req, res) => {
        const products = bulkProducts;
        const userId = req.user._id;
    
        // Validate data
        const schema = Joi.object({
            // _id: Joi.string().required(),
            name: Joi.string().required(),
            category: Joi.string().required(),
            brand: Joi.string().required(),
            purchasedPrice: Joi.number().required(),
            minSellingPrice: Joi.number().required(),
            maxSellingPrice: Joi.number().required(),
            quantity: Joi.number().required(),
            description: Joi.string().required(),
            image: Joi.string()
        });
    
        const categories = await Category.find({ name: { $in: products.map(p => p.category) } });
        const categoryMap = new Map(categories.map(c => [c.name, c._id]));
    
        const productsWithUserId = products.map(product => {
            const { name, category, brand, purchasedPrice, minSellingPrice, maxSellingPrice, quantity, description, image } = product;
            const { error } = schema.validate(product);
            if (error) throw new CustomError(400, error.details[0].message);
    
            if (product.minSellingPrice > product.maxSellingPrice) {
                throw new CustomError(400, 'Minimum selling price cannot be greater than maximum selling price');
            }
    
            if (product.minSellingPrice < product.purchasedPrice) {
                throw new CustomError(400, 'Minimum selling price cannot be less than purchased price');
            }
    
            const categoryId = categoryMap.get(product.category);
            if (!categoryId) {
                throw new CustomError(400, 'Invalid category');
            }
    
            return { ...product, 
                seller: userId, 
                sellingPriceRange: {
                    minSellingPrice, 
                    maxSellingPrice},
                category: categoryId };
        });
    
        // Update products
        const bulkProduct = await Product.bulkWrite(
            productsWithUserId.map(product => ({
                updateOne: {
                    filter: { _id: new mongoose.Types.ObjectId(product._id) },
                    update: product,
                    upsert: true
                }
            }))
        );
    
        // Update cumulative products
        await Promise.all(productsWithUserId.map(async (product) => {
            await CumulativeProducts.findOneAndUpdate(
                { name: product.name, category: product.category, brand: product.brand, purchasedPrice: product.purchasedPrice },
                { $inc: { quantity: product.quantity } },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
        }));
    
        res.json(bulkProduct);
    });

module.exports = { 
    CreateBulkProduct, 
    updateBulkProduct 
};