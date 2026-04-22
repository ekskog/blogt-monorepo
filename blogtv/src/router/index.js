import { createRouter, createWebHistory } from 'vue-router'
import Posts from '@/components/BlogPosts.vue'
import Post from '@/components/BlogPost.vue'
import Search from '@/components/BlogSearch.vue'
import ExploreDay from '@/components/BlogExploreDay.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    // Redirect to the latest post by fetching the first page and extracting its date
    beforeEnter: async (to, from, next) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/post`)
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data) && data.length > 0) {
            const firstPost = data[0]
            const match = firstPost.match(/^Date:\s*(\d{2})(\d{2})(\d{4})$/m)
            if (match) {
              const date = `${match[1]}${match[2]}${match[3]}`
              return next({ name: 'post', params: { date } })
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch the latest post:', e)
        // ignore and fall through to posts list
      }
      return next('/post')
    },
  },
  { path: '/posts', name: 'posts', component: Posts },
  {
    path: '/post/:date?', // Optional `date` parameter
    name: 'post',
    component: Post,
    props: (route) => ({ tag: route.query.date || route.params.date }),
  },
  {
    path: '/search',
    name: 'search',
    component: Search,
    props: (route) => ({ tag: route.query.tag }), // Pass the 'tag' query to the Search component as a prop
  },
  {
    path: '/explore-day',
    name: 'explore-day',
    component: ExploreDay,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
