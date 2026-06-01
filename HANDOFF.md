# Project Handoff — Universal RegTech OS

_Last updated: 2026-06-01_

---

## 黑客松資訊

| 項目 | 內容 |
|---|---|
| **主辦** | UKFinnovator × Cambridge Spark |
| **地點** | Imperial College London |
| **日期** | 13–14 June 2026（距今 12 天） |
| **題目** | "Reimagine financial regulation in an AI-driven world — designing solutions that help **regulators** balance innovation with consumer protection and market integrity." |
| **關鍵字** | RegTech Focus、監管者視角（不只是銀行）、AI-driven |

---

## GitHub Repo

**https://github.com/Ynot1996/AI_Synthetic_Sandbox**

| Branch | 內容 |
|---|---|
| `main` | 原始完整版（手動輸入參數 → 90天模擬） |
| `refactor/clean-template` | 拆分 component 的乾淨協作模板 |
| `feat/consumer-duty-copilot` | **最新版**：Consumer Duty 4 卡片 + Fix-It Advisor + 監管辯論 Terminal |

---

## 現有技術棧

**Frontend:** React 18 + Vite 5 + Tailwind CSS + Chart.js  
**Backend:** Python FastAPI + NumPy + Anthropic Claude Haiku (`claude-haiku-4-5-20251001`)  
**Run:**
```bash
cd frontend && npm install && npm run dev   # http://localhost:5173
cd backend && pip install -r requirements.txt && uvicorn main:app --reload  # http://localhost:8000
```

---

## 現有功能（feat/consumer-duty-copilot）

1. **手動輸入**：產品類型、APR、年齡層、脆弱族群比例
2. **90天統計模擬**：風險曲線 + 客訴累積曲線（雙軸 Chart.js）
3. **FCA Consumer Duty Scorecard**：4 個 outcome 卡片（PRIN 2A.2~2A.5），RAG 狀態（RED/AMBER/GREEN），分數圓環
4. **AI Fix-It Advisor**：Claude 生成 3 條改善建議，含 Before→After 狀態箭頭
5. **監管辯論 Terminal**：7 條對話（FCA Examiner / Compliance Officer / 3 位消費者）

---

## 新方向：Universal RegTech OS

### 核心 Pivot

> **從「銀行用的合規工具」→「FCA 等監管者的 AI 助理」**

**Pitch：** 「今天精算師上傳保單，它能測出脆弱族群的斷保風險；明天 FinTech 經理上傳 BNPL 條款，它能立刻模擬出年輕人的違約客訴風暴。一套架構，通吃所有金融創新場景。」

### 新架構（雙引擎）

```
[上傳 PDF / 輸入網址]
        ↓
【Stage 1：Static Audit（靜態合規審查）】
  - pdfplumber 解析上傳文件
  - Claude 對比 FCA Consumer Duty 知識（預載入 text，不需 FAISS）
  - 輸出：flagged_clauses + 條款修改草稿 + 提取的產品參數
        ↓ fail → 給修改建議（中斷）
        ↓ pass
【Stage 2：Dynamic Simulation（動態行為模擬）】
  - 使用 Stage 1 提取的參數（APR、年齡層等）
  - 複用現有 NumPy 統計模擬引擎
  - Consumer Duty 4 卡片 + Fix-It + 監管辯論
        ↓
【Export：PDF 合規審查報告】
  - ReportLab / FPDF2
  - 封面 + Stage 1 發現 + Stage 2 圖表 + FCA 引用
```

### 關鍵決策（已確認）

- ✅ **不需要 FAISS/向量資料庫** — FCA 知識庫 2-3 份 PDF，直接塞進 Claude context（200K tokens 夠用）
- ✅ **全新 UI**：日韓系高質感設計（glassmorphism，深黑底 `#08090a`，單一 accent 色）
- ✅ **三頁式流程**：Upload → Live Analysis（streaming log）→ Report
- ✅ **今天完成原型**，後續分工給組員打磨

### 新 UI 設計語言

- 背景：`#08090a`（純深黑，比 gray-950 更深）
- 卡片：glassmorphism（`backdrop-blur` + `bg-white/5` + `border-white/10`）
- Accent：冷藍 `#4f9cf9` 或翠綠 `#00d4aa`
- 字型：Geist / Inter，`font-light` 標題
- 進度：像 Vercel deploy log（一行一行 streaming）
- Consumer Duty 卡片升級為 glassmorphism

---

## 測試素材（待準備）

1. **壞保單 PDF**：故意充滿陷阱（隱藏費用、小字 APR、針對脆弱族群），確保 Stage 1 一定能抓到錯誤
2. **看起來好但有陷阱的保單 PDF**：格式乾淨但 APR 藏在注腳、BNPL「0% 利息」誤導性行銷，觸發 Stage 2 模擬

---

## 今天的 TODO

| 優先 | 項目 | 估時 |
|---|---|---|
| 🔴 P0 | 新 UI 骨架（Upload / Analysis / Report 三頁） | 2h |
| 🔴 P0 | Backend Stage 1：PDF 解析 + Claude 審查 → 結構化 JSON | 2h |
| 🔴 P0 | Stage 2 接上現有 simulation engine | 1h |
| 🟡 P1 | Streaming 進度顯示（Server-Sent Events 或 WebSocket） | 1h |
| 🟡 P1 | 準備兩份 Mock PDF | 1h |
| 🟢 P2 | PDF 報告匯出（ReportLab） | 2h |
| 🟢 P2 | UI 精細打磨（日韓質感細節） | 1h |

---

## 後端新 Endpoint 規劃

```python
POST /api/audit          # Stage 1：上傳 PDF → Claude 審查 → JSON
POST /api/simulate       # Stage 2：參數 → 統計模擬（現有，不動）
GET  /api/audit/stream   # Streaming 版 Stage 1（SSE）
POST /api/report         # 生成 PDF 報告
```

### Stage 1 輸出 JSON 格式

```json
{
  "audit_id": "abc12345",
  "product_type": "insurance",
  "pass": false,
  "flagged_clauses": [
    {
      "clause_text": "原文條款...",
      "issue": "APR 未以顯著方式揭露",
      "fca_rule": "PRIN 2A.4 Consumer Understanding",
      "severity": "HIGH",
      "suggested_revision": "建議修改為..."
    }
  ],
  "extracted_params": {
    "product_type": "insurance",
    "apr": 39.9,
    "target_age_group": "18-25",
    "vulnerable_population_ratio": 0.35
  },
  "summary": "發現 3 項違反 FCA Consumer Duty 的條款..."
}
```

---

## FCA 知識庫（預計內嵌）

直接以 Python string 形式存在 `backend/fca_knowledge.py`，包含：
- Consumer Duty PS22/9 核心條文摘要（PRIN 2A.2~2A.5）
- 保險產品相關 ICOBS 規則
- BNPL 相關 FCA 關注點（2025 Occasional Paper）
- High-Cost Short-Term Credit (HCSTC) 規則

無需真實 PDF 下載，直接 hardcode 摘要即可應付 hackathon demo。

---

## 組員分工建議

| 角色 | 負責 |
|---|---|
| **你（今天）** | 完整原型：後端 Stage 1+2 + 前端骨架 |
| **前端組員** | 日韓系 UI 打磨、動畫細節 |
| **後端組員** | PDF 報告匯出、Stage 1 prompt 優化 |
| **全組** | Mock PDF 準備、Demo 腳本排練 |

---

_開新 session 時直接參考這份文件繼續開發。_
