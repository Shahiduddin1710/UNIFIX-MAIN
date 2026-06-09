export async function getAdminToken(): Promise<string> {
  const base = process.env.EXPO_PUBLIC_BASE_URL;
  const res = await fetch(`${base}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.EXPO_PUBLIC_ADMIN_EMAIL,
      password: process.env.EXPO_PUBLIC_ADMIN_PASSWORD,
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error("Admin login failed");
  return data.token;
}