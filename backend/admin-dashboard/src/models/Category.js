const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Static method to get all categories
categorySchema.statics.getAllCategories = async function() {
    return await this.find({});
};

// Instance method to get category by ID
categorySchema.methods.getCategoryById = async function(id) {
    return await this.model('Category').findById(id);
};

// Instance method to update category
categorySchema.methods.updateCategory = async function(data) {
    this.name = data.name || this.name;
    this.description = data.description || this.description;
    return await this.save();
};

// Instance method to delete category
categorySchema.methods.deleteCategory = async function() {
    return await this.remove();
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;