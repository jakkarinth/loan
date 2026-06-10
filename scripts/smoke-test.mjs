const API_BASE_URL = process.env.SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000";
const FRONTEND_URL = process.env.SMOKE_FRONTEND_URL ?? "http://127.0.0.1:3000";
const EMAIL = process.env.SMOKE_EMAIL ?? "finance@example.local";
const PASSWORD = process.env.SMOKE_PASSWORD ?? "Password123!";
const BORROWER_EMAIL = process.env.SMOKE_BORROWER_EMAIL ?? "borrower@example.local";

const apiChecks = [
  ["/api", false],
  ["/api/reference/loan-statuses", true],
  ["/api/loans", true],
  ["/api/loans/1", true],
  ["/api/reports/dashboard", true],
  ["/api/reports/overdue", true],
  ["/api/notices", true]
];

const unauthenticatedChecks = [
  "/api/loans",
  "/api/loans/1",
  "/api/users",
  "/api/reports/dashboard",
  "/api/notices",
  "/api/documents/loans/1/contract.pdf"
];

const documentChecks = [
  "/api/documents/loans/1/contract.pdf",
  "/api/documents/loans/1/payment.pdf",
  "/api/documents/notices/1/notice.pdf",
  "/api/documents/reports/summary.pdf",
  "/api/documents/loans/1/contract.doc",
  "/api/documents/notices/1/notice.doc"
];

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return { response, body, contentType };
}

async function assertOk(name, promise) {
  try {
    await promise;
    console.log(`ok ${name}`);
  } catch (error) {
    console.error(`fail ${name}`);
    throw error;
  }
}

async function login(email = EMAIL, password = PASSWORD) {
  const { response, body } = await request(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok || !body?.data?.access_token) {
    throw new Error(`Login failed: ${response.status} ${JSON.stringify(body)}`);
  }

  return body.data.access_token;
}

async function checkApi(path, token, needsAuth) {
  const headers = needsAuth ? { Authorization: `Bearer ${token}` } : undefined;
  const { response, body } = await request(`${API_BASE_URL}${path}`, { headers });

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${JSON.stringify(body)}`);
  }

  const serialized = JSON.stringify(body);
  if (serialized.includes("????")) {
    throw new Error(`${path} contains broken Thai text`);
  }
}

async function checkDocument(path, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const bytes = await response.arrayBuffer();

  if (!response.ok || bytes.byteLength < 1000) {
    throw new Error(`${path} returned ${response.status}, ${bytes.byteLength} bytes`);
  }
}

async function checkUnauthorized(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (response.status !== 401) {
    throw new Error(`${path} should require authentication, got ${response.status}`);
  }
}

async function checkForbidden(path, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (response.status !== 403) {
    throw new Error(`${path} should deny this role, got ${response.status}`);
  }
}

async function checkFrontend() {
  const response = await fetch(FRONTEND_URL);
  if (!response.ok) {
    throw new Error(`${FRONTEND_URL} returned ${response.status}`);
  }
}

function getCookieValue(setCookieHeader, name) {
  const cookies = setCookieHeader?.split(/,(?=\s?[^;]+?=)/) ?? [];
  const cookie = cookies.find((item) => item.trim().startsWith(`${name}=`));
  return cookie?.trim().split(";")[0] ?? "";
}

async function checkNextAuthCredentials() {
  const providers = await fetch(`${FRONTEND_URL}/api/auth/providers`);
  if (!providers.ok) {
    throw new Error(`NextAuth providers returned ${providers.status}`);
  }

  const csrfResponse = await fetch(`${FRONTEND_URL}/api/auth/csrf`);
  const csrfBody = await csrfResponse.json();
  const csrfCookie = getCookieValue(csrfResponse.headers.get("set-cookie"), "next-auth.csrf-token");

  if (!csrfResponse.ok || !csrfBody?.csrfToken || !csrfCookie) {
    throw new Error("NextAuth CSRF endpoint did not return a usable token");
  }

  const callback = await fetch(`${FRONTEND_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookie
    },
    body: new URLSearchParams({
      csrfToken: csrfBody.csrfToken,
      email: EMAIL,
      password: PASSWORD,
      callbackUrl: FRONTEND_URL,
      json: "true"
    }),
    redirect: "manual"
  });

  const setCookie = callback.headers.get("set-cookie") ?? "";
  if (!callback.ok || !setCookie.includes("next-auth.session-token")) {
    throw new Error(`NextAuth credentials callback failed: ${callback.status}`);
  }
}

await assertOk("frontend", checkFrontend());
await assertOk("nextauth credentials", checkNextAuthCredentials());
const token = await login();
const borrowerToken = await login(BORROWER_EMAIL);

for (const path of unauthenticatedChecks) {
  await assertOk(`unauth ${path}`, checkUnauthorized(path));
}

await assertOk("auth login", (async () => {
  for (const [path, needsAuth] of apiChecks) {
    await checkApi(path, token, needsAuth);
  }
})());

await assertOk("role forbidden /api/users", checkForbidden("/api/users", borrowerToken));

for (const path of documentChecks) {
  await assertOk(path, checkDocument(path, token));
}

console.log("smoke-test-ok");
