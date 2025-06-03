document.addEventListener('DOMContentLoaded', function() {
    // Service selection functionality
    const serviceButtons = document.querySelectorAll('.btn-select');
    serviceButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove selected class from all buttons
            serviceButtons.forEach(btn => {
                btn.textContent = '+ chọn';
                btn.closest('.option-card').classList.remove('selected');
            });
            
            // Add selected class to clicked button
            this.textContent = '✓ Đã chọn';
            this.closest('.option-card').classList.add('selected');
            
            // Store selected service (could be used for payment page)
            const service = this.dataset.service;
            console.log('Selected service:', service);
        });
    });

    // Payment button functionality
    const paymentButton = document.querySelector('.btn-payment');
    if (paymentButton) {
        paymentButton.addEventListener('click', function(e) {
            const selectedService = document.querySelector('.option-card.selected');
            
            if (!selectedService) {
                e.preventDefault();
                alert('Vui lòng chọn dịch vụ trước khi thanh toán');
            }
        });
    }
});