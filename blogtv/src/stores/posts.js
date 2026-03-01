// store/posts.js
export const postStore = {
  currentPost: null,
  setCurrentPost(post) {
    this.currentPost = post;
  }
}
