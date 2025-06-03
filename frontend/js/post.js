 // Xử lý upload ảnh
        document.getElementById('uploadArea').addEventListener('click', function() {
            document.getElementById('productImages').click();
        });

        document.getElementById('productImages').addEventListener('change', function(e) {
            const previewContainer = document.getElementById('imagePreviewContainer');
            previewContainer.innerHTML = '';
            
            const files = e.target.files;
            if (files.length > 10) {
                alert('Bạn chỉ có thể tải lên tối đa 10 ảnh!');
                return;
            }
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.match('image.*')) continue;
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewDiv = document.createElement('div');
                    previewDiv.className = 'image-preview';
                    
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    
                    const removeBtn = document.createElement('span');
                    removeBtn.className = 'remove-image';
                    removeBtn.innerHTML = '&times;';
                    removeBtn.addEventListener('click', function() {
                        previewDiv.remove();
                    });
                    
                    previewDiv.appendChild(img);
                    previewDiv.appendChild(removeBtn);
                    previewContainer.appendChild(previewDiv);
                }
                reader.readAsDataURL(file);
            }
        });

        //  kéo thả ảnh
        const uploadArea = document.getElementById('uploadArea');
        
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            document.getElementById('productImages').files = files;
            
            // Kích hoạt sự kiện change
            const event = new Event('change');
            document.getElementById('productImages').dispatchEvent(event);
        });

        // Xử lý submit form
        document.getElementById('productPostForm').addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Tin đăng của bạn đã được gửi thành công! Chúng tôi sẽ kiểm duyệt và đăng tải trong thời gian sớm nhất.');
            //  xử lý submit form thực tế ở đây
        });