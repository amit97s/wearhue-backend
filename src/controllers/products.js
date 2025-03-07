import Product from '../models/products.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const productController = {
    createProduct : async (req, res) => {
        try {
          const images = [];
          
          const uploadDir = path.join(__dirname, '../uploads/products');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          if (!req.files || !req.files.images) {
            return res.status(400).json({ 
              success: false,
              message: 'Please upload product images' 
            });
          }
      
          const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      
          // Save images to upload folder
          for (const file of files) {
            const fileName = `product_${Date.now()}_${Math.round(Math.random() * 1E9)}${path.extname(file.name)}`;
            const filePath = path.join(uploadDir, fileName);
            
            await file.mv(filePath);
            images.push(fileName);
          }
      
          // Parse colors array if it's a string
          let colors = req.body.colors;
          if (typeof colors === 'string') {
            colors = JSON.parse(colors);
          }
      
          const productData = {
            ...req.body,
            colors,
            images,
            user: req.user.id
          };
      
          const product = await Product.create(productData);
      
          res.status(201).json({
            success: true,
            product
          });
        } catch (error) {
          console.error(error);
          res.status(500).json({
            success: false,
            message: error.message
          });
        }
      },
      
       getAllProducts : async (req, res) => {
        try {
          const page = parseInt(req.query.page) || 1;
          const limit = parseInt(req.query.limit) || 10;
          const skip = (page - 1) * limit;
          const sortBy = req.query.sortBy || 'createdAt';
          const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      
          const query = {};
      
          if (req.query.keyword) {
            query.$or = [
              { name: { $regex: req.query.keyword, $options: 'i' } },
              { description: { $regex: req.query.keyword, $options: 'i' } }
            ];
          }
      
          if (req.query.category) {
            query.category = req.query.category;
          }
      
          if (req.query.color) {
            query.colors = { $in: [req.query.color] };
          }
      
          if (req.query.minPrice && req.query.maxPrice) {
            query.price = {
              $gte: parseFloat(req.query.minPrice),
              $lte: parseFloat(req.query.maxPrice)
            };
          } else if (req.query.minPrice) {
            query.price = { $gte: parseFloat(req.query.minPrice) };
          } else if (req.query.maxPrice) {
            query.price = { $lte: parseFloat(req.query.maxPrice) };
          }
      
          if (req.query.availableFrom) {
            query.availableOn = { $gte: new Date(req.query.availableFrom) };
          }
      
          const products = await Product.find(query)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit);
      
          const totalProducts = await Product.countDocuments(query);
      
          res.status(200).json({
            success: true,
            count: products.length,
            total: totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
            currentPage: page,
            products
          });
        } catch (error) {
          console.error(error);
          res.status(500).json({
            success: false,
            message: error.message
          });
        }
      },

       getProductDetails : async (req, res) => {
        try {
          const product = await Product.findById(req.params.id);
      
          if (!product) {
            return res.status(404).json({
              success: false,
              message: 'Product not found'
            });
          }
      
          res.status(200).json({
            success: true,
            product
          });
        } catch (error) {
          console.error(error);
          res.status(500).json({
            success: false,
            message: error.message
          });
        }
      },
      
       updateProduct : async (req, res) => {
        try {
          let product = await Product.findById(req.params.id);
      
          if (!product) {
            return res.status(404).json({
              success: false,
              message: 'Product not found'
            });
          }
      
          if (req.files && req.files.images) {
            const uploadDir = path.join(__dirname, '../uploads/products');
            
            product.images.forEach(image => {
              const filePath = path.join(uploadDir, image);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            });
      
            const images = [];
            const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      
            for (const file of files) {
              const fileName = `product_${Date.now()}_${Math.round(Math.random() * 1E9)}${path.extname(file.name)}`;
              const filePath = path.join(uploadDir, fileName);
              
              await file.mv(filePath);
              images.push(fileName);
            }
      
            req.body.images = images;
          }
      
          if (req.body.colors && typeof req.body.colors === 'string') {
            req.body.colors = JSON.parse(req.body.colors);
          }
      
          product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
          });
      
          res.status(200).json({
            success: true,
            product
          });
        } catch (error) {
          console.error(error);
          res.status(500).json({
            success: false,
            message: error.message
          });
        }
      },

       deleteProduct : async (req, res) => {
        try {
          const product = await Product.findById(req.params.id);
      
          if (!product) {
            return res.status(404).json({
              success: false,
              message: 'Product not found'
            });
          }
      
          const uploadDir = path.join(__dirname, '../uploads/products');
          product.images.forEach(image => {
            const filePath = path.join(uploadDir, image);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          });
      
          await Product.findByIdAndDelete(req.params.id);
      
          res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
          });
        } catch (error) {
          console.error(error);
          res.status(500).json({
            success: false,
            message: error.message
          });
        }
      }
}


export default productController;