// public/js/admin/orders.js:
document.addEventListener('DOMContentLoaded', function() {
    initializeOrderForm();
    initializeEditOrderForm(); // Ensure this is called
});

function initializeOrderForm() {
    const addOrderForm = document.getElementById('addOrderForm');
    const productSelect = document.querySelector('#addOrderForm select[name="productId"]');
    const quantityInput = document.querySelector('#addOrderForm input[name="quantity"]');
    const shippingFeeInput = document.querySelector('#addOrderForm input[name="shippingFee"]');
    const totalElement = document.getElementById('totalAmount');

    if (!addOrderForm || !productSelect) {
        console.warn('Không tìm thấy các phần tử của form thêm đơn hàng');
        return;
    }

    // Hàm để cập nhật hiển thị tổng số tiền
    function updateAddTotal() {
        if (!productSelect || !quantityInput || !totalElement) return;

        const option = productSelect.options[productSelect.selectedIndex];
        if (!option || !option.value) { // Kiểm tra xem một tùy chọn đã được chọn và có giá trị chưa
            totalElement.textContent = '0 ₫';
            return;
        }

        const price = parseFloat(option.dataset.price) || 0;
        const quantity = parseInt(quantityInput.value) || 0;
        const shippingFee = parseFloat(shippingFeeInput?.value || 0);

        const total = price * quantity + shippingFee;
        totalElement.textContent = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(total);
    }

    // Hàm để cập nhật thông tin tồn kho và số lượng tối đa
    function updateAddStockInfo() {
        const selectedOption = productSelect.options[productSelect.selectedIndex];
        if (!selectedOption || !selectedOption.value) {
            quantityInput.max = ''; // Xóa thuộc tính max
            quantityInput.value = 1;
            quantityInput.disabled = false; // Đảm bảo nó được bật nếu chưa chọn sản phẩm
            return;
        }

        let stock = parseInt(selectedOption.dataset.stock);
        // Nếu dataset.stock không phải là số hoặc là chuỗi rỗng, coi nó là 0
        if (isNaN(stock)) {
            stock = 0;
        }
        
        if (stock <= 0) {
            quantityInput.value = 0; // Đặt số lượng về 0 nếu hết hàng
            quantityInput.max = 0; // Số lượng tối đa là 0
            quantityInput.disabled = true; // Vô hiệu hóa input
            showMessageBox('Sản phẩm này hiện đã hết hàng.', 'warning');
        } else {
            quantityInput.disabled = false;
            quantityInput.max = stock;
            // Đảm bảo số lượng hiện tại không vượt quá số lượng tồn kho mới
            if (parseInt(quantityInput.value) > stock) {
                quantityInput.value = stock;
            }
            // Đảm bảo số lượng ít nhất là 1 nếu có hàng
            if (parseInt(quantityInput.value) < 1) { 
                quantityInput.value = 1;
            }
        }
    }

    // Lắng nghe sự kiện
    productSelect.addEventListener('change', function() {
        updateAddStockInfo();
        updateAddTotal();
    });

    if (quantityInput) {
        quantityInput.addEventListener('change', updateAddTotal);
        quantityInput.addEventListener('input', updateAddTotal);
        quantityInput.addEventListener('change', updateAddStockInfo); // Cập nhật thông tin tồn kho khi số lượng thay đổi
    }

    if (shippingFeeInput) {
        shippingFeeInput.addEventListener('change', updateAddTotal);
        shippingFeeInput.addEventListener('input', updateAddTotal);
    }

    // Cập nhật ban đầu khi form tải (ví dụ: nếu modal được mở)
    // Đảm bảo logic này chạy khi modal được hiển thị lần đầu
    $('#addOrderModal').on('shown.bs.modal', function () {
        updateAddStockInfo();
        updateAddTotal();
    });

    // Gửi form - SỬA LỖI: Ngăn chặn gửi hai lần
    let isSubmitting = false;
    
    addOrderForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Ngăn chặn gửi hai lần
        if (isSubmitting) {
            console.log('Form đang được gửi');
            return;
        }
        
        isSubmitting = true;
        const submitButton = this.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        try {
            // Vô hiệu hóa nút gửi
            submitButton.disabled = true;
            submitButton.textContent = 'Đang tạo...';
            
            const formData = new FormData(this);
            const selectedOption = productSelect.options[productSelect.selectedIndex];

            if (!selectedOption || !selectedOption.value) { // Kiểm tra xem một tùy chọn đã được chọn chưa
                // Sử dụng hộp thông báo tùy chỉnh thay vì alert
                showMessageBox('Vui lòng chọn sản phẩm', 'danger');
                return;
            }

            const data = {
                buyerId: formData.get('buyerId'),
                productId: formData.get('productId'),
                sellerId: selectedOption.dataset.seller,
                quantity: parseInt(formData.get('quantity')),
                shippingFee: parseFloat(formData.get('shippingFee')) || 0,
                shippingAddress: {
                    fullName: formData.get('shippingAddress.fullName'),
                    phoneNumber: formData.get('shippingAddress.phoneNumber'),
                    address: formData.get('shippingAddress.address'),
                    ward: formData.get('shippingAddress.ward'),
                    district: formData.get('shippingAddress.district'),
                    city: formData.get('shippingAddress.city')
                },
                notes: formData.get('notes')
            };

            const response = await fetch('/admin/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (response.ok) {
                showMessageBox('Tạo đơn hàng thành công!', 'success');
                // Đóng modal và tải lại trang
                const modal = bootstrap.Modal.getInstance(document.getElementById('addOrderModal'));
                if (modal) modal.hide();
                window.location.reload();
            } else {
                showMessageBox(result.message || 'Có lỗi xảy ra', 'danger');
            }
        } catch (error) {
            console.error('Lỗi:', error);
            showMessageBox('Có lỗi xảy ra khi tạo đơn hàng', 'danger');
        } finally {
            // Kích hoạt lại nút gửi
            isSubmitting = false;
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
}

function initializeEditOrderForm() {
    const editOrderForm = document.getElementById('editOrderForm');
    const editQuantityInput = document.getElementById('editQuantity');
    const editShippingFeeInput = document.getElementById('editShippingFee');
    const totalAmountEditElement = document.getElementById('totalAmountEdit'); // Đảm bảo phần tử này tồn tại trong edit-order.ejs
    
    // Lưu giá sản phẩm của đơn hàng đang được chỉnh sửa
    // Giá này sẽ được đặt khi fillEditForm được gọi
    let currentProductPrice = 0; 
    let currentProductStock = 0;

    if (!editOrderForm) {
        console.warn('Không tìm thấy form chỉnh sửa đơn hàng');
        return;
    }

    // Hàm để tính toán và hiển thị tổng tiền cho form chỉnh sửa
    function updateEditTotal() {
        const quantity = parseInt(editQuantityInput.value) || 0;
        const shippingFee = parseFloat(editShippingFeeInput.value) || 0;
        const total = (currentProductPrice * quantity) + shippingFee;
        if (totalAmountEditElement) {
            totalAmountEditElement.textContent = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(total);
        }
    }

    // Lắng nghe sự kiện cho các input của form chỉnh sửa
    if (editQuantityInput) {
        editQuantityInput.addEventListener('input', updateEditTotal);
        // Thêm lắng nghe để đảm bảo số lượng không vượt quá tồn kho
        editQuantityInput.addEventListener('change', function() {
            if (parseInt(this.value) > currentProductStock) {
                this.value = currentProductStock;
            }
            if (parseInt(this.value) < 0) { // Đảm bảo số lượng không âm
                this.value = 0;
            }
            updateEditTotal();
        });
    }
    if (editShippingFeeInput) {
        editShippingFeeInput.addEventListener('input', updateEditTotal);
    }

    // SỬA LỖI: Ngăn chặn gửi hai lần cho form chỉnh sửa
    let isSubmitting = false;

    editOrderForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (isSubmitting) {
            console.log('Form chỉnh sửa đang được gửi');
            return;
        }
        
        isSubmitting = true;
        const submitButton = this.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Đang cập nhật...';
            
            const formData = new FormData(this);
            const orderId = formData.get('orderId');

            const data = {
                quantity: parseInt(formData.get('quantity')),
                shippingFee: parseFloat(formData.get('shippingFee')) || 0,
                shippingAddress: {
                    fullName: formData.get('shippingAddress.fullName'),
                    phoneNumber: formData.get('shippingAddress.phoneNumber'),
                    address: formData.get('shippingAddress.address'),
                    ward: formData.get('shippingAddress.ward'),
                    district: formData.get('shippingAddress.district'),
                    city: formData.get('shippingAddress.city')
                },
                notes: formData.get('notes')
            };

            const response = await fetch(`/admin/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (response.ok) {
                showMessageBox('Cập nhật đơn hàng thành công!', 'success');
                const modal = bootstrap.Modal.getInstance(document.getElementById('editOrderModal'));
                if (modal) modal.hide();
                window.location.reload(); // Tải lại trang để cập nhật dữ liệu
            } else {
                showMessageBox(result.message || 'Có lỗi xảy ra', 'danger');
            }
        } catch (error) {
            console.error('Lỗi:', error);
            showMessageBox('Có lỗi khi cập nhật đơn hàng', 'danger');
        } finally {
            isSubmitting = false;
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });

    // Làm cho currentProductPrice và currentProductStock có thể truy cập được cho fillEditForm
    editOrderForm.updateProductInfo = (price, stock) => {
        currentProductPrice = price;
        currentProductStock = stock;
        
        // Cập nhật thuộc tính max cho input số lượng trong form chỉnh sửa
        if (editQuantityInput) {
            let parsedStock = parseInt(stock);
            if (isNaN(parsedStock)) {
                parsedStock = 0;
            }

            if (parsedStock <= 0) {
                editQuantityInput.value = 0;
                editQuantityInput.max = 0;
                editQuantityInput.disabled = true;
                showMessageBox('Sản phẩm này hiện đã hết hàng.', 'warning');
            } else {
                editQuantityInput.disabled = false;
                editQuantityInput.max = parsedStock;
                if (parseInt(editQuantityInput.value) > parsedStock) {
                    editQuantityInput.value = parsedStock;
                }
                if (parseInt(editQuantityInput.value) < 0) {
                    editQuantityInput.value = 0;
                }
            }
        }
        updateEditTotal(); // Tính toán lại tổng tiền sau khi cập nhật thông tin sản phẩm
    };
}

// SỬA LỖI: Hàm chỉnh sửa đơn hàng - Tải dữ liệu đơn hàng đúng cách
async function editOrder(orderId) {
    try {
        // Show loading state
        const editModal = document.getElementById('editOrderModal');
        const modalBody = editModal.querySelector('.modal-body');
        const originalContent = modalBody.innerHTML; // Store original content to restore later
        
        modalBody.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div><p class="mt-2 text-muted">Đang tải thông tin đơn hàng...</p></div>';
        
        // Show modal first
        const modal = new bootstrap.Modal(editModal);
        modal.show();
        
        // Fetch order data from the new endpoint
        const response = await fetch(`/admin/orders/${orderId}/edit`);
        if (!response.ok) {
            throw new Error('Không thể lấy chi tiết đơn hàng');
        }
        
        const orderData = await response.json();
        
        // Restore original content of modal body
        modalBody.innerHTML = originalContent; 
        
        // Fill form with order data
        fillEditForm(orderData);

        // Update product price and stock in initializeEditOrderForm's scope
        const editForm = document.getElementById('editOrderForm');
        if (editForm && editForm.updateProductInfo) {
            editForm.updateProductInfo(orderData.product.price, orderData.product.stock);
        }
        
    } catch (error) {
        console.error('Lỗi:', error);
        showMessageBox('Có lỗi khi tải thông tin đơn hàng: ' + error.message, 'danger');
        
        // Close modal on error
        const modal = bootstrap.Modal.getInstance(document.getElementById('editOrderModal'));
        if (modal) modal.hide();
    }
}

// Hàm trợ giúp để điền form chỉnh sửa
function fillEditForm(orderData) {
    const form = document.getElementById('editOrderForm');
    if (!form || !orderData) return;
    
    // Điền thông tin đơn hàng cơ bản
    const orderIdInput = form.querySelector('input[name="orderId"]');
    if (orderIdInput) orderIdInput.value = orderData._id;
    
    const quantityInput = form.querySelector('input[name="quantity"]');
    if (quantityInput) {
        quantityInput.value = orderData.quantity;
        // Thuộc tính max cho input số lượng được xử lý bởi updateProductInfo
    }
    
    const shippingFeeInput = form.querySelector('input[name="shippingFee"]');
    if (shippingFeeInput) shippingFeeInput.value = orderData.shippingFee || 0;
    
    // Điền địa chỉ giao hàng
    if (orderData.shippingAddress) {
        const fullNameInput = form.querySelector('input[name="shippingAddress.fullName"]');
        if (fullNameInput) fullNameInput.value = orderData.shippingAddress.fullName || '';
        
        const phoneInput = form.querySelector('input[name="shippingAddress.phoneNumber"]');
        if (phoneInput) phoneInput.value = orderData.shippingAddress.phoneNumber || '';
        
        const addressInput = form.querySelector('input[name="shippingAddress.address"]');
        if (addressInput) addressInput.value = orderData.shippingAddress.address || '';
        
        const wardInput = form.querySelector('input[name="shippingAddress.ward"]');
        if (wardInput) wardInput.value = orderData.shippingAddress.ward || '';
        
        const districtInput = form.querySelector('input[name="shippingAddress.district"]');
        if (districtInput) districtInput.value = orderData.shippingAddress.district || '';
        
        const cityInput = form.querySelector('input[name="shippingAddress.city"]');
        if (cityInput) cityInput.value = orderData.shippingAddress.city || '';
    }
    
    // Điền ghi chú
    const notesInput = form.querySelector('textarea[name="notes"]');
    if (notesInput) notesInput.value = orderData.notes || '';

    // Kích hoạt thủ công các sự kiện input để cập nhật tổng tiền và thông tin tồn kho nếu cần
    // Điều này quan trọng nếu các giá trị ban đầu được đặt theo chương trình
    const event = new Event('input', { bubbles: true });
    if (quantityInput) quantityInput.dispatchEvent(event);
    if (shippingFeeInput) shippingFeeInput.dispatchEvent(event);
}

// Hàm xóa đơn hàng (đổi tên từ deleteOrder để tránh xung đột với helper EJS)
async function confirmDeleteOrder(orderId) {
    // Sử dụng hộp thông báo tùy chỉnh thay vì confirm
    showConfirmBox('Bạn có chắc chắn muốn xóa đơn hàng này?', async () => {
        try {
            const response = await fetch(`/admin/orders/${orderId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showMessageBox('Xóa đơn hàng thành công!', 'success');
                window.location.reload();
            } else {
                const result = await response.json();
                showMessageBox(result.message || 'Có lỗi xảy ra', 'danger');
            }
        } catch (error) {
            console.error('Lỗi:', error);
            showMessageBox('Có lỗi khi xóa đơn hàng', 'danger');
        }
    });
}

// Hàm cập nhật trạng thái đơn hàng
async function updateOrderStatus(orderId, action) {
    const confirmMsg = action === 'cancel' 
        ? 'Bạn có chắc chắn muốn hủy đơn hàng này?' 
        : 'Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng?';
        
    showConfirmBox(confirmMsg, async () => {
        try {
            const response = await fetch(`/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action })
            });

            const result = await response.json();
            if (response.ok) {
                showMessageBox('Cập nhật trạng thái thành công!', 'success');
                window.location.reload(); // Tải lại trang để cập nhật dữ liệu
            } else {
                showMessageBox(result.message || 'Có lỗi xảy ra', 'danger');
            }
        } catch (error) {
            console.error('Lỗi:', error);
            showMessageBox('Có lỗi khi cập nhật trạng thái', 'danger');
        }
    });
}

// Hàm cập nhật trạng thái thanh toán (nếu backend hỗ trợ)
async function updatePaymentStatus(orderId, status) {
    // Thêm xác nhận cho việc cập nhật trạng thái thanh toán
    showConfirmBox(`Bạn có chắc chắn muốn cập nhật trạng thái thanh toán thành "${status}"?`, async () => {
        try {
            const response = await fetch(`/admin/orders/${orderId}/payment`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                showMessageBox('Cập nhật trạng thái thanh toán thành công!', 'success');
                window.location.reload(); // Tải lại trang để cập nhật dữ liệu
            } else {
                const result = await response.json();
                showMessageBox(result.message || 'Có lỗi xảy ra', 'danger');
            }
        } catch (error) {
            console.error('Lỗi:', error);
            showMessageBox('Có lỗi xảy ra khi cập nhật trạng thái thanh toán', 'danger');
        }
    });
}

// Các hàm hộp thông báo tùy chỉnh (thay thế alert/confirm)
function showMessageBox(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        console.error('Không tìm thấy container alert!');
        return;
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertContainer.appendChild(alertDiv);

    // Tự động xóa sau 5 giây
    setTimeout(() => {
        bootstrap.Alert.getInstance(alertDiv)?.close();
    }, 5000);
}

function showConfirmBox(message, onConfirm) {
    const confirmModalElement = document.getElementById('confirmModal');
    if (!confirmModalElement) {
        console.error('Không tìm thấy modal xác nhận!');
        return;
    }

    const confirmModal = new bootstrap.Modal(confirmModalElement);
    const confirmModalBody = confirmModalElement.querySelector('.modal-body');
    const confirmButton = confirmModalElement.querySelector('#confirmButton');

    confirmModalBody.textContent = message;
    confirmButton.onclick = () => {
        onConfirm();
        confirmModal.hide();
    };

    confirmModal.show();
}

// Expose các hàm ra toàn cục để EJS có thể gọi
window.editOrder = editOrder;
window.confirmDeleteOrder = confirmDeleteOrder; // Đã đổi tên
window.updateOrderStatus = updateOrderStatus;
window.updatePaymentStatus = updatePaymentStatus;