import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter product name'],
    trim: true,
    maxLength: [100, 'Product name cannot exceed 100 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please enter product price'],
    maxLength: [5, 'Product price cannot exceed 5 characters']
  },
  colors: [{
    type: String,
    required: true
  }],
  description: {
    type: String,
    required: [true, 'Please enter product description']
  },
  category: {
    type: String,
    required: [true, 'Please select category for this product']
  },
  availableOn: {
    type: Date,
    required: true
  },
  images: [{
    type: String,
    required: true
  }],
  stock: {
    type: Number,
    required: [true, 'Please enter product stock'],
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const Product = mongoose.model('Product', productSchema);

export default Product;