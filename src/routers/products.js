import express from 'express';
import productController from '../controllers/products.js';
import authMiddleware  from '../middleware/auth.js';

const router = express.Router();

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductDetails);


router.post('/', authMiddleware.protect, authMiddleware.admin, productController.createProduct);
router.put('/:id', authMiddleware.protect, authMiddleware.admin, productController.updateProduct);
router.delete('/:id', authMiddleware.protect, authMiddleware.admin, productController.deleteProduct);

export default router;