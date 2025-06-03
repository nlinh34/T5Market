document.addEventListener('DOMContentLoaded', function() {
    // Payment method switching
    const paymentMethods = document.querySelectorAll('.method-option');
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            // Remove active class from all methods
            paymentMethods.forEach(m => m.classList.remove('active'));
            
            // Add active class to clicked method
            this.classList.add('active');
            
            // Show appropriate payment info (in this case only bank info is shown)
            const methodId = this.querySelector('input').id;
            console.log('Selected payment method:', methodId);
        });
    });

    // Confirm payment button
    const confirmButton = document.querySelector('.btn-confirm-payment');
    if (confirmButton) {
        confirmButton.addEventListener('click', function(e) {
            const termsChecked = document.getElementById('agree-terms').checked;
            
            if (!termsChecked) {
                e.preventDefault();
                alert('Vui lòng đồng ý với điều khoản dịch vụ trước khi thanh toán');
            } else {
                // Here you would typically submit the payment form
                console.log('Payment confirmed');
                // Redirect to success page or show success message
                alert('Thanh toán thành công! Tin đăng của bạn sẽ được xử lý trong thời gian sớm nhất.');
                window.location.href = 'manage-posts.html';
            }
        });
    }
});