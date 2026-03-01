// force rebuild on 2025-08-11 / 09:15
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import '@fortawesome/fontawesome-free/css/all.css'
import './assets/tailwind.css';


const app = createApp(App);
app.use(router);
app.mount("#app");
