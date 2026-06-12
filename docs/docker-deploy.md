# Docker Deploy

## ใช้ MySQL ที่มีอยู่บน Host

ใช้ได้ โดยให้ backend container เชื่อมต่อ MySQL ผ่าน `host.docker.internal`

1. เตรียม env

```bash
cp docker.env.example .env
```

ตั้งค่าอย่างน้อย:

```env
DB_HOST=host.docker.internal
DB_PORT=3306
DB_USER=loan_user
DB_PASSWORD=your-password
DB_NAME=rmuti_surin_loan
NEXT_PUBLIC_API_BASE_URL=http://203.158.199.59:4000/api
API_INTERNAL_BASE_URL=http://backend:4000/api
NEXTAUTH_URL=http://203.158.199.59:3000
CLIENT_ORIGIN=http://203.158.199.59:3000
NEXTAUTH_SECRET=your-strong-secret
JWT_SECRET=your-strong-secret
```

2. MySQL บน host ต้องเปิดให้ container ต่อได้

- MySQL ต้อง bind ที่ network interface ที่ container เข้าถึงได้ เช่น `0.0.0.0` หรือ IP host
- user ต้องอนุญาต connection จาก container network เช่น `loan_user`@`%`
- firewall ต้องเปิด port `3306` เฉพาะเครือข่ายที่ไว้ใจได้

3. build และ run

```bash
docker compose build backend frontend
docker compose up -d backend frontend
```

## ตรวจสอบ

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

เปิดใช้งาน:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000/health`
