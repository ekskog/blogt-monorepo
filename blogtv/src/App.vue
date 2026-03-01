<template>
  <div id="app">
    <Navbar />
    <router-view />
  </div>
</template>

<script>
import Navbar from "./components/BlogNavbar.vue";

export default {
  name: "App",
  components: {
    Navbar,
  },
};
</script>

<style>
@import '@/assets/global.css';
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;700&display=swap');


/* Ensure content starts below navbar */
#app {
  padding-top: 60px; /* Adjust based on your navbar height */
  margin: 0 auto; /* Center content */
  padding-left: 10px;
  padding-right: 10px;
}

</style>

