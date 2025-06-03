// controllers/admin/orderController.js:
const Order = require('../../models/Order');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Payment = require('../../models/Payment');
const mongoose = require('mongoose'); // Import mongoose để kiểm tra ObjectId

// Hàm trợ giúp để lấy văn bản trạng thái tiếp theo (được chuyển từ EJS sang controller)
const getNextStatusText = (currentStatus) => {
    const nextStatus = {
        'PENDING': 'Xác nhận đơn hàng',
        'CONFIRMED': 'Bắt đầu giao hàng',
        'SHIPPING': 'Xác nhận đã giao'
    };
    return nextStatus[currentStatus] || '';
};

const getOrders = async (req, res) => {
    try {
        // Thêm phân trang
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        // Thêm bộ lọc
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.payment) {
            filter.isPaid = req.query.payment === 'PAID';
        }
        if (req.query.search) {
            // Tìm kiếm theo ID đơn hàng (một phần) hoặc tên người mua
            filter.$or = [
                { '_id': { $regex: req.query.search, $options: 'i' } }, // Tìm kiếm theo ID
                { 'buyer.fullName': { $regex: req.query.search, $options: 'i' } } // Tìm kiếm theo tên người mua
            ];
        }

        // Lấy đơn hàng với phân trang
        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate('buyer', 'fullName email phoneNumber')
                .populate('seller', 'fullName shopName email')
                .populate('product', 'name price images brand')
                .sort('-createdAt')
                .skip(skip)
                .limit(limit),
            Order.countDocuments(filter)
        ]);

        // Lấy người mua và sản phẩm
        const [buyers, products] = await Promise.all([
            User.find({ 
                role: 'BUYER',
                isDeleted: { $ne: true }
            })
            .select('fullName email phoneNumber')
            .sort('fullName'),
            Product.find({
                isDeleted: { $ne: true }
            })
            .select('name price stock seller brand category images')
            .populate('seller', 'fullName shopName email')
            .populate('category', 'name')
            .sort('name')
        ]);

        // Lấy thống kê
        const stats = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: {
                        $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] }
                    },
                    confirmed: {
                        $sum: { $cond: [{ $eq: ['$status', 'CONFIRMED'] }, 1, 0] }
                    },
                    shipping: {
                        $sum: { $cond: [{ $eq: ['$status', 'SHIPPING'] }, 1, 0] }
                    },
                    delivered: {
                        $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] }
                    },
                    cancelled: { // Thêm trạng thái đã hủy vào thống kê
                        $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] }
                    },
                    completed: {
                        $sum: { $cond: [{ $in: ['$status', ['DELIVERED', 'CANCELLED']] }, 1, 0] }
                    }
                }
            }
        ]).then(results => results[0] || {
            total: 0,
            pending: 0,
            confirmed: 0,
            shipping: 0,
            delivered: 0,
            cancelled: 0, // Khởi tạo nếu không có kết quả
            completed: 0
        });

        // Tạo đối tượng helpers
        const helpers = {
            formatCurrency: (amount) => {
                return new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                }).format(amount || 0);
            },
            formatDate: (date) => {
                return new Date(date).toLocaleDateString('vi-VN');
            },
            getStatusBadgeClass: (status) => {
                const classes = {
                    'PENDING': 'bg-warning',
                    'CONFIRMED': 'bg-info',
                    'SHIPPING': 'bg-primary', 
                    'DELIVERED': 'bg-success',
                    'CANCELLED': 'bg-danger'
                };
                return classes[status] || 'bg-secondary';
            },
            getStatusText: (status) => {
                const texts = {
                    'PENDING': 'Chờ xác nhận',
                    'CONFIRMED': 'Đã xác nhận',
                    'SHIPPING': 'Đang giao hàng',
                    'DELIVERED': 'Đã giao hàng',
                    'CANCELLED': 'Đã hủy'
                };
                return texts[status] || status;
            },
            isOrderCompleted: (status) => {
                return ['DELIVERED', 'CANCELLED'].includes(status);
            },
            isOrderCancellable: (status) => {
                return ['PENDING', 'CONFIRMED'].includes(status);
            },
            // Truyền getNextStatusText cho trang chi tiết EJS
            getNextStatusText: getNextStatusText 
        };

        // Truyền dữ liệu đến view
        res.render('admin/orders/index', {
            title: 'Quản lý đơn hàng',
            orders,
            buyers,
            products,
            stats,
            helpers,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            },
            query: req.query
        });

    } catch (error) {
        console.error('Lỗi khi lấy đơn hàng:', error);
        res.status(500).render('admin/error', {
            title: 'Lỗi 500',
            message: 'Có lỗi xảy ra: ' + error.message
        });
    }
};

const getOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        // Kiểm tra xem ID có phải là ObjectId hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            console.error(`Invalid ObjectId for getOrder: ${orderId}`);
            return res.status(400).render('admin/error', {
                title: 'Lỗi ID',
                message: 'ID đơn hàng không hợp lệ.'
            });
        }

        const order = await Order.findById(orderId)
            .populate('buyer', 'fullName email phoneNumber')
            .populate('seller', 'fullName shopName email phoneNumber')
            .populate('product', 'name price images description brand');

        if (!order) {
            return res.status(404).render('admin/error', { 
                title: 'Không tìm thấy',
                message: 'Không tìm thấy đơn hàng' 
            });
        }

        // Khởi tạo statusHistory nếu nó không tồn tại
        if (!order.statusHistory || !Array.isArray(order.statusHistory)) {
            order.statusHistory = [
                {
                    status: order.status,
                    date: order.createdAt || new Date(),
                    note: 'Đơn hàng được tạo'
                }
            ];
        }

        const payment = await Payment.findOne({ order: order._id });

        // Thêm các hàm trợ giúp cho view
        const viewHelpers = {
            formatCurrency: (amount) => {
                return new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                }).format(amount || 0);
            },
            formatDate: (date) => {
                return new Date(date).toLocaleDateString('vi-VN');
            },
            formatDateTime: (date) => {
                return new Date(date).toLocaleString('vi-VN');
            },
            getStatusBadgeClass: (status) => {
                const classes = {
                    'PENDING': 'warning', 
                    'CONFIRMED': 'info', 
                    'SHIPPING': 'primary', 
                    'DELIVERED': 'success',
                    'CANCELLED': 'danger'
                };
                return classes[status] || 'secondary';
            },
            getStatusText: (status) => {
                const texts = {
                    'PENDING': 'Chờ xác nhận',
                    'CONFIRMED': 'Đã xác nhận', 
                    'SHIPPING': 'Đang giao',
                    'DELIVERED': 'Đã giao',
                    'CANCELLED': 'Đã hủy'
                };
                return texts[status] || status;
            },
            getPaymentMethod: (method) => {
                const methods = {
                    'CREDIT_CARD': 'Thẻ tín dụng',
                    'BANK_TRANSFER': 'Chuyển khoản',
                    'COD': 'Thanh toán khi nhận hàng',
                    'E_WALLET': 'Ví điện tử'
                };
                return methods[method] || method;
            },
            getPaymentStatus: (status) => {
                const statuses = {
                    'PENDING': 'Chờ thanh toán',
                    'COMPLETED': 'Đã thanh toán',
                    'FAILED': 'Thanh toán thất bại',
                    'REFUNDED': 'Đã hoàn tiền'
                };
                return statuses[status] || status;
            },
            isOrderCompleted: (status) => {
                return ['DELIVERED', 'CANCELLED'].includes(status);
            },
            // Truyền getNextStatusText cho trang chi tiết EJS
            getNextStatusText: getNextStatusText 
        };

        res.render('admin/orders/detail', {
            title: 'Chi tiết đơn hàng',
            order,
            payment: payment || { status: 'PENDING', method: 'COD' },
            ...viewHelpers // Truyền các hàm trợ giúp vào template
        });
    } catch (error) {
        console.error('Lỗi khi lấy đơn hàng:', error);
        res.status(500).render('admin/error', {
            title: 'Lỗi server',
            message: 'Lỗi server: ' + error.message
        });
    }
};

// Hàm controller mới để lấy dữ liệu đơn hàng để chỉnh sửa (trả về JSON)
const getEditOrderData = async (req, res) => {
    try {
        const orderId = req.params.id;
        // Kiểm tra xem ID có phải là ObjectId hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            console.error(`Invalid ObjectId for getEditOrderData: ${orderId}`);
            return res.status(400).json({ message: 'ID đơn hàng không hợp lệ.' });
        }

        const order = await Order.findById(orderId)
            .populate('product', 'name price stock'); // Chỉ cần chi tiết sản phẩm để lấy giá/tồn kho

        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        res.json({
            _id: order._id,
            quantity: order.quantity,
            shippingFee: order.shippingFee,
            shippingAddress: order.shippingAddress,
            notes: order.notes,
            product: {
                _id: order.product._id,
                name: order.product.name,
                price: order.product.price,
                stock: order.product.stock
            }
        });
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu chỉnh sửa đơn hàng:', error);
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
};

// Hàm mới để cập nhật trạng thái thanh toán
const updatePaymentStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        // Kiểm tra xem ID có phải là ObjectId hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            console.error(`Invalid ObjectId for updatePaymentStatus: ${orderId}`);
            return res.status(400).json({ message: 'ID đơn hàng không hợp lệ.' });
        }

        const { status } = req.body; // 'COMPLETED', 'REFUNDED', 'PENDING', 'FAILED'

        if (!status) {
            return res.status(400).json({ message: 'Thiếu thông tin trạng thái thanh toán' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        let payment = await Payment.findOne({ order: order._id });

        if (!payment) {
            // Nếu không có bản ghi thanh toán tồn tại, tạo một bản ghi mới. Điều này có thể xảy ra với các đơn hàng COD.
            payment = new Payment({
                order: order._id,
                amount: order.totalAmount, // Giả sử totalAmount là số tiền thanh toán
                method: 'COD', // Mặc định là COD nếu tạo nhanh, hoặc suy luận từ order nếu có thể
                status: status,
                transactionId: `ADMIN_MANUAL_${Date.now()}` // ID giao dịch giữ chỗ
            });
        } else {
            // Cập nhật thanh toán hiện có
            payment.status = status;
        }

        // Lưu thanh toán
        await payment.save();

        // Cập nhật trạng thái isPaid của đơn hàng dựa trên trạng thái thanh toán
        order.isPaid = (status === 'COMPLETED');
        
        // Thêm thay đổi trạng thái thanh toán vào lịch sử đơn hàng (tùy chọn nhưng tốt cho việc theo dõi)
        order.statusHistory.push({
            status: order.status, // Giữ nguyên trạng thái đơn hàng, nhưng thêm ghi chú về thanh toán
            date: new Date(),
            note: `Cập nhật trạng thái thanh toán: ${status}`
        });

        await order.save(); // Lưu đơn hàng đã cập nhật với isPaid và statusHistory

        res.json({
            success: true,
            message: 'Cập nhật trạng thái thanh toán thành công',
            payment: payment,
            order: order // Trả về đơn hàng đã cập nhật
        });

    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái thanh toán:', error); // Log lỗi chi tiết hơn
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
};


const updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        // Kiểm tra xem ID có phải là ObjectId hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            console.error(`Invalid ObjectId for updateOrderStatus: ${orderId}`);
            return res.status(400).json({ message: 'ID đơn hàng không hợp lệ.' });
        }

        const { action, status } = req.body;
        let newStatus;

        if (action) {
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            }

            if (action === 'cancel') {
                if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
                    return res.status(400).json({ 
                        message: 'Không thể hủy đơn hàng ở trạng thái này' 
                    });
                }
                newStatus = 'CANCELLED';
            } else if (action === 'next') {
                const statusFlow = {
                    'PENDING': 'CONFIRMED',
                    'CONFIRMED': 'SHIPPING',
                    'SHIPPING': 'DELIVERED'
                };
                
                newStatus = statusFlow[order.status];
                if (!newStatus) {
                    return res.status(400).json({ 
                        message: 'Không thể cập nhật trạng thái tiếp theo' 
                    });
                }
            }
        } else if (status) {
            newStatus = status;
        } else {
            return res.status(400).json({ message: 'Thiếu thông tin trạng thái' });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { 
                status: newStatus,
                $push: {
                    statusHistory: {
                        status: newStatus,
                        date: new Date(),
                        note: `Cập nhật bởi admin`
                    }
                }
            },
            { new: true }
        ).populate('buyer', 'fullName email')
         .populate('product', 'name');

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        // Nếu đơn hàng bị hủy, khôi phục số lượng sản phẩm vào kho
        if (newStatus === 'CANCELLED' && updatedOrder.product) {
            await Product.findByIdAndUpdate(updatedOrder.product._id, {
                $inc: { stock: updatedOrder.quantity }
            });
        }

        res.json({ 
            message: 'Cập nhật trạng thái đơn hàng thành công', 
            order: updatedOrder 
        });

    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error); // Log lỗi chi tiết hơn
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
};

const createOrder = async (req, res) => {
    try {
        const {
            buyerId,
            sellerId,
            productId,
            quantity,
            shippingFee = 0,
            shippingAddress,
            notes
        } = req.body;

        // Xác thực đầu vào
        if (!buyerId || !productId || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc (buyerId, productId, quantity)'
            });
        }

        // Xác thực địa chỉ giao hàng
        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phoneNumber || !shippingAddress.address) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin địa chỉ giao hàng'
            });
        }

        // Kiểm tra xem sản phẩm có tồn tại và có đủ số lượng tồn kho không
        const product = await Product.findById(productId).populate('seller', '_id');
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Số lượng sản phẩm không đủ. Chỉ còn ${product.stock} sản phẩm`
            });
        }

        // Sử dụng người bán từ sản phẩm nếu không được cung cấp
        const finalSellerId = sellerId || product.seller._id;

        // Tính tổng số tiền
        const totalAmount = (product.price * quantity) + (shippingFee || 0);

        // Tạo đơn hàng mới với khởi tạo thích hợp
        const order = new Order({
            buyer: buyerId,
            seller: finalSellerId,
            product: productId,
            quantity,
            shippingFee,
            totalAmount,
            shippingAddress,
            notes,
            status: 'PENDING',
            isPaid: false,
            statusHistory: [{
                status: 'PENDING',
                date: new Date(),
                note: 'Đơn hàng được tạo bởi admin'
            }]
        });

        // Lưu đơn hàng và cập nhật số lượng tồn kho sản phẩm trong giao dịch
        const session = await Order.startSession();
        session.startTransaction();

        try {
            await order.save({ session });
            await Product.findByIdAndUpdate(
                productId, 
                { $inc: { stock: -quantity } }, 
                { session }
            );
            
            await session.commitTransaction();
            
            res.status(201).json({
                success: true,
                message: 'Tạo đơn hàng thành công',
                orderId: order._id
            });
        } catch (error) {
            await session.abortTransaction();
            console.error('Lỗi giao dịch khi tạo đơn hàng:', error); // Log lỗi giao dịch
            throw error;
        } finally {
            session.endSession();
        }

    } catch (error) {
        console.error('Lỗi khi tạo đơn hàng:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Có lỗi xảy ra khi tạo đơn hàng'
        });
    }
};

const updateOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        // Kiểm tra xem ID có phải là ObjectId hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            console.error(`Invalid ObjectId for updateOrder: ${orderId}`);
            return res.status(400).json({ message: 'ID đơn hàng không hợp lệ.' });
        }

        const updateData = req.body;

        // Xác thực đơn hàng có tồn tại không
        const existingOrder = await Order.findById(orderId).populate('product', 'price stock');
        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Không cho phép cập nhật các đơn hàng đã hoàn thành
        if (['DELIVERED', 'CANCELLED'].includes(existingOrder.status)) {
            return res.status(400).json({
                success: false,
                message: 'Không thể sửa đơn hàng đã hoàn thành hoặc bị hủy'
            });
        }

        // Nếu số lượng đang được cập nhật, kiểm tra tồn kho
        if (updateData.quantity !== undefined && updateData.quantity !== existingOrder.quantity) {
            const product = existingOrder.product; // Sản phẩm đã được populate
            const stockDifference = updateData.quantity - existingOrder.quantity;
            
            if (stockDifference > 0 && product.stock < stockDifference) {
                return res.status(400).json({
                    success: false,
                    message: `Số lượng sản phẩm không đủ. Chỉ còn ${product.stock} sản phẩm`
                });
            }

            // Cập nhật số lượng tồn kho sản phẩm
            await Product.findByIdAndUpdate(existingOrder.product._id, {
                $inc: { stock: -stockDifference }
            });

            // Tính toán lại tổng số tiền chỉ khi số lượng hoặc phí vận chuyển thay đổi
            const newShippingFee = updateData.shippingFee !== undefined ? updateData.shippingFee : existingOrder.shippingFee;
            updateData.totalAmount = (product.price * updateData.quantity) + newShippingFee;
        } else if (updateData.shippingFee !== undefined && updateData.shippingFee !== existingOrder.shippingFee) {
            // Tính toán lại tổng số tiền nếu chỉ phí vận chuyển thay đổi
            const product = existingOrder.product;
            updateData.totalAmount = (product.price * existingOrder.quantity) + updateData.shippingFee;
        }


        // Cập nhật đơn hàng
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            updateData,
            { new: true }
        ).populate('buyer', 'fullName email')
         .populate('seller', 'fullName shopName')
         .populate('product', 'name price');

        res.json({
            success: true,
            message: 'Cập nhật đơn hàng thành công',
            order: updatedOrder
        });

    } catch (error) {
        console.error('Lỗi khi cập nhật đơn hàng:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message
        });
    }
};

const deleteOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        // Kiểm tra xem ID có phải là ObjectId hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            console.error(`Invalid ObjectId for deleteOrder: ${orderId}`);
            return res.status(400).json({ success: false, message: 'ID đơn hàng không hợp lệ.' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        if (!['PENDING', 'CANCELLED'].includes(order.status)) { 
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể xóa đơn hàng đang chờ xác nhận hoặc đã hủy'
            });
        }

        // Khôi phục số lượng sản phẩm vào kho nếu đơn hàng ở trạng thái PENDING
        if (order.status === 'PENDING') {
            await Product.findByIdAndUpdate(order.product, {
                $inc: { stock: order.quantity }
            });
        }

        // Xóa đơn hàng
        await Order.findByIdAndDelete(orderId);

        res.json({
            success: true,
            message: 'Xóa đơn hàng thành công'
        });

    } catch (error) {
        console.error('Lỗi khi xóa đơn hàng:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message
        });
    }
};

module.exports = {
    getOrders,
    getOrder,
    getEditOrderData, 
    updateOrderStatus,
    updatePaymentStatus, 
    createOrder,
    updateOrder,
    deleteOrder
};