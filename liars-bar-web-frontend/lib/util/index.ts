export function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

export function setToken(token: string): void {
  localStorage.setItem("accessToken", token);
}

export function removeToken(): void {
  localStorage.removeItem("accessToken");
}
