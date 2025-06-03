// controllers/admin/productController.js
const mongoose = require('mongoose');
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const User = require('../../models/User');
const Order = require('../../models/Order');
const Review = require('../../models/Review');
const ProductView = require('../../models/ProductView');

//
// --- 1. Trang danh sách sản phẩm (GET /admin/products) ---
//
const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.condition) filter.condition = req.query.condition;
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const products = await Product.find(filter)
      .populate('seller', 'fullName shopName')
      .populate('category', 'name')
      .sort('-createdAt')
      .limit(limit)
      .skip(skip);

    const total = await Product.countDocuments(filter);
    const categories = await Category.find({ isActive: true });

    res.render('admin/products/index', {
      title: 'Quản lý sản phẩm',
      products,
      categories,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      },
      query: req.query
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('admin/error', { message: 'Lỗi server' });
  }
};

//
// --- 2. Trang chi tiết sản phẩm (GET /admin/products/:id) ---
//
const showProductDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).render('admin/error', {
        title: 'Lỗi 404',
        message: 'Sản phẩm không tồn tại'
      });
    }

    const product = await Product.findById(id)
      .populate('category')
      .populate('seller', 'fullName shopName');

    if (!product) {
      return res.status(404).render('admin/error', {
        title: 'Lỗi 404',
        message: 'Sản phẩm không tồn tại'
      });
    }

    // Lấy thống kê
    const stats = {
      totalViews: await ProductView.countDocuments({ product: id }) || 0,
      totalOrders: await Order.countDocuments({ product: id }) || 0,
      totalRevenue: await Order.aggregate([
        {
          $match: {
            product: new mongoose.Types.ObjectId(id),
            status: 'DELIVERED'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]).then(r => r[0]?.total || 0),
      averageRating: await Review.aggregate([
        {
          $match: {
            product: new mongoose.Types.ObjectId(id)
          }
        },
        {
          $group: {
            _id: null,
            avg: { $avg: '$rating' }
          }
        }
      ]).then(r => (r[0]?.avg || 0).toFixed(1))
    };

    res.render('admin/products/detail', {
      title: 'Chi tiết sản phẩm',
      product,
      stats,
      formatCurrency: amount => new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount),
      formatDate: date => new Date(date).toLocaleDateString('vi-VN')
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).render('admin/error', {
      title: 'Lỗi 500',
      message: 'Có lỗi xảy ra khi tải thông tin sản phẩm'
    });
  }
};

//
// --- 3. Trang form chỉnh sửa sản phẩm (GET /admin/products/:id/edit) ---
//
const editProductForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).render('admin/error', {
        title: 'Lỗi 404',
        message: 'Sản phẩm không tồn tại'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).render('admin/error', {
        title: 'Lỗi 404',
        message: 'Sản phẩm không tồn tại'
      });
    }

    const categories = await Category.find({ isActive: true });
    const sellers = await User.find({ role: 'seller' });

    res.render('admin/products/edit', { product, categories, sellers });
  } catch (error) {
    console.error('Edit form error:', error);
    next(error);
  }
};

//
// --- 4. Xử lý cập nhật sản phẩm (PUT /admin/products/:id) ---
//
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).render('admin/error', {
        title: 'Lỗi 404',
        message: 'Sản phẩm không tồn tại'
      });
    }

    const updateData = {
      name: req.body.name,
      description: req.body.description,
      condition: req.body.condition,
      category: req.body.category,
      seller: req.body.seller,
      price: Number(req.body.price),
      status: req.body.status,
      stock: Number(req.body.stock)
    };

    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => `/uploads/products/${file.filename}`);
    }

    const updated = await Product.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return res.status(404).render('admin/error', {
        title: 'Lỗi 404',
        message: 'Không tìm thấy sản phẩm'
      });
    }

    res.redirect('/admin/products');
  } catch (error) {
    console.error('Update product error:', error);
    next(error);
  }
};

//
// --- 5. Tạo mới sản phẩm (POST /admin/products) ---
//
const createProduct = async (req, res) => {
  try {
    const {
      name, categoryId, price, stock, description,
      brand, condition
    } = req.body;

    if (!brand || !condition) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin sản phẩm'
      });
    }

    const images = req.files?.map(file => `/uploads/products/${file.filename}`) || [];

    const product = new Product({
      name,
      category: categoryId,
      price: Number(price),
      stock: Number(stock),
      description,
      images,
      seller: req.user._id,
      brand,
      condition,
      status: 'PENDING'
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Thêm sản phẩm thành công'
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Có lỗi xảy ra khi thêm sản phẩm'
    });
  }
};

//
// --- 6. Duyệt sản phẩm (PUT /admin/products/:id/approve) ---
//
const approveProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'ACTIVE' },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    res.json({ message: 'Duyệt sản phẩm thành công', product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

//
// --- 7. Từ chối sản phẩm (PUT /admin/products/:id/reject) ---
//
const rejectProduct = async (req, res) => {
  try {
    const { reason } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'REJECTED', rejectionReason: reason },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    res.json({ message: 'Từ chối sản phẩm thành công', product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

//
// --- 8. Xóa sản phẩm (DELETE /admin/products/:id) ---
//
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  getProducts,
  showProductDetail,
  editProductForm,
  updateProduct,
  createProduct,
  approveProduct,
  rejectProduct,
  deleteProduct
};
