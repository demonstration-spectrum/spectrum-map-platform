<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Public Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <RouterLink to="/" class="text-xl font-bold text-primary-600">
              Spectrum Map
            </RouterLink>
          </div>
          
          <div class="flex items-center space-x-4">
            <RouterLink
              to="/login"
              class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Sign In
            </RouterLink>
            <RouterLink
              to="/register"
              class="btn-primary"
            >
              Sign Up
            </RouterLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
// Public layout for unauthenticated pages
</script>
