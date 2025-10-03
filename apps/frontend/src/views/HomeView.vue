<template>
  <PublicLayout>
    <!-- Hero Section -->
    <div class="bg-white">
      <div class="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span class="block">Geospatial Data</span>
            <span class="block text-primary-600">Made Simple</span>
          </h1>
          <p class="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Create, manage, and share interactive maps with your team. Upload geospatial data, 
            build custom visualizations, and collaborate on location-based insights.
          </p>
          <div class="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div class="rounded-md shadow">
              <RouterLink
                to="/register"
                class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
              >
                Get started
              </RouterLink>
            </div>
            <div class="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <RouterLink
                to="/login"
                class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Sign in
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="py-16 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 class="text-3xl font-extrabold text-gray-900">
            Everything you need for geospatial data
          </h2>
          <p class="mt-4 text-lg text-gray-600">
            Powerful tools for organizations of all sizes
          </p>
        </div>

        <div class="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div class="card">
            <div class="card-body text-center">
              <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-md bg-primary-500 text-white">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 class="mt-6 text-lg font-medium text-gray-900">Multi-Tenant Architecture</h3>
              <p class="mt-2 text-base text-gray-500">
                Secure, isolated workspaces for each organization with role-based access control.
              </p>
            </div>
          </div>

          <div class="card">
            <div class="card-body text-center">
              <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-md bg-primary-500 text-white">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h3 class="mt-6 text-lg font-medium text-gray-900">Easy Data Upload</h3>
              <p class="mt-2 text-base text-gray-500">
                Support for GeoJSON, Shapefiles, and MapInfo Tab files with automatic processing.
              </p>
            </div>
          </div>

          <div class="card">
            <div class="card-body text-center">
              <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-md bg-primary-500 text-white">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 class="mt-6 text-lg font-medium text-gray-900">Interactive Maps</h3>
              <p class="mt-2 text-base text-gray-500">
                Create beautiful, interactive maps with custom styling and real-time collaboration.
              </p>
            </div>
          </div>

          <div class="card">
            <div class="card-body text-center">
              <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-md bg-primary-500 text-white">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 class="mt-6 text-lg font-medium text-gray-900">Secure Sharing</h3>
              <p class="mt-2 text-base text-gray-500">
                Share maps publicly, with password protection, or keep them private to your organization.
              </p>
            </div>
          </div>

          <div class="card">
            <div class="card-body text-center">
              <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-md bg-primary-500 text-white">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 class="mt-6 text-lg font-medium text-gray-900">High Performance</h3>
              <p class="mt-2 text-base text-gray-500">
                Vector tiles and optimized rendering for smooth performance with large datasets.
              </p>
            </div>
          </div>

          <div class="card">
            <div class="card-body text-center">
              <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-md bg-primary-500 text-white">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 class="mt-6 text-lg font-medium text-gray-900">Team Collaboration</h3>
              <p class="mt-2 text-base text-gray-500">
                Work together with advisers and consultants across multiple organizations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="bg-primary-600">
      <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
        <h2 class="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          <span class="block">Ready to get started?</span>
          <span class="block text-primary-200">Create your first map today.</span>
        </h2>
        <div class="mt-8 flex lg:mt-0 lg:flex-shrink-0">
          <div class="inline-flex rounded-md shadow">
            <RouterLink
              to="/register"
              class="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50"
            >
              Get started
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
