export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  // 初始化認證狀態
  if (import.meta.client && !authStore.token) {
    authStore.initializeAuth()
  }

  // 如果不是登入頁面且未認證，則重定向到登入頁
  if (to.path !== '/' && !authStore.isAuthenticated) {
    return navigateTo('/')
  }
})
