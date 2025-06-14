//PDF, JPG 뷰어
const fileInput = document.getElementById('fileInput');
    const imageViewer = document.getElementById('imageViewer');
    const imagePreview = document.getElementById('imagePreview');
    const pdfViewer = document.getElementById('pdfViewer');
    const pdfCanvas = document.getElementById('pdfCanvas');
    const pdfCtx = pdfCanvas.getContext('2d');

    fileInput.addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (!file) return;

      // 초기화
      imageViewer.style.display = 'none';
      pdfViewer.style.display = 'none';

      if (file.type.startsWith('image/')) {
        // JPG 이미지 처리
        const reader = new FileReader();
        reader.onload = function (event) {
          imagePreview.src = event.target.result;
          imageViewer.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        // PDF 처리
        const reader = new FileReader();
        reader.onload = function () {
          const typedarray = new Uint8Array(reader.result);
          pdfjsLib.getDocument(typedarray).promise.then(function (pdf) {
            const numPages = pdf.numPages;
      
            // 기존 내용 제거
            pdfViewer.innerHTML = '';
      
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
              pdf.getPage(pageNum).then(function (page) {
                const viewport = page.getViewport({ scale: 1.5 });
      
                // 새로운 canvas 생성
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
      
                const renderContext = {
                  canvasContext: context,
                  viewport: viewport
                };
      
                // 페이지 렌더링
                page.render(renderContext);
      
                // pdfViewer에 추가
                pdfViewer.appendChild(canvas);
              });
            }
      
            pdfViewer.style.display = 'block';
          });
        };
        reader.readAsArrayBuffer(file); 
      } else {
        alert("JPG 이미지나 PDF 파일만 업로드할 수 있습니다.");
      }
    });
