const Category = require('../../models/Category');

const getCategories = async (req, res) => {
    try {
        const categories = await Category.find()
            .populate('parentCategory', 'name')
            .populate('subCategories', 'name')
            .sort('name');

        res.render('admin/categories/index', {
            title: 'Quản lý danh mục',
            categories
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('admin/error', { message: 'Lỗi server' });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, description, parentCategory } = req.body;

        const category = new Category({
            name,
            description,
            parentCategory: parentCategory || null
        });

        await category.save();

        if (parentCategory) {
            await Category.findByIdAndUpdate(
                parentCategory,
                { $push: { subCategories: category._id } }
            );
        }

        res.status(201).json({ message: 'Tạo danh mục thành công', category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { name, description, isActive } = req.body;

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, description, isActive },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }

        res.json({ message: 'Cập nhật danh mục thành công', category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }

        if (category.subCategories.length > 0) {
            return res.status(400).json({ message: 'Không thể xóa danh mục có danh mục con' });
        }

        await Category.findByIdAndDelete(req.params.id);

        if (category.parentCategory) {
            await Category.findByIdAndUpdate(
                category.parentCategory,
                { $pull: { subCategories: category._id } }
            );
        }

        res.json({ message: 'Xóa danh mục thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};