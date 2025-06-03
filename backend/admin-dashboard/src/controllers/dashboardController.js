const renderDashboard = (req, res) => {
    res.render('admin/dashboard', {
        title: 'Admin Dashboard',
        layout: 'layouts/admin'
    });
};

const getDashboardData = async (req, res) => {
    try {
        // Fetch relevant data for the dashboard
        const data = {
            // Example data structure
            totalUsers: 100,
            totalProducts: 200,
            totalOrders: 50,
            totalReviews: 150
        };
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
};

module.exports = {
    renderDashboard,
    getDashboardData
};