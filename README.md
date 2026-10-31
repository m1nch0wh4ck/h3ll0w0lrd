# 민초파왹 · m1nch0wh4ck

민트초코와 외계인을 테마로 한 제작자 홈페이지입니다.

설치는 [SETUP.md](SETUP.md)를 순서대로 따라 하세요.
COMING NEXT · LOG · INFO 글 관리는 [CMS-GUIDE.md](CMS-GUIDE.md)를 보세요.

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
| _data/upcoming | COMING NEXT 항목별 JSON |
| _data/logs | LOG 기록별 JSON |
| _data/info.json | INFO 소개 문구 |
| data/works.json | Jekyll이 작품 목록을 합쳐 내보내는 파일 |
| data/site.json | Jekyll이 COMING NEXT·LOG·INFO를 합쳐 내보내는 파일 |
| .pages.yml | 작품·COMING NEXT·LOG·INFO 관리 양식 |
| _config.yml | GitHub Pages 설정 |
| editor/ | 루모 스튜디오(제작자 코멘트·제작자 소개페이지 HTML 편집기, 설치형 웹앱). 홈페이지 data/works.json을 읽기만 함 |
| supabase/studio_state.sql | 루모 스튜디오 기기 간 동기화용 데이터베이스 설정(Supabase SQL Editor에서 한 번 실행) |

CMS에서 작품을 저장하면 JSON이 갱신되고, GitHub Pages 재배포 후 홈페이지에 반영됩니다.
별도 npm 설치나 LLM API는 필요하지 않습니다. 페르소나 뽑기는 아직 구현하지 않았습니다.
사이트 경로 /h3ll0w0lrd/를 바꾸면 CMS 이미지 경로와 기존 작품 이미지 경로도 함께 바꿔야 합니다.

## 루모 스튜디오 기기 간 동기화

PC와 모바일에서 같은 스튜디오 내용(코멘트·소개페이지)을 이어 쓰기 위한 선택 기능입니다. 작업은 항상 각 기기에 먼저 저장되고, Supabase는 기기 사이를 잇기만 합니다. 서버에 닿지 않으면(오프라인, 무료 프로젝트 일시 정지) 그 기기에만 저장하고 편집은 계속됩니다. JSON 백업도 그대로 쓸 수 있습니다.

처음 한 번:

1. Supabase 대시보드 → SQL Editor에 `supabase/studio_state.sql` 전체를 붙여넣고 Run. 여러 번 실행해도 안전합니다.
2. 접속 정보 넣기 — 둘 중 하나.
   - `editor/sync-config.js`에 Project URL과 Publishable(또는 anon) 키를 적어 올림. 공개되어도 되는 값입니다.
   - 비워 두고, 각 기기에서 상단 동기화 표시를 눌러 한 번 입력(그 기기에만 저장).
3. 각 기기에서 상단 동기화 표시 → Supabase 로그인 계정으로 로그인.

동작:

- 저장하고 몇 초 뒤, 앱을 다시 볼 때, 인터넷이 다시 연결될 때 서버와 맞춥니다.
- 한쪽만 바뀌었으면 자동으로 올리거나 받습니다. 두 기기 모두 바뀌었으면 자동으로 덮어쓰지 않고 '다른 기기 내용 가져오기 / 이 기기 내용 올리기 / 나중에'를 묻습니다.
- 가져오면 이 기기 내용은 기기 저장의 직전 사본으로, 올리면 서버의 이전 내용은 `studio_state.previous` 칸에 남습니다(대시보드 Table Editor에서 볼 수 있음).
- secret·service_role 키는 받지 않습니다. 데이터는 로그인한 본인만 읽고 쓸 수 있습니다(RLS).
- Supabase 무료 프로젝트는 일정 기간 사용이 적으면 일시 정지됩니다. 정지 중에도 편집은 되며, 대시보드에서 다시 켜면 이어서 동기화됩니다.

