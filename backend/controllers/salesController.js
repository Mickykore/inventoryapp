const { Sale, Cumulativesales } = require('../models/salesModel');
const { Category, Product, CumulativeProducts } = require('../models/productsModel');

const asyncHandler = require('express-async-handler');
const User = require('../models/usermodels');
const mongoose = require('mongoose');
//

// @desc    Fetch all sales

// Create sale
const CreateSales = asyncHandler(async (req, res) => {
    try {
    const userId = req.user._id;

    req.body.singleSalePrice = parseFloat(req.body.singleSalePrice);
    req.body.quantity = parseFloat(req.body.quantity);

    const { name, category, singleSalePrice, quantity, seller, description, buyer, paymentMethod, itemIdentification, includeVAT } = req.body;


    let adjustedSalePrice = singleSalePrice;
    let SingleVATamount = 0;
    let totalVATamount = SingleVATamount * quantity;
    if (includeVAT) {
        adjustedSalePrice = singleSalePrice / 1.15;
        SingleVATamount = (singleSalePrice - adjustedSalePrice);
        totalVATamount = SingleVATamount * quantity;
    }

    if (!userId) {
        res.status(400);
        throw new Error('Invalid user ID');
    }
    // Validate data
    if (!name || !singleSalePrice || !quantity || !category || !paymentMethod) {
        res.status(400);
        throw new Error('Please fill all fields');
    }

    const saleCategory = await Category.findOne({ name: category });
    if (!saleCategory) {
        res.status(400);
        throw new Error('Invalid category');
    }
    console.log(saleCategory, "saleCategory");
    console.log(name, "name");

    // Check if the product exists to sell
    const existingProduct = await CumulativeProducts.findOne({
        name, //i cant use no case sensitive
        category: saleCategory._id,
    });

    console.log(existingProduct, "existingProduct");

    if (!existingProduct) {
        res.status(400);
        throw new Error('Invalid product');
    }

    // Check if sale price is greater than the product price
    if (existingProduct.sellingPriceRange.minSellingPrice > adjustedSalePrice) {
        res.status(400);
        throw new Error('Sale price must be greater than minimum product selling price');
    }

    if (existingProduct.quantity < quantity) {
        res.status(400);
        throw new Error('Quantity is more than the available quantity');
    }

    // Create sale
    const sale = await Sale.create({
        product: existingProduct._id,
        singleSalePrice: adjustedSalePrice,
        totalPrice: (adjustedSalePrice * quantity),
        singleProfit: (adjustedSalePrice - existingProduct.purchasedPrice),
        totalProfit: ((adjustedSalePrice - existingProduct.purchasedPrice) * quantity),
        includeVAT,
        SingleVATamount,
        totalVATamount,
        quantity,
        seller: userId,
        description,
        buyer,
        paymentMethod,
        itemIdentification
    })



    // Update cumulative sales
    const cumulativesale = await Cumulativesales.findOneAndUpdate(
        { product: existingProduct._id },
        {
            $inc: {
                quantity,
                totalSalePrice: sale.totalPrice,
                totalProfit: sale.totalProfit,
                totalVATamount: sale.totalVATamount
            },
            $min: {
                minimumSalePrice: sale.singleSalePrice,
                minimumProfit: sale.singleProfit
            },
            $max: {
                maximumSalePrice: sale.singleSalePrice,
                maximumProfit: sale.singleProfit
            },
            $set: {
                product: sale.product
            }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Decrease the quantity of the product after selling it
    await CumulativeProducts.findOneAndUpdate(
        { _id: sale.product},
        { $inc: { 
            quantity: -quantity,
            totalVATamount: -totalVATamount,
        }},
        { new: true, upsert: false, setDefaultsOnInsert: true }
    );

    if (!cumulativesale) {
        res.status(400);
        throw new Error('Invalid cumulative sale data');
    }
    res.json(sale);
} catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
}
});

// Get all sales
const getsales = asyncHandler(async (req, res) => {
    const sales = await Sale.find({}).sort({ createdAt: -1 })
        .populate({
            path: 'product',
            select: 'name category',
            populate: {
                path: 'category',
                select: 'name'
            }
        })
        .populate('seller', 'firstname');

    res.json(sales);
});

// Get cumulative sales
const getCumulativesales = asyncHandler(async (req, res) => {
    const sales = await Cumulativesales.find({}).sort({ createdAt: -1 })
        .populate({
            path: 'product',
            select: 'name category',
            populate: {
                path: 'category',
                select: 'name'
            }
        })

    res.json(sales);
});

// Get single sale by ID
const getsaleById = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid sale ID');
    }
    const sale = await Sale.findById(req.params.id)
        .populate({
            path: 'product',
            select: 'name category',
            populate: {
                path: 'category',
                select: 'name'
            }
        })
        .populate('seller', 'firstname')
        .exec();


    if (sale && sale.product.name && sale.seller && sale.product.category) {
        // Fields are populated, send the response
        res.json(sale);
    } else {
        // Handle missing fields
        console.error("Missing populated fields in sale:", sale);
        res.status(400).json({ error: "Sale data incomplete" });
    }
});

// Delete sale
const deletesale = asyncHandler(async (req, res) => {
    try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid sale ID');
    }
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
        res.status(404);
        throw new Error('Sale not found');
    }

    // Update cumulative sales
    const cumulativeSale = await Cumulativesales.findOneAndUpdate(
        { product: sale.product },
        {
            $inc: {
                quantity: -sale.quantity,
                totalSalePrice: -(sale.singleSalePrice * sale.quantity),
                totalProfit: -(sale.totalProfit),
                totalVATamount: -(sale.totalVATamount)
            }
        },
        { new: true, upsert: false, setDefaultsOnInsert: true }
    );
    console.log("sale.product", sale);

    // Increase the quantity of the product after deleting the sale
    await CumulativeProducts.findOneAndUpdate(
        { _id: sale.product},
        { $inc: { 
            quantity: sale.quantity,
            totalVATamount: sale.totalVATamount
        }},
        { new: true, upsert: false, setDefaultsOnInsert: true }
    );

    if(cumulativeSale.quantity < 0) {
        cumulativeSale.deleteOne();
    }

    console.log("sale.product2", sale);

    await sale.deleteOne();
    res.json(sale);
} catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
}
});

// Update sale
const Updatesale = asyncHandler(async (req, res) => {
    try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid sale ID');
    }
    console.log("adjustedSalePrice1");

    if (!req.body) {
        res.status(400);
        throw new Error('Invalid sale data');
    }

    console.log("adjustedSalePrice2");

    const userId = req.user._id;

    req.body.singleSalePrice = parseFloat(req.body.singleSalePrice);
    req.body.quantity = parseFloat(req.body.quantity);

    const { name, category, singleSalePrice, quantity, seller, description, buyer, paymentMethod, itemIdentification, includeVAT } = req.body;



    let adjustedSalePrice = singleSalePrice;
    let SingleVATamount = 0;
    let totalVATamount = SingleVATamount * quantity;
    if (includeVAT) {
        adjustedSalePrice = singleSalePrice / 1.15;
        SingleVATamount = (singleSalePrice - adjustedSalePrice);
        totalVATamount = SingleVATamount * quantity;
    }
    console.log("adjustedSalePrice3");


    const sale = await Sale.findById(req.params.id);

    const quantityDiff = sale.quantity - quantity;
    const VATdiff = sale.totalVATamount - totalVATamount;

    // Validate data
    if (!sale) {
        res.status(400);
        throw new Error('Sale not found');
    }

    const saleCategory = await Category.findOne({ name: category });

    if (!saleCategory) {
        res.status(400);
        throw new Error('Invalid category');
    }

    const existingProduct = await CumulativeProducts.findOne({
        name: new RegExp(`${name}`, 'i'),
        category: saleCategory._id,
    });

    if (!existingProduct) {
        res.status(400);
        throw new Error('Invalid product');
    }

    if (existingProduct.sellingPriceRange.minSellingPrice > adjustedSalePrice) {
        res.status(400);
        throw new Error('Sale price must be greater than minimum product selling price');
    }

    
    console.log("adjustedSalePrice4");


    // first update the cumulative sales by subtracting the old sale values
    const cumulativeSaleBeforeUpdate = await Cumulativesales.findOneAndUpdate(
        { product: sale.product },
        {$inc: {
            quantity: -sale.quantity,
            totalSalePrice: -(sale.totalPrice),
            totalProfit: -(sale.totalProfit),
            totalVATamount: -(sale.totalVATamount)
        }}
    );

    console.log("adjustedSalePrice5");

    // update cumulative Products by adding the old quantity
    const cumulativeProduct = await CumulativeProducts.findOneAndUpdate(
        { _id: sale.product},
        { $inc: { 
            quantity: +sale.quantity,
            totalVATamount: +sale.totalVATamount
        }},
        { new: true, upsert: false, setDefaultsOnInsert: true }
    );

    if (cumulativeProduct.quantity < quantity) {
        res.status(400);
        throw new Error('Quantity is more than the available quantity');
    }
    // Update sale
    const updatedsale = await Sale.findByIdAndUpdate({ _id: req.params.id }, {
        product: existingProduct._id,
        singleSalePrice: adjustedSalePrice,
        totalPrice: (adjustedSalePrice * quantity),
        singleProfit: (adjustedSalePrice - existingProduct.purchasedPrice),
        totalProfit: ((adjustedSalePrice - existingProduct.purchasedPrice) * quantity),
        includeVAT,
        SingleVATamount,
        totalVATamount,
        quantity,
        seller: userId,
        description,
        buyer,
        paymentMethod,
        itemIdentification,
    }, { new: true, upsert: true, setDefaultsOnInsert: true })
        .populate({
            path: 'product',
            select: 'name category',
            populate: {
                path: 'category',
                select: 'name'
            }
        })
        .populate('seller', 'firstname');

        console.log("updated sale", updatedsale);

    // Update cumulative sales
    const updatedCumulativeSale = await Cumulativesales.findOneAndUpdate(
        { product: existingProduct._id },
        {
            $inc: {
                quantity: updatedsale.quantity,
                totalSalePrice: updatedsale.totalPrice,
                totalProfit: updatedsale.totalProfit,
                totalVATamount: updatedsale.totalVATamount
            },
            $min: {
                minimumSalePrice: updatedsale.singleSalePrice,
                minimumProfit: updatedsale.singleProfit
            },
            $max: {
                maximumSalePrice: updatedsale.singleSalePrice,
                maximumProfit: updatedsale.singleProfit
            },
            product: updatedsale.product,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Decrease the quantity of the product after selling it
    await CumulativeProducts.findOneAndUpdate(
        { _id: updatedCumulativeSale.product },
        { $inc: { 
            quantity: -updatedsale.quantity,
            totalVATamount: -updatedsale.totalVATamount,
        }},
        { new: true, upsert: false, setDefaultsOnInsert: true }
    );

    res.status(200).json(updatedsale);
} catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
}
});

module.exports = {
    getsales,
    CreateSales,
    getsaleById,
    getCumulativesales,
    deletesale,
    Updatesale,
};
