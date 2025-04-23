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
            pdf.getPage(1).then(function (page) {
              const viewport = page.getViewport({ scale: 1.5 });
              pdfCanvas.height = viewport.height;
              pdfCanvas.width = viewport.width;

              const renderContext = {
                canvasContext: pdfCtx,
                viewport: viewport
              };
              page.render(renderContext);
              pdfViewer.style.display = 'block';
            });
          });
        };
        reader.readAsArrayBuffer(file);
      } else {
        alert("JPG 이미지나 PDF 파일만 업로드할 수 있습니다.");
      }
    });
