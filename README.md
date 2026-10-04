# 提醒一下（LINE 自動提醒）

這是 LINE 自動提醒網站的第一版骨架。現在已完成手機優先的提醒介面與 PostgreSQL CRUD API；建立、編輯與刪除的提醒會儲存在資料庫中。

## 已完成

- Next.js + TypeScript 專案架構
- 響應式提醒表單與提醒清單
- 建立、修改、刪除提醒的 REST API（`/api/reminders`）
- PostgreSQL / Prisma 的 `Reminder` 資料表與資料庫連線層
- 受 `CRON_SECRET` 保護的到期提醒排程端點（`POST /api/cron/process-reminders`）
- 已驗證簽名的 LINE webhook（`POST /api/line/webhook`），自動註冊 LINE 收件人
- LINE 與資料庫的環境變數範本

## 還沒接上的功能

- LINE Official Account webhook（收集 LINE User ID）
- 雲端排程服務設定（每分鐘呼叫排程端點）
- 雲端部署

## 在本機啟動

請先安裝 [Node.js LTS](https://nodejs.org/)，建議使用 v20 以上。接著在此資料夾執行：

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

然後開啟 `http://localhost:3000`。

## 下一階段建議

1. 執行 `npm run db:migrate` 建立資料表。
2. 建立 LINE Messaging API Channel，將 `LINE_CHANNEL_ACCESS_TOKEN` 與 `LINE_CHANNEL_SECRET` 填入環境變數；部署後，把 `https://你的網域/api/line/webhook` 設為 webhook URL。
3. 將官方帳號加為好友或傳一則訊息，系統就會註冊你的 LINE 收件人。
4. 設定雲端 scheduler 每分鐘以 `Authorization: Bearer <CRON_SECRET>` 呼叫 `POST /api/cron/process-reminders`。

> 不要將 `.env`、LINE Channel Secret 或 Access Token 提交到 Git。
