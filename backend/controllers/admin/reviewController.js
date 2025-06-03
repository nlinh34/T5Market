const Review = require('../../models/Review');

const getReviews = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.rating) filter.rating = req.query.rating;

        // Thêm thống kê đánh giá
        const stats = {
            total: await Review.countDocuments(),
            fiveStars: await Review.countDocuments({ rating: 5 }),
            oneStars: await Review.countDocuments({ rating: 1 }),
            averageRating: await Review.aggregate([
                {
                    $group: {
                        _id: null,
                        average: { $avg: '$rating' }
                    }
                }
            ]).then(result => result[0]?.average || 0)
        };

        const reviews = await Review.find(filter)
            .populate('buyer', 'fullName email')
            .populate('product', 'name price images')
            .sort('-createdAt')
            .limit(limit)
            .skip(skip);

        const total = await Review.countDocuments(filter);

        res.render('admin/reviews/index', {
            title: 'Quản lý đánh giá',
            reviews,
            stats, // Thêm stats vào đây
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            },
            query: req.query
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('admin/error', {
            message: 'Lỗi server',
            title: 'Lỗi 500'
        });
    }
};

const deleteReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);

        if (!review) {
            return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
        }

        res.json({ message: 'Xóa đánh giá thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

module.exports = {
    getReviews,
    deleteReview
};