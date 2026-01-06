import axios from 'axios';
// import Vue from 'vue';

const request = axios.create({
  baseURL: import.meta.env.VITE_BASE_API_URL,
});

request.interceptors.response.use(
  (response) => {
    if (response.status === 200 && response.data.code === 200) {
      return response.data;
    }
    return Promise.reject(response);
  },
  (error) => {
    // Vue.prototype.$bbToast(
    //   error.response ? error.response.data.message : error.message,
    // );
    return error;
  },
);

export default request;
