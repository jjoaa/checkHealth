# 🩺 checkHealth 
<br />  

## 1. 소개
> 국가건강검진 결과와 일반병원 검진 결과를 한눈에 볼 수 있도록 만든 사이트 입니다 \
> 또한 웨어러블 모니터도 할 수 있으며, 영상 검사 결과도 확인할 수 있습니다.  

<br />

**Live Demo (배포된 웹 사이트)**
[https://github.com/jjoaa/checkHealth](https://jjoaa.github.io/checkHealth/)

<br /> <br />
![Image](https://github.com/user-attachments/assets/df561aac-8d5c-456e-bde3-c9df9cfab227)
<br /> <br />

### 작업기간
2025/04, 1주
<br /><br />

### 인력구성
1인
<br /><br /><br />

## 2. 기술스택

<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=JavaScript&logoColor=black"> <img src="https://img.shields.io/badge/html5-E34F26?style=for-the-badge&logo=html5&logoColor=white">  <img src="https://img.shields.io/badge/css3-1572B6?style=for-the-badge&logo=css3&logoColor=white"><br /><br /> 

## 3. 기능
### 📂 Project Structure (폴더 구조)
```
checkHealth/
|
|ㅡ index.html         # 메인 페이지
|ㅡ index /      
|  |ㅡ calendar.js     # 캘린더 JS
|  |ㅡ wearable.js     # 웨어러블 JS
|  |ㅡ index.css
|ㅡ list /  결과 보기 + 그래프    
|  |ㅡ list.html       
|  |ㅡ list.js          # list 전체 흐름 정리
|  |ㅡ dataHandler.js   # 데이터 관리 JS
|  |ㅡ xmlLoader.js     # XML 데이터 JS
|  |ㅡ tableRenderer.js # 결과 테이블 JS
|  |ㅡ chart.js         # 그래프 JS
|ㅡ input /  검사 항목 입력     
|  |ㅡ input.html   
|  |ㅡ input.css
|ㅡ viewer /  뷰어 (PDF/JPG, PACS)     
|  |ㅡ viewer.html      # JPG / PDF html   
|  |ㅡ viewer.js        # JPG / PDF 보기  JS
|  |ㅡ pacs.html        # 영상보기 html
|  |ㅡ pacs.js          # 영상보기 JS
|  |ㅡ cornerstoneWADOImageLoader.js   # DICOM 라이브러리 
|  |ㅡ cornerstone.min.js              # DICOM 라이브러리
|  |ㅡ dicomParser.min.js              # DICOM 라이브러리    
├── components/
|  |ㅡ header.html        # 헤더 html   
|  |ㅡ inject-header.js   # 헤더 JS
└── README.md             # GitHub 설명 파일
```
<br /><br /><br />

## 4. 상세페이지 
- **결과 목록 보기 페이지**
  ![Image](https://github.com/user-attachments/assets/b22ab38c-0e13-47b2-935d-285f45fb1279)
<br />

- **검사 항목 입력 페이지**

| ![Image](https://github.com/user-attachments/assets/41bf29ba-620b-455c-bda0-070a6f31a110)  | ![Image](https://github.com/user-attachments/assets/38cd8e15-cd5f-46fe-a94d-7128251f5acf)   |
| ---------------------------------------- | ----------------------------------------- |
<br />

- **JPG / PDF 보기 페이지**

| ![Image](https://github.com/user-attachments/assets/f98a6979-3036-4e75-ae27-b018e6d03269)  | ![Image](https://github.com/user-attachments/assets/03118e26-19a8-463b-bdbe-ef02f55b336f)   |
| ---------------------------------------- | ----------------------------------------- |
<br />  

- **영상보기 페이지**

| ![Image](https://github.com/user-attachments/assets/1631b0eb-13f7-4f19-9223-549158dac287)  | ![Image](https://github.com/user-attachments/assets/14548f12-a5d7-491c-a828-dff8f62efe07)   |
| ---------------------------------------- | ----------------------------------------- |

<br /><br /> <br /> <br /> 


## 5. 아쉬웠던 부분
- PACS 뷰어 중 unpkg가 있는데 구현하는데 에러가 발생하여 jsDelivr 버전을 사용했고, CDN이 아니라 로컬로 작성하게됨
- xml과 사용자 입력 데이터를 결합하여 처리하는 과정을 해결하지 못함  
- 그래프에서 약간 느리게 반응함
<br /><br /> <br /> 

## 6. 앞으로 학습할 것들, 나아갈 방향
- 혈압 그래프 구현 (xml, 사용자 입력)
- PDF 여러페이지시 한장만 보임
<br /><br /> <br /> 
