<template>
  <div class="max-w-[800px] mx-auto px-4 sm:px-6 md:px-[50px] py-6 sm:py-8 md:py-[50px] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.4)] text-gray-800">
    <div v-if="post">
      <!-- Title -->
      <h2 class="text-xl sm:text-2xl uppercase font-bold mb-4 text-left">
        {{ extractTitle(post) }}
      </h2>

      <!-- Geotag -->
      <div v-if="extractGeotag(post)" class="mb-2">
        <a
          :href="extractGeotag(post)?.url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-black no-underline hover:underline"
        >
          @ {{ extractGeotag(post)?.text }}
        </a>
      </div>

      <!-- Image -->
      <div class="pt-6 sm:pt-8 md:pt-[50px]">
        <figure class="aspect-square text-center">
          <div v-if="imageLoading" class="flex items-center justify-center text-sm sm:text-base text-gray-700">
            Fetching Image...
          </div>
          <img
            :src="getImageUrl(post)"
            alt="Post Image"
            class="w-full h-auto max-w-full sm:max-w-[800px] border border-gray-800 cursor-pointer transition-transform duration-300 ease-in-out hover:scale-[1.02] hover:shadow-[0_5px_15px_rgba(0,0,0,0.3)]"
            @load="onImageLoaded"
            @error="onImageError"
            v-show="!imageLoading"
            @click="openImageModal"
          />
          <figcaption v-show="!imageLoading" class="mt-1 text-xs text-center">
            {{ calculateCaption(post) }}
          </figcaption>
        </figure>
      </div>

      <!-- Image Modal -->
      <div
        v-if="showImageModal"
        class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
        @click="closeImageModal"
      >
        <div class="relative max-w-[95%] max-h-[95%] flex flex-col items-center">
          <div class="w-full flex justify-end mb-2">
            <button
              class="px-3 py-1 sm:px-4 sm:py-2 bg-white text-black font-bold text-sm sm:text-base rounded hover:bg-gray-100"
              @click="closeImageModal"
            >
              Close
            </button>
          </div>
          <img
            :src="getImageUrl(post)"
            alt="Full Resolution Image"
            class="max-w-full max-h-[calc(100vh-100px)] object-contain"
          />
        </div>
      </div>

      <!-- Toggle Buttons -->
      <div class="mt-5 flex flex-wrap gap-2 justify-center">
        <button
          @click="toggleExifData"
          class="px-2 py-1 sm:px-3 sm:py-2 text-xs border border-gray-300 bg-gray-100 rounded hover:bg-gray-200"
        >
          {{ showExifData ? 'Hide EXIF Data' : 'Show EXIF Data' }}
        </button>
        <button
          @click="toggleAzEyeData"
          class="px-2 py-1 sm:px-3 sm:py-2 text-xs border border-gray-300 bg-gray-100 rounded hover:bg-gray-200"
        >
          {{ showAzEyeData ? 'Hide AzEye Data' : 'Show AzEye Data' }}
        </button>
      </div>

      <!-- EXIF Viewer -->
      <div v-if="showExifData" class="mt-5 mb-5 p-4 border border-gray-300 rounded bg-gray-200">
        <ExifViewer :initialImageUrl="getImageUrl(post)" />
      </div>

      <!-- Azure Eye Viewer -->
      <div v-if="showAzEyeData" class="mt-5 mb-5 p-4 border border-gray-300 rounded bg-gray-200">
        <AzureViewer :initialImageUrl="getImageUrl(post)" />
      </div>

      <!-- Markdown Content -->
      <div class="pt-8 text-base sm:text-[1.2em] md:text-[1.4em] leading-relaxed">
        <div v-html="renderMarkdown(removeGeotag(removeMetadata(post)))"></div>
      </div>

      <!-- Tags -->
      <div class="mt-5 pt-5 border-t border-gray-200 text-xs flex flex-wrap items-center gap-2">
        <span class="font-bold pr-6 hover:text-blue-300">
          {{ date }}
        </span>
        <template v-for="(tag, index) in extractTags(post).split(',')" :key="index">
          <span class="font-bold uppercase mx-1">
            <router-link class="text-black hover:text-blue-300" :to="{ name: 'search', query: { tag: tag.trim() } }">
              {{ tag.trim() }}
            </router-link>
          </span>
          <span v-if="index < extractTags(post).split(',').length - 1" class="text-gray-400 mx-1">|</span>
        </template>
      </div>

      <!-- Pagination Controls -->
      <div class="flex flex-wrap justify-between mt-10 gap-2 px-2 sm:px-5">
        <button
          @click="navigateToPreviousDay"
          class="px-3 py-1 sm:px-4 sm:py-2 min-w-[80px] border border-black bg-gray-100 rounded hover:bg-gray-200 text-xs sm:text-sm"
          :disabled="navigationLoading"
        >
          <span v-if="navigationLoading && previousLoading">Searching...</span>
          <span v-else>{{ '< 1' }}</span>
        </button>
        <button
          @click="navigateToPreviousYear"
          class="px-3 py-1 sm:px-4 sm:py-2 min-w-[80px] border border-black bg-gray-100 rounded hover:bg-gray-200 text-xs sm:text-sm"
          :disabled="navigationLoading"
        >
          {{ '< 365' }}
        </button>
        <button
          @click="navigateToNextYear"
          class="px-3 py-1 sm:px-4 sm:py-2 min-w-[80px] border border-black bg-gray-100 rounded hover:bg-gray-200 text-xs sm:text-sm"
          :disabled="navigationLoading"
        >
          {{ '> 365' }}
        </button>
        <button
          @click="navigateToNextDay"
          class="px-3 py-1 sm:px-4 sm:py-2 min-w-[80px] border border-black bg-gray-100 rounded hover:bg-gray-200 text-xs sm:text-sm"
          :disabled="navigationLoading"
        >
          <span v-if="navigationLoading && nextLoading">Searching...</span>
          <span v-else>{{ '> 1' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
//import { ref } from 'vue'
import { postStore } from '@/stores/posts'
import { marked } from 'marked'
import CryptoJS from 'crypto-js'
import ExifViewer from './ExifViewer.vue' // Import ExifViewer component
import AzureViewer from './AzureViewer.vue' // Import AzureViewer component

export default {
  name: 'BlogPost',
  components: {
    ExifViewer,
    AzureViewer,
  },
  data() {
    return {
      date: this.$route.params.date,
      post: postStore.currentPost,
      showExifData: false,
      showAzEyeData: false,
      showImageModal: false, // New data property for image modal
      loading: false,
      imageLoading: true, // Added for image loading state
      navigationLoading: false, // General navigation loading state
      nextLoading: false, // Specific to next button
      previousLoading: false, // Specific to previous button
    }
  },

  mounted() {
    if (!this.post) {
      console.warn('Post is not yet set, skipping image fetch.')
      return
    }

    const img = new Image()
    img.onload = () => {
      this.imageLoading = false
    }
    img.src = this.getImageUrl(this.post)
  },

  watch: {
    '$route.params.date': {
      immediate: true,
      async handler(newDate) {
        console.log('Detected route change, new date:', newDate)
        if (newDate) {
          this.date = newDate
          this.imageLoading = true // Reset image loading state when route changes
          this.loadPost(newDate) // Fetch the new post
          if (this.post) {
            console.log('Post fetched, now updating image...')
            this.imageLoading = false
          }
        } else {
          console.error('No date provided in route params!')
          this.post = null // Clear the post if date is invalid
        }
      },
    },

    post: {
      handler() {
        // Reset image loading state when post data changes
        if (this.post) {
          this.imageLoading = true
        }
      },
    },
  },

  methods: {
    // Image modal methods
    openImageModal() {
      this.showImageModal = true
      // Add a class to body to prevent scrolling when modal is open
      document.body.classList.add('modal-open')
    },

    closeImageModal() {
      this.showImageModal = false
      // Remove the class from body when modal is closed
      document.body.classList.remove('modal-open')
    },

    toggleExifData() {
      this.showExifData = !this.showExifData
    },
    toggleAzEyeData() {
      this.showAzEyeData = !this.showAzEyeData
    },

    onImageLoaded() {
      // Image has finished loading
      console.log('Image loaded successfully')
      this.imageLoading = false
    },

    onImageError() {
      // Handle image loading error
      console.error('Error loading image')
      this.imageLoading = false
    },

    async loadPost(date) {
      try {
        this.loading = true
        this.imageLoading = true // Reset image loading state
        const response = await fetch(`https://blog-api.ekskog.net/post/${date}`)
        if (!response.ok) {
          throw new Error('error fetching post')
        } else {
          const data = await response.json()
          console.log(`DEBUG >> ${data}`)
          const postContent = data[0]
          postStore.setCurrentPost(postContent)
          this.post = postContent
          this.loading = false
        }
      } catch (error) {
        alert(error.message + ` >> no post for ${date}`)
        this.loading = false
      }
    },

    getImageUrl(post) {
      if (!post) {
        console.error('getImageUrl called with null post!')
        return ''
      }

      const dateMatch = post.match(/Date:\s*(\d{2})(\d{2})(\d{4})/)
      if (dateMatch) {
        const [_, day, month, year] = dateMatch
        return `https://objects.ekskog.net/blotpix/${year}/${month}/${day}.jpeg`
      }
      console.error('Invalid Date format in metadata:', post)
      return ''
    },

    calculateCaption(post) {
      const MD5Caption = CryptoJS.MD5(post).toString()
      return MD5Caption
    },
    extractTags(post) {
      const tagsMatch = post.match(/^Tags:\s*(.+)$/m)
      const tags = tagsMatch ? tagsMatch[1].trim() : 'No Tags'
      return tags
    },
    removeGeotag(content) {
      return content
        .replace(/\[.*?\]\(https:\/\/maps\.app\.goo\.gl\/[^\s)]+\)\s*/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    },
    extractGeotag(post) {
      const cleanedPost = this.removeMetadata(post)
      const geotagMatch = cleanedPost.match(/\[(.*?)\]\((https:\/\/maps\.app\.goo\.gl\/[^\s)]+)\)/)
      return geotagMatch
        ? {
            text: geotagMatch[1],
            url: geotagMatch[2],
          }
        : null
    },
    extractTitle(post) {
      const titleMatch = post.match(/Title:\s*([^\n]+)/)
      const title = titleMatch ? titleMatch[1].trim() : 'Untitled'
      return title
    },
    removeMetadata(post) {
      const cleanedPost = post.replace(/^(Date:.*|Tags:.*|Title:.*)$/gm, '').trim()
      return cleanedPost
    },
    renderMarkdown(markdown) {
      return marked(markdown)
    },
    parseDateString() {
      const day = parseInt(this.date.slice(0, 2))
      const month = parseInt(this.date.slice(2, 4)) - 1
      const year = parseInt(this.date.slice(4, 8))
      let parsedDate = new Date(year, month, day)
      return parsedDate // Return Date object
    },

    async navigateToNextDay() {
      const inputDate = this.parseDateString()

      // Show loading indicator in UI
      this.navigationLoading = true
      this.nextLoading = true

      // Find the next available post
      const nextPostDate = await this.findNextAvailablePost(inputDate)

      if (nextPostDate) {
        console.log('Found next available post for date:', nextPostDate)
        this.$router.push({ name: 'post', params: { date: nextPostDate } })
      } else {
        console.log('No next post found')
        alert('No more posts found in the next 60 days')
        this.navigationLoading = false
        this.nextLoading = false
      }
    },

    async navigateToPreviousDay() {
      const inputDate = this.parseDateString()

      // Show loading indicator in UI
      this.navigationLoading = true
      this.previousLoading = true

      // Find the previous available post
      const previousPostDate = await this.findPreviousAvailablePost(inputDate)

      if (previousPostDate) {
        console.log('Found previous available post for date:', previousPostDate)
        this.$router.push({ name: 'post', params: { date: previousPostDate } })
      } else {
        console.log('No previous post found')
        alert('No more posts found in the previous 60 days')
        this.navigationLoading = false
        this.previousLoading = false
      }
    },

    navigateToNextYear() {
      console.log('NAVIGATE TO NEXT YEAR')
      const inputDate = this.parseDateString()
      // Calculate the date for the next year
      const nextYear = new Date(inputDate)
      nextYear.setFullYear(inputDate.getFullYear() + 1)
      const nextYearFormatted = this.formatDateStr(nextYear) // Format the date
      console.log('Navigating to same day, next year:', nextYearFormatted)
      this.$router.push({ name: 'post', params: { date: nextYearFormatted } }) // Route to next day
    },

    navigateToPreviousYear() {
      console.log('NAVIGATE TO PREVIOUS YEAR')
      const inputDate = this.parseDateString()
      // Calculate the date for the previous year
      const previousYear = new Date(inputDate)
      previousYear.setFullYear(inputDate.getFullYear() - 1)
      const previousYearFormatted = this.formatDateStr(previousYear) // Format the date
      console.log('Navigating to same day, previous year:', previousYearFormatted)
      this.$router.push({ name: 'post', params: { date: previousYearFormatted } }) // Route to next day
    },
    formatDateStr(date) {
      // Formats the date as DDMMYYYY
      return `${('0' + date.getDate()).slice(-2)}${('0' + (date.getMonth() + 1)).slice(-2)}${date.getFullYear()}`
    },

    async checkPostExists(date) {
      try {
        const response = await fetch(`https://blog-api.ekskog.net/post/${date}`)
        return response.ok
      } catch (error) {
        console.error(`Error checking if post exists for ${date}:`, error)
        return false
      }
    },

    async findNextAvailablePost(startDate) {
      this.navigationLoading = true

      let currentDate = new Date(startDate)
      let attempts = 0
      const maxAttempts = 60 // Maximum days to search ahead

      while (attempts < maxAttempts) {
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1)

        // Don't go beyond today's date
        if (currentDate > new Date()) {
          console.log('Reached current date, stopping search')
          this.navigationLoading = false
          return null
        }

        const formattedDate = this.formatDateStr(currentDate)
        console.log(`Checking if post exists for ${formattedDate}...`)

        const exists = await this.checkPostExists(formattedDate)

        if (exists) {
          this.navigationLoading = false
          return formattedDate
        }

        attempts++
      }

      console.log(`No posts found after checking ${maxAttempts} days`)
      this.navigationLoading = false
      return null
    },

    async findPreviousAvailablePost(startDate) {
      this.navigationLoading = true

      let currentDate = new Date(startDate)
      let attempts = 0
      const maxAttempts = 60 // Maximum days to search back

      while (attempts < maxAttempts) {
        // Move to previous day
        currentDate.setDate(currentDate.getDate() - 1)

        // Don't go before the blog's start date
        if (currentDate < new Date(2010, 0, 1)) {
          // Assuming blog starts from Jan 1, 2010
          console.log('Reached blog start date, stopping search')
          this.navigationLoading = false
          return null
        }

        const formattedDate = this.formatDateStr(currentDate)
        console.log(`Checking if post exists for ${formattedDate}...`)

        const exists = await this.checkPostExists(formattedDate)

        if (exists) {
          this.navigationLoading = false
          return formattedDate
        }

        attempts++
      }

      console.log(`No posts found after checking ${maxAttempts} days`)
      this.navigationLoading = false
      return null
    },
  },
}
</script>
