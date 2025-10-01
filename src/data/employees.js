const rawEmployees = [
  "1. Allan Davidovits",
  "2. Alvin Faett",
  "3. Andrea Castillo",
  "4. Andrea Guggiari",
  "5. Annel Ochoa",
  "6. Brian Archer",
  "7. Christian Voelcker",
  "8. Clay Coleman",
  "9. David Klacik",
  "10. David Munro",
  "11. Diana Gann",
  "12. Dirk Coetzee",
  "13. Egle Petrauskaite",
  "14. Elena Keizl",
  "15. Galina Wright",
  "16. Gavin Dove",
  "17. Gayle Cox",
  "18. George Suarez",
  "19. Heriverto Lopez",
  "20. Jennifer Molina",
  "21. Jerry King",
  "22. Jesus Martinez",
  "23. John Iovino",
  "24. John O'Brien",
  "25. Joseph Ossola",
  "26. Keith Demma",
  "27. Ken Kim",
  "28. Ken Zenkevich",
  "29. Kyle Kingsbury",
  "30. Lauren Gundlach",
  "31. Marcela Gomez",
  "32. Mario Raimondo",
  "33. Mark Coakes",
  "34. Monica Gonzalez",
  "35. Nancy Luna",
  "36. Nicole Griffin",
  "37. Rita Arya",
  "38. Rose Rahal",
  "39. Scot Kalchbrenner",
  "40. Shawn Ellis",
  "41. Stephanie Justice",
  "42. Sushil Trikha",
  "43. Thais Loizaga",
  "44. Tiffany Caesar",
  "45. Tony Murdaco",
  "46. Trey Duoto",
  "47. Yuto Izumi",
  "48. Yolanda Atzingen",
  "49. Zain Ali",
];

const toAlpha = (value) => value.replace(/[^a-z]/gi, "");

const createUsername = (fullName, id) => {
  const [firstName = "", ...rest] = fullName.split(" ");
  const base = `${firstName.charAt(0)}${rest.join("")}`;
  const sanitized = toAlpha(base).toLowerCase() || toAlpha(fullName).toLowerCase();
  const handle = sanitized || `team${String(id).padStart(2, "0")}`;
  return `${handle}${String(id).padStart(2, "0")}`;
};

const createPassword = (fullName, id) => {
  const sanitized = toAlpha(fullName).toUpperCase();
  const suffix = sanitized.slice(-2).padEnd(2, "X");
  return `MsM!${String(id).padStart(2, "0")}${suffix}`;
};

export const employees = rawEmployees.map((entry, index) => {
  const id = index + 1;
  const [, nameWithoutNumber = entry] = entry.split(/\d+\.\s+/);
  const fullName = nameWithoutNumber.trim();
  const username = createUsername(fullName, id);
  const password = createPassword(fullName, id);
  return {
    id,
    name: entry,
    fullName,
    email: `${username}@example.com`,
    username,
    password,
  };
});
