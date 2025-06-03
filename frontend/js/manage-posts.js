document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Here you would typically load the appropriate posts based on the tab
            // For now, we'll just log the tab type
            console.log('Switched to tab:', this.dataset.tab);
        });
    });

    // Post action buttons functionality
    const actionButtons = document.querySelectorAll('.post-actions button');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const postItem = this.closest('.post-item');
            const postTitle = postItem.querySelector('h3').textContent;
            
            if (this.classList.contains('btn-promote')) {
                console.log('Promote post:', postTitle);
            } else if (this.classList.contains('btn-quick-sell')) {
                console.log('Quick sell post:', postTitle);
            } else if (this.classList.contains('btn-select')) {
                console.log('Select post:', postTitle);
                postItem.classList.toggle('selected');
                this.textContent = postItem.classList.contains('selected') ? 'Bỏ chọn' : 'Chọn tin';
            } else if (this.classList.contains('btn-extend')) {
                console.log('Extend post:', postTitle);
            } else if (this.classList.contains('btn-edit')) {
                console.log('Edit post:', postTitle);
            }
        });
    });
});