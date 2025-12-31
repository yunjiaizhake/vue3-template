export const useCounterStore = defineStore(
  'counter',
  () => {
    const count = ref(0);
    const doubleCount = computed(() => count.value * 2);
    function increment() {
      count.value++;
    }

    return { count, doubleCount, increment };
  },
  {
    persist: {
      key: 'store_counter',
      pick: ['count'], // 需要持久化的属性
      storage: localStorage, // 指定存储方式, 默认sessionStorage
    },
  },
);
