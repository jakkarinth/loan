ALTER TABLE users
  ADD COLUMN birth_date DATE NULL AFTER phone,
  ADD COLUMN work_start_date DATE NULL AFTER birth_date;
