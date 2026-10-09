# 홈페이지 글 관리 안내 (COMING NEXT · LOG · INFO)

관리 화면: https://app.pagescms.org/ → m1nch0wh4ck / h3ll0w0lrd → 브랜치 main

왼쪽 메뉴

| 메뉴 | 홈페이지 위치 |
|---|---|
| 작품 수집첩 | COLLECTION (기존과 같음) |
| COMING NEXT · 제작 예정 | HOME 아래 COMING NEXT 줄 |
| LOG · 제작 기록 | LOG(제작 노트) 화면 카드 |
| INFO · 제작자 정보 | INFO 화면 민트 소개 상자 + read_me.txt |

## 저장하면 어떻게 되나요

1. 양식에서 Save(저장)를 누르면 GitHub 저장소 main에 바로 기록됩니다.
2. GitHub가 홈페이지를 다시 만듭니다(보통 1~3분).
   진행 상황: https://github.com/m1nch0wh4ck/h3ll0w0lrd/actions — 맨 위 pages build and deployment가 초록 체크가 되면 끝.
3. 홈페이지를 새로고침합니다. 안 바뀌어 보이면 1~2분 뒤 다시 새로고침합니다.

## COMING NEXT · 제작 예정

- 새 항목: Add an entry(추가) → 제목 입력 → 저장.
- 순서: '노출 순서'에 1, 2, 3… 작은 숫자가 왼쪽(먼저). 같은 숫자면 제목 가나다순.
- 숨기기: '홈페이지에 표시' 체크를 끄고 저장. 다시 켜면 다시 보입니다.
- 지우기: 항목을 열어 Delete(삭제).
- 연결 주소: 비우면 글자만 나옵니다. `#notes`(LOG), `#collection`, `#about`, `#work/작품주소용이름`, 또는 `https://`로 시작하는 주소만 링크가 됩니다.
- 표시할 항목이 하나도 없으면 COMING NEXT 줄 자체가 사라집니다.

## LOG · 제작 기록

- 새 기록: 추가 → 날짜 선택 → 제목 → 분류 → 본문 → 저장.
- 본문은 평소처럼 씁니다. 줄을 바꾸면 줄바꿈, 한 줄을 비우면 문단이 나뉩니다.
- 순서: 날짜가 최근인 기록이 앞. 날짜를 비운 예전 기록은 맨 뒤.
- '카드 꼬리표'를 쓰면 카드 위 민트색 표시에 분류 대신 그 말이 나옵니다(예: 리뉴얼 예정).
- 같은 날 여러 개를 써도 됩니다.

## INFO · 제작자 정보

- 소개 문구: 줄을 바꾼 자리에서 홈페이지도 줄이 바뀝니다.
- read_me.txt 안내 문단: 엔터로 문단을 나누고, 강조할 글자를 드래그해 굵게(B)를 누릅니다.
- 빈칸으로 두면 해당 줄은 홈페이지에서 빠집니다.

## 주의

- '홈페이지에 표시'를 꺼도 공개 저장소 파일에는 글이 남아 있습니다. 비밀 내용이나 비공개 초안은 적지 마세요.
- HOME 맨 위 큰 문구(목마른 놈이 / 스스로 우물 판 곳.)와 이름·핸들은 이번 양식 대상이 아닙니다. INFO 소개 문구만 바뀝니다.

## 문제가 생겼을 때 되돌리기

1. https://github.com/m1nch0wh4ck/h3ll0w0lrd/commits/main 에서 문제 직전 저장(… via Pages CMS)을 찾습니다.
2. 가장 쉬운 방법: CMS에서 해당 항목을 열어 이전 내용으로 다시 고쳐 저장합니다.
3. 파일째 되돌리려면 그 커밋의 파일을 열어 내용을 확인한 뒤, CMS에서 같은 내용으로 저장하거나 Claude Code에 "이 커밋 이전으로 OO 파일 되돌려 줘"라고 요청합니다.

---

## 데이터 위치와 형식 (후속 작업·다른 편집기용)

| 내용 | 파일 | 형식 |
|---|---|---|
| COMING NEXT | `_data/upcoming/<id>.json` | 항목당 1파일 |
| LOG | `_data/logs/<id>.json` | 기록당 1파일 |
| INFO | `_data/info.json` | 단일 파일 |
| 공개 출력 | `data/site.json` | Jekyll이 위 세 가지를 `{"upcoming":{…},"logs":{…},"info":{…}}`로 합침. 폴더가 비면 `null` |

`id`는 CMS가 자동으로 만드는 UUID이며 파일 이름과 같습니다. 바꾸지 않습니다.

COMING NEXT 필드: `id`, `title`(필수), `summary`, `status`(제작 예정/제작 중/리뉴얼 예정/잠시 보류), `order`(숫자), `visible`(true/false), `link`

LOG 필드: `id`, `date`(`YYYY-MM-DD` 문자열, 비어 있을 수 있음), `title`(필수), `category`(제작 소식/업데이트/공지/기타), `tag`, `body`(평문), `visible`

INFO 필드: `heading`, `intro`(평문, `\n` = 줄바꿈), `introNote`, `readme`(HTML. p/br/strong/b/em/i/u/s/a/ul/ol/li만 표시되고 나머지 태그는 제거)

공개 화면 규칙 (`assets/js/app.js` 맨 앞 블록)

- `visible`이 `false`일 때만 숨김. 값이 없으면 표시.
- `title`이 없는 항목은 표시하지 않음.
- COMING NEXT: `order` 오름차순(없으면 맨 뒤) → 제목 → id.
- LOG: `date` 내림차순, 날짜 없음/형식 오류는 뒤, 동률은 id 순. 날짜는 문자열 그대로 `2026.10.09`로 표시해 시간대 변환이 없음.
- 모든 글은 텍스트로 이스케이프. 링크는 내부 해시(`#home` `#collection` `#notes` `#about` `#work/<id>`)와 `https://`만 허용.
- CMS는 양식에 없는 키를 저장할 때 지웁니다. 다른 편집기에서 필드를 추가하려면 `.pages.yml`에도 같은 필드를 추가해야 합니다.
- CMS 날짜 필드는 기본값이 '오늘'이라, 날짜 없는 예전 기록에 날짜가 생기지 않도록 `default: ''`로 지정했습니다. 이 설정을 지우지 마세요.
