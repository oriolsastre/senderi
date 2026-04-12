export async function getAuthStatus(): Promise<boolean> {
  const response = await fetch("/api/auth/status");
  const data = await response.json();
  return data.authenticated;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}
