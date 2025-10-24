-- Schema and seed data for the "Duferco Employees" table.
-- Run this script in your Supabase project's SQL editor or via the CLI.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "Duferco Employees" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order integer NOT NULL UNIQUE,
  label text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

INSERT INTO "Duferco Employees" (sort_order, label)
VALUES
  (1, '1. Allan Davidovits'),
  (2, '2. Alvin Faett'),
  (3, '3. Andrea Castillo'),
  (4, '4. Andrea Guggiari'),
  (5, '5. Annel Ochoa'),
  (6, '6. Brian Archer'),
  (7, '7. Christian Voelcker'),
  (8, '8. Clay Coleman'),
  (9, '9. David Klacik'),
  (10, '10. David Munro'),
  (11, '11. Diana Gann'),
  (12, '12. Dirk Coetzee'),
  (13, '13. Egle Petrauskaite'),
  (14, '14. Elena Keizl'),
  (15, '15. Galina Wright'),
  (16, '16. Gavin Dove'),
  (17, '17. Gayle Cox'),
  (18, '18. George Suarez'),
  (19, '19. Heriverto Lopez'),
  (20, '20. Jennifer Molina'),
  (21, '21. Jerry King'),
  (22, '22. Jesus Martinez'),
  (23, '23. John Iovino'),
  (24, "24. John O'Brien"),
  (25, '25. Joseph Ossola'),
  (26, '26. Keith Demma'),
  (27, '27. Ken Kim'),
  (28, '28. Ken Zenkevich'),
  (29, '29. Kyle Kingsbury'),
  (30, '30. Lauren Gundlach'),
  (31, '31. Marcela Gomez'),
  (32, '32. Mario Raimondo'),
  (33, '33. Mark Coakes'),
  (34, '34. Monica Gonzalez'),
  (35, '35. Nancy Luna'),
  (36, '36. Nicole Griffin'),
  (37, '37. Rita Arya'),
  (38, '38. Rose Rahal'),
  (39, '39. Scot Kalchbrenner'),
  (40, '40. Shawn Ellis'),
  (41, '41. Stephanie Justice'),
  (42, '42. Sushil Trikha'),
  (43, '43. Thais Loizaga'),
  (44, '44. Tiffany Caesar'),
  (45, '45. Tony Murdaco'),
  (46, '46. Trey Duoto'),
  (47, '47. Yuto Izumi'),
  (48, '48. Yolanda Atzingen'),
  (49, '49. Zain Ali')
ON CONFLICT (sort_order) DO UPDATE SET
  label = EXCLUDED.label;

-- Optionally remove any extra records that are no longer part of the roster.
DELETE FROM "Duferco Employees"
WHERE sort_order > 49;
