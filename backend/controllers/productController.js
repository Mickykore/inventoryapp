const { Category, Product, CumulativeProducts } = require('../models/productsModel');
const asyncHandler = require('express-async-handler');
const User = require('../models/usermodels');
const {upload, fileSizeFormatter} = require('../utils/fileUpload');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const { Sale, Cumulativesales } = require('../models/salesModel');
//
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @desc    Fetch all products

// create category
const createCategory = asyncHandler(async (req, res) => {
    const {name} = req.body;
    const existingCategory = await Category.findOne({name});


    if (existingCategory) {
        res.status(400);
        throw new Error('Category already exists');
    }
    //vallidate data
    if (!name) {
        res.status(400);
        throw new Error('Please fill all fields');
    }
    //check if category exists
    
    const category = await Category.create({
        name,
    });
    if (!category) {
        res.status(400);
        throw new Error('Invalid category data');
    }
    await category.save();
    res.json(category);
    // res.send('get all products');

});

// get all categories
const getCategories = asyncHandler(async (req, res) => {


    const categories = await Category.find({});
    res.json(categories);
});

// update category
const UpdateCategory = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

        res.status(400);
        throw new Error('Invalid product ID');
    }
    const category = await Category.findById(req.params.id);

    if (category) {
        category.name = req.body.name || category.name;
        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
});

// delete category
const deleteCategory = asyncHandler(async (req, res) => {
    try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid product ID');
    }

    const category = await Category.findById(req.params.id);
    const product = await Product.findOne({category: category._id});
    if (product) {
        res.status(400);
        throw new Error('Category has products, cannot delete');
    }
    if (category) {
        await category.deleteOne();
        res.json(category);
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
} catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
}
});

const getCategoryById = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid product ID');
    }

    const product = await Category.findById(req.params.id)
    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});


const CreateProduct = asyncHandler(async (req, res) => {
    try {
    const userId = req.user._id;


    // Converting properties to numbers without creating new variables
    req.body.purchasedPrice = parseFloat(req.body.purchasedPrice);
    req.body.minSellingPrice = parseFloat(req.body.minSellingPrice );
    req.body.maxSellingPrice = parseFloat(req.body.maxSellingPrice);
    req.body.quantity = parseInt(req.body.quantity);

    const {name, category, brand, purchasedPrice, minSellingPrice, maxSellingPrice, quantity, addedBy, description, image, includeVAT} = req.body;


    // Calculate adjusted purchased price and VAT amount
    let adjustedPurchasedPrice = purchasedPrice;
    let VATamount = 0;
    if (includeVAT) {
        adjustedPurchasedPrice = purchasedPrice / 1.15;
        VATamount = (purchasedPrice - adjustedPurchasedPrice);
    }

    //vallidate data
    if (!name || !brand || !purchasedPrice || !quantity || !minSellingPrice || !maxSellingPrice || !category ) {
        res.status(400);
        throw new Error('Please fill all fields');
    }

    if (minSellingPrice > maxSellingPrice) {
        res.status(400);
        throw new Error('Minimum selling price cannot be greater than maximum selling price');
    }

    if (adjustedPurchasedPrice > minSellingPrice) {
    console.log(typeof minSellingPrice, typeof adjustedPurchasedPrice);

        res.status(400);
        throw new Error('Minimum selling price cannot be less than purchased price');
    }
    
    // Handle Image upload
  let fileData = {};
  if (req.file) {
    // Save image to cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "Pinvent App",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

    //check if category exists

    const productCategory = await Category.findOne({name: new RegExp(category, 'i')});
    if (!productCategory) {
        res.status(400);
        throw new Error('Invalid category');
    }
    
    //create product
    const product = await Product.create({
        name,
        category: productCategory._id,
        brand,
        purchasedPrice: adjustedPurchasedPrice,
        sellingPriceRange: {
            minSellingPrice,
            maxSellingPrice,
        },
        quantity,
        addedBy: userId,
        description,
        image: fileData,
        includeVAT,
        VATamount,
    });

    console.log("check", typeof product.purchasedPrice, typeof product.sellingPriceRange.minSellingPrice, typeof product.sellingPriceRange.maxSellingPrice, typeof product.quantity, typeof product.VATamount)
    

    //save it in commulative products
    // Create or update product in CumulativeProduct collection
    const cumulativeProduct = await CumulativeProducts.findOneAndUpdate(
        { 
            name: new RegExp(`${product.name}`, 'i'), 
            category: productCategory._id, 
            brand: new RegExp(`${product.brand}`, 'i') }, // find
        { 
        $inc: { quantity: quantity, totalVATamount: VATamount }, // Increment quantity
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
        image: product.image// Set other fields
    },
        { new: true, upsert: true, setDefaultsOnInsert: true } // options
    );

    if (!cumulativeProduct) {
        res.status(400);
        throw new Error('Invalid cumulative product data');
    }
    await product.save();
    res.json(product);
} catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
}
    

});
// get all products
const getProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort({createdAt: -1})
        .populate('category', 'name') // only return the 'name' field
        .populate('addedBy', 'firstname'); // only return the 'name' field

    res.json(products);
});

//get commulative products
const getCumulativeProducts = asyncHandler(async (req, res) => {
    const products = await CumulativeProducts.find({}).sort({createdAt: -1})
    .populate('category', 'name') // only return the 'name' field
    .populate('addedBy', 'firstname'); // only return the 'name' field

    res.json(products);
});

// get single product
const getProductById = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid product ID');
    }
    const product = await Product.findById(req.params.id)
        .populate('category', 'name') // only return the 'name' field
        .populate('addedBy', 'firstname'); // only return the 'name' field
        

    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

const deleteProduct = asyncHandler(async (req, res) => {
    const sessionId = await mongoose.startSession();
    try {
      const session = await sessionId.startTransaction();
  
      const product = await Product.findById(req.params.id).session(session);
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Product not found' });
      }

      let cumulativeProduct = await CumulativeProducts.findOne({name: product.name, category: product.category, brand: product.brand}).session(session);
      const sale = await Cumulativesales.findOne({ product: cumulativeProduct._id }).session(session);
      if (sale) {
        const cumulativeProductQuantity = cumulativeProduct.quantity;
        const saleQuantity = sale.quantity;
        const ProductQuantity = product.quantity;

        if ((cumulativeProductQuantity - ProductQuantity) < saleQuantity) {
          await session.abortTransaction();
          return res.status(400).json({ message: 'Product has been sold out, you can\'t this product' });
        }
      }
  
      cumulativeProduct = await CumulativeProducts.findOneAndUpdate(
        { name: product.name, category: product.category, brand: product.brand },
        { $inc: { quantity: -product.quantity, totalVATamount: -product.VATamount } },
        { new: true, session }
      );
  
      
  
      await product.deleteOne({ session });
      await session.commitTransaction();
  
      res.json(product);
    } catch (error) {
      console.error(error);
      await sessionId.abortTransaction();
      res.status(500).json({ message: 'Error deleting product' });
    } finally {
      sessionId.endSession();
    }
  });
  

// update product
const UpdateProduct = asyncHandler(async (req, res) => {
    try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid product ID');
    }

    const userId = req.user._id;

    // Converting properties to numbers without creating new variables
    req.body.purchasedPrice = parseFloat(req.body.purchasedPrice);
    req.body.minSellingPrice = parseFloat(req.body.minSellingPrice );
    req.body.maxSellingPrice = parseFloat(req.body.maxSellingPrice);
    req.body.quantity = parseInt(req.body.quantity);

    const {name, category, brand, purchasedPrice, minSellingPrice, maxSellingPrice, quantity, addedBy, description, image, includeVAT} = req.body;

    const product = await Product.findById(req.params.id);

    // Calculate adjusted purchased price and VAT amount
    let adjustedPurchasedPrice = purchasedPrice;
    let VATamount = product.VATamount;
    if (includeVAT) {
        adjustedPurchasedPrice = purchasedPrice / 1.15;
        VATamount = (purchasedPrice - adjustedPurchasedPrice);
    } else {
        VATamount = 0;
    }
    //vallidate data

    if (minSellingPrice > maxSellingPrice) {
        res.status(400);
        throw new Error('Minimum selling price cannot be greater than maximum selling price');
    }

    if (adjustedPurchasedPrice > minSellingPrice) {
    console.log(typeof minSellingPrice, typeof adjustedPurchasedPrice);

        res.status(400);
        throw new Error('Minimum selling price cannot be less than purchased price');
    }


    if (!product) {
        res.status(400);
        throw new Error('Product not found');
    }

    let cumulativeProductBefore = await CumulativeProducts.findOne({name: product.name, category: product.category, brand: product.brand});

    const sale = await Cumulativesales.findOne({ product: cumulativeProductBefore._id });

    if (sale) {
        const cumulativeProductQuantity = cumulativeProductBefore.quantity;
        const saleQuantity = sale.quantity;
        const ProductQuantity = product.quantity;
        const diffQuantity = ProductQuantity - quantity;

        if (diffQuantity > 0) {
            if ((cumulativeProductQuantity - diffQuantity) < saleQuantity) {
                res.status(400);
                throw new Error('Product has been sold out, you can\'t update this product');
            }
        }
    }


    // if the user updates the product first i should delete it from the cumulative products
    cumulativeProductBefore = await CumulativeProducts.findOneAndUpdate(
        { name: product.name, category: product.category, brand: product.brand }, // find
        { $inc: { quantity: -product.quantity, totalVATamount: -product.VATamount } }, // update
        { new: true, upsert: false, setDefaultsOnInsert: true } // options
    );


     // Handle Image upload
  let fileData = {};
  if (req.file) {
    // Save image to cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "Pinvent App",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  const productCategory = await Category.findOne({name: new RegExp(category, 'i')});
  if (!productCategory) {
      res.status(400);
      throw new Error('Invalid category');
  }
  
  //update product
    const updatedProduct = await Product.findByIdAndUpdate({_id: req.params.id}, {
        name,
        category: productCategory._id,
        brand,
        purchasedPrice: adjustedPurchasedPrice,
        sellingPriceRange: {
            minSellingPrice,
            maxSellingPrice,
        },
        quantity,
        includeVAT,
        VATamount,
        addedBy: userId,
        description,
        image: Object.keys(fileData).length === 0 ? product?.image : fileData,
    }, {new: true, upsert: true, setDefaultsOnInsert: true});

    console.log(updatedProduct.sellingPriceRange.minSellingPrice);

    // after updating the product i should update the cumulative products
    const cumulativeProduct = await CumulativeProducts.findOneAndUpdate(
        { 
            name: new RegExp(updatedProduct.name, 'i'), 
            category: updatedProduct.category, 
            brand:  new RegExp(updatedProduct.brand, 'i')
        }, // Filter
        { 
            $inc: { 
                quantity: updatedProduct.quantity, 
                totalVATamount: updatedProduct.VATamount,
            },
            $set: {
                purchasedPrice: updatedProduct.purchasedPrice,
                'sellingPriceRange.minSellingPrice': updatedProduct.sellingPriceRange.minSellingPrice,
                'sellingPriceRange.maxSellingPrice': updatedProduct.sellingPriceRange.maxSellingPrice,
                addedBy: updatedProduct.addedBy,
                description: updatedProduct.description,
                image: updatedProduct.image,
            }
        }, // Update
        { new: true, upsert: true, setDefaultsOnInsert: true } // Options
    ); 
    console.log(cumulativeProduct);

    res.status(200).json(updatedProduct);
} catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
}
});

module.exports = {
    createCategory,
    getCategories,
    UpdateCategory,
    deleteCategory,
    getCategoryById,
    getProducts,
    CreateProduct,
    getProductById,
    getCumulativeProducts,
    deleteProduct,
    UpdateProduct,
};