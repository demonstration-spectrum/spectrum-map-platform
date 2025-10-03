<template>
  <PublicLayout>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full text-center">
        <div class="mb-8">
          <h1 class="text-9xl font-bold text-primary-600">404</h1>
          <h2 class="text-2xl font-bold text-gray-900 mt-4">Page not found</h2>
          <p class="text-gray-600 mt-2">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        
        <div class="space-y-4">
          <RouterLink to="/" class="btn-primary">
            Go back home
          </RouterLink>
          <div>
            <RouterLink to="/login" class="text-primary-600 hover:text-primary-500">
              Sign in
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
import PublicLayout from '@/components/layout/PublicLayout.vue'
</script>
