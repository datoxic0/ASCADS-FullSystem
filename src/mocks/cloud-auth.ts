export function createLovableAuth() {
  return {
    signInWithOAuth: async () => ({ error: new Error("Auth not supported in this environment") })
  };
}
