<template>
  <div class="max-w-[800px] mx-auto px-4 sm:px-6 md:px-8 py-6">
    <div
      v-for="(post, index) in posts"
      :key="index"
      class="mb-10 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.4)] overflow-hidden"
    >
      <!-- Title & Geotag (moved above image) -->
      <div class="px-4 sm:px-6 md:px-8 pt-6">
        <h2 class="text-lg sm:text-xl md:text-2xl uppercase font-bold mb-2 text-gray-900">
          {{ extractTitle(post) }}
        </h2>
        <p v-if="extractGeotag(post)" class="text-xs text-black mb-4">
          <a
            :href="extractGeotag(post)?.url"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:underline"
          >
            @ {{ extractGeotag(post)?.text }}
          </a>
        </p>
      </div>

      <!-- Image -->
      <div class="w-full aspect-square flex items-center justify-center p-4">
        <img
          :src="getImageUrl(post)"
          alt="Post Image"
          class="w-full h-auto max-w-full border border-gray-800 object-contain"
        />
      </div>
      <p class="text-xs text-center text-gray-600 px-4 pb-2">
        {{ calculateCaption(post) }}
      </p>

      <!-- Markdown Content -->
      <div
        class="px-4 sm:px-6 md:px-8 text-[0.85rem] sm:text-base md:text-[1.1em] leading-relaxed text-gray-800"
      >
        <div v-html="renderMarkdown(removeGeotag(removeMetadata(post)))"></div>
      </div>

      <!-- Tags -->
      <div
        class="mt-6 px-4 sm:px-6 md:px-8 pt-4 pb-6 border-t border-gray-200 text-[0.5rem] sm:text-xs flex flex-wrap items-center gap-2"
      >
        <router-link
          :to="{ name: 'post', params: { date: extractDate(post) } }"
          class="font-bold whitespace-nowrap hover:text-blue-300"
          @click="setPost(post)"
        >
          {{ extractDate(post) }}
        </router-link>

        <template v-for="(tag, i) in extractTags(post).split(',')" :key="i">
          <span class="uppercase font-bold mx-1 whitespace-nowrap">
            <router-link
              :to="{ name: 'search', query: { tag: tag.trim() } }"
              class="text-black hover:text-blue-300"
            >
              {{ tag.trim() }}
            </router-link>
          </span>
          <span v-if="i < extractTags(post).split(',').length - 1" class="text-gray-400 mx-1"
            >|</span
          >
        </template>
      </div>
    </div>

    <!-- Pagination Controls -->
    <div class="flex justify-between items-center mt-10 mb-16 px-4 sm:px-6 md:px-8">
      <button
        @click="fetchPreviousPage"
        :disabled="isFirstPage || isLoading"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
      >
        {{ isLoading ? 'Loading...' : '<' }}
      </button>
      <button
        @click="fetchFirstPage"
        :disabled="isFirstPage || isLoading"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
      >
        {{ isLoading ? 'Loading...' : 'Page 1' }}
      </button>
      <button
        @click="fetchNextPage"
        :disabled="posts.length < 5 || isLoading"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
      >
        {{ isLoading ? 'Loading...' : '>' }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, reactive } from 'vue'
import { marked } from 'marked'
import { postStore } from '@/stores/posts'
import CryptoJS from 'crypto-js'

export default {
  name: 'BlogPosts',
  setup() {
    const posts = ref([])
    const isFirstPage = ref(true)
    const currentFirstPostDate = ref(null)
    const currentLastPostDate = ref(null)
    const isLoading = ref(false)
    const flippedCards = reactive({}) // Track flipped state for each card

    const toggleFlip = (index) => {
      flippedCards[index] = !flippedCards[index]
      console.log(`Toggled card ${index} to ${flippedCards[index] ? 'flipped' : 'unflipped'}`)
    }

    const fetchPosts = async () => {
      try {
        fetchFirstPage()
      } catch (error) {
        console.error('Error fetching posts:', error)
      } finally {
        isLoading.value = false
      }
    }

    const extractTitle = (post) => {
      const titleMatch = post.match(/^Title:\s*(.+)$/m)
      const title = titleMatch ? titleMatch[1].trim() : 'Untitled'
      return title
    }

    const calculateCaption = (post) => {
      const MD5Caption = CryptoJS.MD5(post).toString()
      return MD5Caption
    }
    const removeMetadata = (post) => {
      const cleanedPost = post.replace(/^(Date:.*|Tags:.*|Title:.*)$/gm, '').trim()
      return cleanedPost
    }

    const extractTags = (post) => {
      const tagsMatch = post.match(/^Tags:\s*(.+)$/m)
      const tags = tagsMatch ? tagsMatch[1].trim() : 'No Tags'
      return tags
    }

    const extractGeotag = (post) => {
      const cleanedPost = removeMetadata(post)
      const geotagMatch = cleanedPost.match(/\[(.*?)\]\((https:\/\/maps\.app\.goo\.gl\/[^\s)]+)\)/)
      return geotagMatch
        ? {
            text: geotagMatch[1],
            url: geotagMatch[2],
          }
        : null
    }

    const removeGeotag = (content) => {
      return content
        .replace(/\[.*?\]\(https:\/\/maps\.app\.goo\.gl\/[^\s)]+\)\s*/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    }

    const extractDate = (post) => {
      const dateMatch = post.match(/^Date:\s*(\d{2})(\d{2})(\d{4})$/m)
      return dateMatch ? `${dateMatch[1]}${dateMatch[2]}${dateMatch[3]}` : null
    }

    const renderMarkdown = (markdown) => {
      return marked(markdown)
    }

    const getImageUrl = (post) => {
      const dateMatch = post.match(/^Date:\s*(\d{2})(\d{2})(\d{4})$/m)
      if (dateMatch) {
        const day = dateMatch[1]
        const month = dateMatch[2]
        const year = dateMatch[3]
        let dateUrl = `https://objects.ekskog.net/blotpix/${year}/${month}/${day}.jpeg`
        return dateUrl
      }
      console.error('Invalid Date format in metadata:', post)
      return ''
    }

    const fetchFirstPage = async () => {
      try {
        isLoading.value = true
        console.log('fetch latest posts...')
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/post`)
        if (!response.ok) {
          throw new Error('Failed to fetch first page posts')
        }
        const data = await response.json()
        posts.value = data
        isFirstPage.value = true
        if (data.length > 0) {
          currentFirstPostDate.value = extractDate(data[0])
          currentLastPostDate.value = extractDate(data[data.length - 1])
          console.log('first page > Current First Post Date:', currentFirstPostDate.value)
          console.log('first page > Current Last Post Date:', currentLastPostDate.value)
        }
      } catch (error) {
        console.error('Error fetching first page posts:', error)
      } finally {
        isLoading.value = false
      }
    }

    const fetchNextPage = async () => {
      if (posts.value.length === 0) return
      console.log('fetch next page...')

      try {
        isLoading.value = true

        console.log('fetchNextPage > Current First Post Date:', currentFirstPostDate.value)
        console.log('fetchNextPage > Current Last Post Date:', currentLastPostDate.value)

        const day = parseInt(currentLastPostDate.value.slice(0, 2), 10) - 1
        const month = parseInt(currentLastPostDate.value.slice(2, 4), 10) - 1 // JS months are 0-indexed
        const year = parseInt(currentLastPostDate.value.slice(4), 10)
        const prevDate = new Date(year, month, day)

        const prevDay = String(prevDate.getDate()).padStart(2, '0')
        const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0')
        const prevYear = prevDate.getFullYear()
        const dateToFetch = `${prevDay}${prevMonth}${prevYear}`

        console.log('fetchNextPage > Will Fetch:', dateToFetch)

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts/from/${dateToFetch}`)
        if (!response.ok) {
          throw new Error('Failed to fetch next posts')
        }
        const data = await response.json()
        if (data.length > 0) {
          posts.value = data
          isFirstPage.value = false
          currentFirstPostDate.value = extractDate(data[0])
          currentLastPostDate.value = extractDate(data[data.length - 1])
        }
      } catch (error) {
        console.error('Error fetching next posts:', error)
      } finally {
        isLoading.value = false
      }
    }

    const fetchPreviousPage = async () => {
      console.log('fetch previous page...')
      if (!currentFirstPostDate.value) return
      console.log('cfd: ', currentFirstPostDate)

      try {
        isLoading.value = true

        console.log('fetchPreviousPage > Current First Post Date:', currentFirstPostDate.value)
        console.log('fetchPreviousPage > Current Last Post Date:', currentLastPostDate.value)

        const day = parseInt(currentFirstPostDate.value.slice(0, 2), 10)
        const month = parseInt(currentLastPostDate.value.slice(2, 4), 10) - 1 // JS months are 0-indexed
        const year = parseInt(currentLastPostDate.value.slice(4), 10)
        const date = new Date(year, month, day)

        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 10)
        console.log('This is the date 10 days after Date:', nextDate)

        const nextDay = String(nextDate.getDate()).padStart(2, '0')
        const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0') // JS months are 0-indexed
        const nextYear = nextDate.getFullYear()

        const dateToFetch = `${nextDay}${nextMonth}${nextYear}`
        console.log(`Date to fetch from: ${nextDay} - ${nextMonth} - ${nextYear}`)

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts/from/${dateToFetch}`)

        if (!response.ok) {
          throw new Error('Failed to fetch next posts')
        }
        const data = await response.json()
        if (data.length > 0) {
          posts.value = data
          isFirstPage.value = false
          currentFirstPostDate.value = extractDate(data[0])
          currentLastPostDate.value = extractDate(data[data.length - 1])
        }
      } catch (error) {
        console.error('Error fetching next posts:', error)
      } finally {
        isLoading.value = false
      }
    }

    onMounted(fetchPosts)

    return {
      posts,
      extractTitle,
      removeMetadata,
      extractTags,
      renderMarkdown,
      getImageUrl,
      extractGeotag,
      removeGeotag,
      fetchFirstPage,
      fetchNextPage,
      fetchPreviousPage,
      isFirstPage,
      extractDate,
      isLoading,
      calculateCaption,
      flippedCards,
      toggleFlip,
    }
  },
  methods: {
    setPost(post) {
      postStore.setCurrentPost(post)
    },
  },
}
</script>
