// middleware/viewHelpers.js
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
    }
};

module.exports = (req, res, next) => {
    // Add individual helpers to res.locals
    Object.keys(helpers).forEach(key => {
        res.locals[key] = helpers[key];
    });
    
    // Also add helpers object for cases where you need it grouped
    res.locals.helpers = helpers;
    
    next();
};