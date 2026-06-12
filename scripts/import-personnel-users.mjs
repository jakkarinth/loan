import fs from "node:fs";
import mysql from "../backend/node_modules/mysql2/promise.js";
import bcrypt from "../backend/node_modules/bcryptjs/index.js";
import dotenv from "../backend/node_modules/dotenv/lib/main.js";

dotenv.config({ path: ".env" });

const recordsPath = process.argv[2] ?? "/tmp/rmuti_personnel_records.json";
const records = JSON.parse(fs.readFileSync(recordsPath, "utf8"));
const passwordHash = bcrypt.hashSync("Password123!", 12);

const departments = [
  {
    code: "AGTECH",
    name_th: "คณะเกษตรศาสตร์และเทคโนโลยี",
    name_en: "Faculty of Agriculture and Technology"
  },
  {
    code: "MANAGEMENT",
    name_th: "คณะเทคโนโลยีการจัดการ",
    name_en: "Faculty of Management Technology"
  },
  {
    code: "ADMIN-OFFICE",
    name_th: "สำนักงานวิทยาเขตสุรินทร์",
    name_en: "Surin Campus Office"
  }
];

function departmentCode(name) {
  if (name.includes("เกษตรศาสตร์")) return "AGTECH";
  if (name.includes("เทคโนโลยีการจัดการ")) return "MANAGEMENT";
  return "ADMIN-OFFICE";
}

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  namedPlaceholders: true
});

await conn.beginTransaction();

try {
  const [[campus]] = await conn.query(
    "SELECT id FROM departments WHERE code = 'RMUTI-SURIN' LIMIT 1"
  );
  if (!campus) {
    throw new Error("Missing RMUTI-SURIN department. Run reference seed first.");
  }

  for (const dept of departments) {
    await conn.execute(
      `INSERT INTO departments (parent_id, code, name_th, name_en, is_active)
       VALUES (:parent_id, :code, :name_th, :name_en, 1)
       ON DUPLICATE KEY UPDATE
         parent_id = VALUES(parent_id),
         name_th = VALUES(name_th),
         name_en = VALUES(name_en),
         is_active = 1`,
      { parent_id: campus.id, ...dept }
    );
  }

  const [deptRows] = await conn.query("SELECT id, code FROM departments");
  const deptIds = Object.fromEntries(deptRows.map((row) => [row.code, row.id]));
  const [[borrowerRole]] = await conn.query(
    "SELECT id FROM roles WHERE code = 'borrower' LIMIT 1"
  );
  if (!borrowerRole) {
    throw new Error("Missing borrower role. Run reference seed first.");
  }

  let imported = 0;
  for (const record of records) {
    const deptCode = departmentCode(record.department_name_th || "");
    await conn.execute(
      `INSERT INTO users (
        department_id, employee_code, email, password_hash, title_th,
        first_name_th, last_name_th, position_th, status, email_verified_at
      ) VALUES (
        :department_id, :employee_code, :email, :password_hash, :title_th,
        :first_name_th, :last_name_th, :position_th, 'active', CURRENT_TIMESTAMP
      )
      ON DUPLICATE KEY UPDATE
        department_id = VALUES(department_id),
        password_hash = VALUES(password_hash),
        title_th = VALUES(title_th),
        first_name_th = VALUES(first_name_th),
        last_name_th = VALUES(last_name_th),
        position_th = VALUES(position_th),
        status = 'active'`,
      {
        department_id: deptIds[deptCode],
        employee_code: record.employee_code,
        email: record.email,
        password_hash: passwordHash,
        title_th: record.title_th,
        first_name_th: record.first_name_th,
        last_name_th: record.last_name_th,
        position_th: record.position_th
      }
    );

    const [[user]] = await conn.execute(
      "SELECT id FROM users WHERE email = :email LIMIT 1",
      { email: record.email }
    );
    await conn.execute(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES (:user_id, :role_id)
       ON DUPLICATE KEY UPDATE user_id = user_id`,
      { user_id: user.id, role_id: borrowerRole.id }
    );
    imported += 1;
  }

  await conn.commit();

  const [summary] = await conn.query(
    `SELECT d.code, d.name_th, COUNT(u.id) AS users
     FROM departments d
     LEFT JOIN users u
       ON u.department_id = d.id
      AND u.email LIKE 'personnel.%@example.local'
     WHERE d.code IN ('AGTECH', 'MANAGEMENT', 'ADMIN-OFFICE')
     GROUP BY d.id
     ORDER BY d.code`
  );
  const [[total]] = await conn.query(
    "SELECT COUNT(*) AS total FROM users WHERE email LIKE 'personnel.%@example.local'"
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        imported,
        totalPersonnelUsers: total.total,
        byDepartment: summary
      },
      null,
      2
    )
  );
} catch (error) {
  await conn.rollback();
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
