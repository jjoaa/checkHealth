document.addEventListener('DOMContentLoaded', () => {
  const isEmbedded = window.top !== window.self;
  const isInViewer = document.referrer.includes("viewer.html");

  if (!isEmbedded || !isInViewer) {
    const headerContainer = document.createElement('div');
    document.body.prepend(headerContainer);

    fetch('../components/header.html')
      .then(res => res.text())
      .then(html => {
        headerContainer.innerHTML = html;
      })
      .catch(err => {
        console.error('헤더를 불러오는 중 오류 발생:', err);
      });
  }
});
