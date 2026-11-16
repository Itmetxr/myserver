# Drone Monitoring Dashboard 
จัดทำโดย: ณัฐธิดา กาญจนาลิขิต 67010305

แดชบอร์ดสำหรับดูการตั้งค่าโดรน บันทึกอุณหภูมิ และตรวจสอบประวัติการบันทึก ขับเคลื่อนด้วย Express และ deploy บน Vercel

Dashboard for viewing drone configuration, submitting temperature logs, and reviewing log history. Built with Express and deployed on Vercel.

**Live site / เว็บไซต์:** https://myserver-drone-monitoring.vercel.app/  
**GitHub:** https://github.com/Itmetxr/myserver

---

## ภาษาไทย

### ความสามารถ

- แสดงข้อมูล Drone ID, ชื่อโดรน, สถานะไฟ และประเทศ
- ส่งค่าบันทึกอุณหภูมิของโดรน
- ดูประวัติ Temperature Logs พร้อมแบ่งหน้า
- ใช้ Express เป็น backend และหน้าเว็บแบบ static ในโฟลเดอร์ `public/`
- เชื่อมต่อ Drone Config Server และ Drone Log Server ผ่าน environment variables

### หน้าเว็บ

| URL | รายละเอียด |
| --- | --- |
| `/` | หน้า Dashboard รวมแท็บ View Config, Log Form และ View Logs |
| `/config` | ดูการตั้งค่าโดรน |
| `/form` | กรอกและส่งค่าอุณหภูมิ |
| `/logs` | ดูรายการบันทึกอุณหภูมิ |

### ติดตั้งและรันในเครื่อง

ต้องติดตั้ง Node.js 20 ขึ้นไป

```bash
git clone https://github.com/Itmetxr/myserver.git
cd myserver
npm install
```

คัดลอกไฟล์ตัวอย่างเป็น `.env` แล้วกรอกค่าจริง:

```bash
cp .env.example .env
```

บน Windows PowerShell ใช้:

```powershell
Copy-Item .env.example .env
```

ตั้งค่าตัวแปรใน `.env`:

| ตัวแปร | ความหมาย |
| --- | --- |
| `DRONE_ID` | ID จำนวนเต็มบวกของโดรนที่จะแสดง |
| `CONFIG_API` | URL ของ Drone Config Server |
| `LOG_API` | URL ของ PocketBase Drone Log collection |
| `LOG_API_TOKEN` | Bearer token สำหรับอ่านและสร้าง log |
| `PORT` | พอร์ตสำหรับรันในเครื่อง (ไม่บังคับ; ค่าเริ่มต้น `8000`) |

เริ่มเซิร์ฟเวอร์:

```bash
npm run dev
```

เปิด [http://localhost:8000](http://localhost:8000)

อย่า commit ไฟล์ `.env` หรือ token จริงลง GitHub

### Deploy บน Vercel

1. เชื่อม GitHub repository นี้กับ Vercel โดยใช้ Framework Preset เป็น Express และ project root เป็นโฟลเดอร์ที่มี `server.js`
2. เพิ่ม `DRONE_ID`, `CONFIG_API`, `LOG_API` และ `LOG_API_TOKEN` ใน Project Settings → Environment Variables สำหรับ Production
3. Push ไปที่ branch `main`; Vercel จะ build และ deploy อัตโนมัติ

ไฟล์ `vercel.json` กำหนด framework เป็น Express ไว้แล้ว ไฟล์หน้าเว็บอยู่ใน `public/` ส่วน environment variables ต้องตั้งแยกใน Vercel และห้ามใส่ค่า token จริงใน repository

### API

- `GET /api/setup` — คืนค่า Drone ID ที่ตั้งไว้
- `GET /configs/:droneId` — คืนค่า `drone_id`, `drone_name`, `light`, `country` และ `weight`
- `GET /status/:droneId` — คืนค่า `condition`
- `GET /logs/:droneId?page=1` — คืน log ล่าสุดไม่เกิน 12 รายการต่อหน้า พร้อมฟิลด์ `drone_id`, `drone_name`, `created`, `country` และ `celsius`
- `POST /logs` — สร้าง log จาก JSON body ที่มี `drone_id`, `drone_name`, `country` และ `celsius`

ตัวอย่าง body สำหรับ `POST /logs`:

```json
{
  "drone_id": 3001,
  "drone_name": "Dot Dot",
  "country": "India",
  "celsius": 45
}
```

---

## English

### Features

- Displays drone ID, name, light status, and country
- Submits temperature readings for a drone
- Shows temperature log history with pagination
- Uses Express for the backend and serves static frontend files from `public/`
- Connects to the Drone Config Server and Drone Log Server through environment variables

### Pages

| URL | Description |
| --- | --- |
| `/` | Dashboard with View Config, Log Form, and View Logs tabs |
| `/config` | View drone configuration |
| `/form` | Enter and submit a temperature reading |
| `/logs` | Browse temperature log records |

### Install and run locally

Install Node.js 20 or newer.

```bash
git clone https://github.com/Itmetxr/myserver.git
cd myserver
npm install
```

Copy the example environment file to `.env` and add your own values:

```bash
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Set these variables in `.env`:

| Variable | Description |
| --- | --- |
| `DRONE_ID` | Positive integer ID of the drone to display |
| `CONFIG_API` | Drone Config Server URL |
| `LOG_API` | PocketBase Drone Log collection URL |
| `LOG_API_TOKEN` | Bearer token used to read and create logs |
| `PORT` | Local server port (optional; defaults to `8000`) |

Start the development server:

```bash
npm run dev
```

Open [http://localhost:8000](http://localhost:8000)

Do not commit `.env` or real API tokens to GitHub.

### Deploy to Vercel

1. Connect this GitHub repository to Vercel. Use the Express framework preset and the project root containing `server.js`.
2. Add `DRONE_ID`, `CONFIG_API`, `LOG_API`, and `LOG_API_TOKEN` under Project Settings → Environment Variables for Production.
3. Push to the `main` branch; Vercel builds and deploys automatically.

The `vercel.json` file already selects the Express framework. Frontend files are in `public/`. Environment variables must be configured separately in Vercel; do not store real tokens in the repository.

### API

- `GET /api/setup` — returns the configured drone ID
- `GET /configs/:droneId` — returns `drone_id`, `drone_name`, `light`, `country`, and `weight`
- `GET /status/:droneId` — returns `condition`
- `GET /logs/:droneId?page=1` — returns up to 12 newest records per page with `drone_id`, `drone_name`, `created`, `country`, and `celsius`
- `POST /logs` — creates a log using a JSON body containing `drone_id`, `drone_name`, `country`, and `celsius`

Example `POST /logs` body:

```json
{
  "drone_id": 3001,
  "drone_name": "Dot Dot",
  "country": "India",
  "celsius": 45
}
```
