import { employees } from "./employees";

const DEFAULT_PASSWORD = "ChangeMe123!";



const normalizeName = (entry) => entry.replace(/^\d+\.\s*/, "");

const toUsername = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/\.\.+/g, ".")
    .replace(/^\.|\.$/g, "");

export const users = employees.map((entry) => {
  const id = parseInt(entry, 10);
  const name = normalizeName(entry);
  const usernameBase = toUsername(name);
  const username = usernameBase || `user${id}`;

  return {
    id,
    name,
    employeeLabel: entry,
    username,
    email: `${username}@example.com`,
    password: DEFAULT_PASSWORD,
  };
});

export const getUserByIdentifier = (identifier) => {
  const normalized = identifier.trim().toLowerCase();

  return (
    users.find(
      (user) =>
        user.username.toLowerCase() === normalized ||
        user.email.toLowerCase() === normalized ||
        user.name.toLowerCase() === normalized ||
        user.employeeLabel.toLowerCase() === normalized
    ) ?? null
  );
};
