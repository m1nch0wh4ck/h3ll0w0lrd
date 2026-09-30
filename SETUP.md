# 민초파왹 홈페이지 설치 설명서

대상 저장소: https://github.com/m1nch0wh4ck/h3ll0w0lrd
게시 주소: https://m1nch0wh4ck.github.io/h3ll0w0lrd/

이 패키지는 main에 올리는 홈페이지입니다. tipshare 브랜치와 기존 Releases는 수정하지 않습니다.
GitHub 업로드와 최초 연동은 PC 브라우저에서 진행하는 것이 편합니다.

## 1. 파일 올리기

1. ZIP을 압축 해제합니다. ZIP 자체를 저장소에 올리지 않습니다.
2. 저장소의 Code 탭에서 브랜치가 main인지 확인합니다.
3. Add file → Upload files를 선택합니다.
4. 압축을 푼 폴더 안의 파일과 폴더를 모두 끌어 놓습니다. 바깥 폴더째 넣지 않습니다.
5. Commit changes로 저장합니다.

최상위에 index.html, _config.yml, .pages.yml, _data, assets, data가 보여야 합니다.
.pages.yml은 점으로 시작하여 컴퓨터에서 숨김 파일로 보일 수 있습니다. 누락되면 숨김 파일 표시를 켜거나,
GitHub의 Add file → Create new file에서 이름을 .pages.yml로 지정하고 패키지 파일 내용을 붙여넣어 저장합니다.
기존에 받은 10MB짜리 단일 index.html 대신 이 패키지의 작은 index.html을 사용합니다.

## 2. GitHub Pages 게시

설정 바로가기: https://github.com/m1nch0wh4ck/h3ll0w0lrd/settings/pages

1. Build and deployment → Source를 Deploy from a branch로 선택합니다.
2. Branch는 main, 폴더는 /(root)로 선택하고 Save를 누릅니다.
3. Actions 탭에서 Pages 배포 작업이 완료될 때까지 기다립니다.
4. 게시 주소를 열어 홈과 작품 수집첩을 확인합니다.

이 사이트는 GitHub Pages 기본 Jekyll 처리를 이용해 작품 파일을 모읍니다.
.nojekyll 파일을 추가하거나 Source를 GitHub Actions로 바꾸지 마세요.
PC에 Jekyll이나 개발 프로그램을 설치할 필요는 없습니다.
로컬 파일을 더블클릭하면 작품 데이터가 정상적으로 로드되지 않습니다. 게시 주소에서 확인합니다.

## 3. 작품 등록 화면 연결

관리 화면: https://app.pagescms.org/

1. Sign in with GitHub로 로그인합니다.
2. GitHub App 설치 화면에서 이 계정의 h3ll0w0lrd 저장소만 선택합니다.
3. 관리 화면에서 m1nch0wh4ck / h3ll0w0lrd 저장소를 엽니다.
4. 편집 대상 브랜치가 main인지 확인합니다.
5. 작품 수집첩에 네 작품이 보이는지 확인합니다.

설정 파일을 새로 만들라는 화면이 나오면 main 최상위에 .pages.yml이 올라갔는지 먼저 확인합니다.
웹사이트의 방문자는 작품을 볼 수만 있고, 등록·수정은 GitHub로 인증한 관리 화면에서 합니다.
Pages CMS는 GitHub Pages와 별도의 서비스이며, GitHub에 저장된 데이터를 양식으로 편집합니다.

## 4. 새 작품 등록

1. 작품 수집첩에서 새 항목을 만듭니다.
2. 주소용 이름을 영문 소문자·숫자·하이픈으로 입력합니다. 예: new-character.
   기존 작품과 중복되지 않게 하며 공개 후에는 바꾸지 않습니다.
3. 작품명, 수집첩 순서(05 등), 대표 이미지 또는 GIF, 한 줄 소개와 상세 소개를 입력합니다.
4. 장르, 1인/다인, 로맨스 분류와 취향 키워드를 입력합니다.
5. 플레이 플랫폼 / 버전을 추가합니다. 플랫폼, 상태, 세이프티 여부와 링크를 입력합니다.
6. 저장합니다. GitHub Pages 재배포가 끝나면 수집첩과 상세 화면에 자동으로 반영됩니다.

한 작품의 루모 세이프티·언세이프티는 플랫폼 항목을 각각 추가합니다.
버튼 이름은 각각 '루모 · 세이프티', '루모 · 언세이프티'로 입력하면 됩니다.
아직 링크가 없으면 URL은 비우고 '리뉴얼 예정'이나 '제작 중'을 선택합니다.
멜로이는 현재 받은 정보에 맞춰 세이프티로 입력되어 있습니다.
혜민의 루모 세이프티판은 출시 전이므로 현재 검색 결과에서 공개작으로 표시하지 않습니다.

프로필의 공개 소개·이미지만 등록합니다. 챗봇 비공개 프롬프트나 비밀 설정을 넣는 곳이 아닙니다.
등록 양식에 저장한 데이터는 Public 저장소에서 열람할 수 있습니다.
대표 이미지 업로드는 GIF를 지원합니다. CMS 업로드가 생성 메타데이터까지 제거해 주는 것은 아닙니다.
메인 이미지는 이번 패키지에 메타데이터를 제거한 파일이 포함되어 있습니다.

## 5. 첫 게시 확인

- 홈의 메인 이미지, 픽셀 제목과 메뉴가 표시되는지
- 수집첩에 네 작품이 보이고 상세 화면으로 이동하는지
- 유루리 유라유라 GIF가 재생되는지
- 멜로이 링크 4개와 백세린 루모 링크 2개가 맞는지
- 플랫폼 루모 + 세이프티 검색에 백세린이 나오는지
- 휴대폰에서 버튼과 소개를 읽을 수 있는지
- 기존 Releases 다운로드 링크가 계속 동작하는지

현재 준비 단계에서 원격 저장소 업로드, 실제 Pages 배포, Pages CMS 계정 인증은 수행하지 않았습니다.
CMS 설정은 공식 문서를 기준으로 작성했습니다. 최초 연결 후 실제 저장→재배포를 한 번 확인해야 합니다.
공식 안내: https://pagescms.org/docs/quick-start/
GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
