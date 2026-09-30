# 민초파왹 · m1nch0wh4ck

민트초코와 외계인을 테마로 한 제작자 홈페이지입니다.

설치는 [SETUP.md](SETUP.md)를 순서대로 따라 하세요.

- 홈페이지: https://m1nch0wh4ck.github.io/h3ll0w0lrd/
- 작품 관리: https://app.pagescms.org/
- 홈페이지 브랜치: main
- 기존 배포용 tipshare 브랜치와 Releases는 별도 유지

## 파일 구성

| 파일 / 폴더 | 역할 |
|---|---|
| index.html | 홈페이지 화면 |
| assets/css/style.css | 디자인 |
| assets/js/app.js | 화면 이동·검색·작품 상세 |
| assets/images | 메인 이미지·작품 이미지·GIF |
| _data/works | 작품별 JSON 데이터 |
| data/works.json | Jekyll이 작품 목록을 합쳐 내보내는 파일 |
| .pages.yml | 작품 등록 양식 |
| _config.yml | GitHub Pages 설정 |

CMS에서 작품을 저장하면 JSON이 갱신되고, GitHub Pages 재배포 후 홈페이지에 반영됩니다.
별도 npm 설치나 LLM API는 필요하지 않습니다. 페르소나 뽑기는 아직 구현하지 않았습니다.
사이트 경로 /h3ll0w0lrd/를 바꾸면 CMS 이미지 경로와 기존 작품 이미지 경로도 함께 바꿔야 합니다.
