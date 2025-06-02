document.getElementById('addProductForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(this);
        const fileInput = this.querySelector('input[name="images"]');
        
        // Basic validation
        const brand = formData.get('brand');
        const condition = formData.get('condition');
        
        if (!brand || !condition) {
            alert('Vui lòng điền đầy đủ thông tin sản phẩm');
            return;
        }

        // Reset and append files
        formData.delete('images');
        for (const file of fileInput.files) {
            formData.append('images', file);
        }

        const response = await fetch('/admin/products', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        if (response.ok) {
            window.location.reload();
        } else {
            alert(result.message || 'Có lỗi xảy ra');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Có lỗi xảy ra khi thêm sản phẩm');
    }
});