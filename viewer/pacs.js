//DICOM(PACS) 뷰어
window.onload = function () {
    const element = document.getElementById('dicomImage');
    const fileInput = document.getElementById('fileInput');
    let image = null;
    let toolMode = null; 
    let currentZoom = 1.0;

    //줌모드
    const modeStatusSpan = document.createElement('span');
    modeStatusSpan.textContent = '없음';
    const statusDiv = document.createElement('div');
    statusDiv.innerHTML = '🛠 현재 모드: ';
    statusDiv.appendChild(modeStatusSpan);
  
    document.body.appendChild(statusDiv);
  
    function updateModeStatus() {
      modeStatusSpan.textContent =
        toolMode === 'zoom' ? '확대' :
        toolMode === 'brightness' ? '밝기조절' :
        '없음';
    }
  
    // cornerstone과 연결
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
    cornerstone.enable(element);
  
   
    //기존 dciom 파일 로딩
    fileInput.addEventListener('change', function (e) {
      const files = Array.from(e.target.files);
      const thumbnailList = document.getElementById('thumbnailList');
      thumbnailList.innerHTML = '<h3>📂 미리보기</h3>';
    
      files.forEach((file, index) => {
        const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
    
        cornerstone.loadAndCacheImage(imageId).then(function (loadedImage) {
          const thumbWrapper = document.createElement('div');
          thumbWrapper.style.cssText = `
          border: 1px solid #888; padding: 5px; margin-bottom: 10px;
          cursor: pointer; background-color: #f0f0f0;
        `;
    
          const thumbCanvas = document.createElement('div');
          thumbCanvas.style.cssText = `
          width: 200px; height: 150px; display: inline-block;
        `;
          
      thumbWrapper.appendChild(thumbCanvas);
      thumbnailList.appendChild(thumbWrapper);
      cornerstone.enable(thumbCanvas);
      cornerstone.displayImage(thumbCanvas, loadedImage);

      const viewport = cornerstone.getDefaultViewportForImage(thumbCanvas, loadedImage);
      viewport.scale = 0.15;
      cornerstone.setViewport(thumbCanvas, viewport);
    
          thumbWrapper.addEventListener('click', () => {
            image = loadedImage;
            cornerstone.displayImage(element, image);
            const defaultViewport = cornerstone.getDefaultViewportForImage(element, image);
            cornerstone.setViewport(element, defaultViewport);
          });
    
          thumbWrapper.draggable = true;
          thumbWrapper.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('imageId', imageId);
          });
        }).catch(err => {
          console.error('DICOM 로딩 실패:', err);
        });
      });
    });
  }
//---------------------------------------------------------

// let element;
// let image = null;
// let toolMode = null;
// let currentZoom = 1.0;

// window.addEventListener("DOMContentLoaded", function () {
//   element = document.getElementById('dicomImage');
//   const fileInput = document.getElementById('fileInput');

//   if (!element || !fileInput) {
//     console.error("필요한 요소(dicomImage 또는 fileInput)를 찾을 수 없습니다.");
//     return;
//   }

//   // cornerstone 로더 등록 (중요!)
//   cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
//   cornerstone.registerImageLoader('dicomfile', cornerstoneWADOImageLoader.wadouri.loadImage);

//   // ✅ 여기서부터 모든 이벤트 리스너 등록
//   fileInput.addEventListener('change', async function (e) {
//     const files = Array.from(e.target.files);
//     const thumbnailList = document.getElementById('thumbnailList');
//     thumbnailList.innerHTML = '<h3>📂 미리보기</h3>';

//     for (const file of files) {
//        await window.uploadToAzure(file); // 📤 Azure 업로드

//       const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
//       console.log("📦 imageId:", imageId); // ✅ 디버깅
      
//       cornerstone.loadAndCacheImage(imageId).then(function (loadedImage) {
//           const thumbWrapper = document.createElement('div');
//         const thumbCanvas = document.createElement('div');

//         thumbWrapper.style.cssText = `
//           border: 1px solid #888; padding: 5px; margin-bottom: 10px;
//           cursor: pointer; background-color: #f0f0f0;
//         `;
//         thumbCanvas.style.cssText = `width: 200px; height: 150px; display: inline-block;`;

//         thumbWrapper.appendChild(thumbCanvas);
//         thumbnailList.appendChild(thumbWrapper);

//         cornerstone.enable(thumbCanvas);
//         cornerstone.displayImage(thumbCanvas, loadedImage).then(() => {
//           const viewport = cornerstone.getDefaultViewportForImage(thumbCanvas, loadedImage);
//           viewport.scale = 0.15;
//           cornerstone.setViewport(thumbCanvas, viewport);
//         });

//         thumbWrapper.addEventListener('click', () => {
//           image = loadedImage;
//           cornerstone.displayImage(element, image);
//           const defaultViewport = cornerstone.getDefaultViewportForImage(element, image);
//           cornerstone.setViewport(element, defaultViewport);
//         });

//         thumbWrapper.draggable = true;
//         thumbWrapper.addEventListener('dragstart', (event) => {
//           event.dataTransfer.setData('imageId', imageId);
//         });
//       }).catch(err => {
//         console.error('❌ cornerstone 로딩 실패:', err);
//       });
//     }
//   });

//---------------------
    
  // 메인 뷰어 드래그 앤 드롭
  element.addEventListener('dragover', e => e.preventDefault());
  element.addEventListener('drop', function (e) {
    e.preventDefault();
     const imageId = e.dataTransfer.getData('imageId');
  console.log("🎯 Dropped imageId:", imageId); // 로그로 확인

  cornerstone.loadAndCacheImage(imageId).then(function (loadedImage) {
    image = loadedImage;
    cornerstone.displayImage(element, image);
    const defaultViewport = cornerstone.getDefaultViewportForImage(element, image);
    cornerstone.setViewport(element, defaultViewport);
  }).catch(err => {
    console.error('메인 뷰어 이미지 로딩 실패:', err);
  });
});
    
   // 툴 버튼
   document.getElementById('zoomToolBtn').addEventListener('click', () => {
    toolMode = toolMode === 'zoom' ? null : 'zoom';
    alert('확대/축소 모드입니다. 마우스 휠을 사용하세요.');
    updateModeStatus();
  });

  document.getElementById('wlToolBtn').addEventListener('click', () => {
    toolMode = toolMode === 'brightness' ? null : 'brightness';
    alert('밝기 조절 모드입니다. 마우스 휠을 사용하세요.');
    updateModeStatus();
  });

//초기화버튼
  document.getElementById('resetBtn').addEventListener('click', () => {
    toolMode = null;
    updateModeStatus();
    element.style.cursor = 'default';
    if (image) {
      cornerstone.displayImage(element, image);
      const defaultViewport = cornerstone.getDefaultViewportForImage(element, image);
      defaultViewport.scale = 1.0;
      defaultViewport.translation = { x: 0, y: 0 };
      cornerstone.setViewport(element, defaultViewport);
    }
  });

    // 마우스 휠 확대/밝기 조절
  element.addEventListener('wheel', function (e) {
    if (!image || !toolMode) return;

    const viewport = cornerstone.getViewport(element);

    if (toolMode === 'brightness') {
      if (e.shiftKey) {
        viewport.voi.windowWidth += e.deltaY > 0 ? 10 : -10;
      } else {
        viewport.voi.windowCenter += e.deltaY > 0 ? 10 : -10;
      }
      cornerstone.setViewport(element, viewport);
      e.preventDefault();

    } else if (toolMode === 'zoom') {
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      let newZoom = viewport.scale * zoomFactor;
      newZoom = Math.max(0.2, Math.min(5.0, newZoom));
  
      const rect = element.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
  
      const centerX = element.clientWidth / 2 + viewport.translation.x;
      const centerY = element.clientHeight / 2 + viewport.translation.y;
  
      const dx = clickX - centerX;
      const dy = clickY - centerY;
  
      const scaleFactor = newZoom / viewport.scale;
      const newTranslate = {
        x: viewport.translation.x - dx * (scaleFactor - 1),
        y: viewport.translation.y - dy * (scaleFactor - 1)
      };
  
      cornerstone.setViewport(element, {
        ...viewport,
        scale: newZoom,
        translation: newTranslate
      });

      currentZoom = newZoom;
      e.preventDefault();
    }
  });
 // 드래그 이동 (줌 모드일 때만)
 let isPanning = false;
 let lastX = 0;
 let lastY = 0;

 element.addEventListener('mousedown', function (e) {
  if (!image || e.button !== 0) return;

  const viewport = cornerstone.getViewport(element);
    if (viewport.scale > 1.0) {
      isPanning = true;
      lastX = e.clientX;
      lastY = e.clientY;
      element.style.cursor = 'grabbing';
    }
  });

 element.addEventListener('mousemove', function (e) {
   if (!isPanning) return;
   const deltaX = e.clientX - lastX;
   const deltaY = e.clientY - lastY;
   lastX = e.clientX;
   lastY = e.clientY;

   const viewport = cornerstone.getViewport(element);
   viewport.translation.x += deltaX;
   viewport.translation.y += deltaY;
   cornerstone.setViewport(element, viewport);
 });

 element.addEventListener('mouseup', () => {
  isPanning = false;
  element.style.cursor = 'default';
});

element.addEventListener('mouseleave', () => {
  isPanning = false;
  element.style.cursor = 'default';
});

      
