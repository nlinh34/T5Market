// admin.js

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Handle delete confirmation modal
    const deleteModal = document.getElementById('deleteModal');
    const deleteButton = document.querySelectorAll('.delete-button');

    deleteButton.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            const confirmDeleteButton = deleteModal.querySelector('.confirm-delete');

            confirmDeleteButton.onclick = function() {
                // Perform delete action
                fetch(`/admin/products/${productId}`, {
                    method: 'DELETE',
                })
                .then(response => {
                    if (response.ok) {
                        location.reload(); // Reload the page after deletion
                    } else {
                        alert('Error deleting product');
                    }
                });
            });
        });
    });

    // Handle pagination
    const paginationLinks = document.querySelectorAll('.pagination-link');
    paginationLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            loadPage(page);
        });
    });

    function loadPage(page) {
        fetch(`/admin/products?page=${page}`)
            .then(response => response.text())
            .then(html => {
                document.getElementById('product-list').innerHTML = html;
            });
    }
});