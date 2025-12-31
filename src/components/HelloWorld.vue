<script setup lang="ts">
import { useCounterStore } from '@/stores/counter_options';
import { useUsersStore } from '@/stores/users_setup';
const store = useCounterStore();
const store2 = useUsersStore();
store.count++;
console.log(store.count, store2.age);
store2.age++;
console.log(store.count, store2.age);
store2.$reset();
console.log(store.count, store2.age);

defineProps<{ msg: string }>();

const count = ref(0);
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

  <p>
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
      >create-vue</a
    >, the official Vue + Vite starter
  </p>
  <p>
    Learn more about IDE Support for Vue in the
    <a
      href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support"
      target="_blank"
      >Vue Docs Scaling up Guide</a
    >.
  </p>
  <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
</template>

<style scoped lang="scss">
.read-the-docs {
  color: #888;
  p {
    a {
      color: red;
    }
  }
}
.card {
  $primary-color: green;
  button {
    color: $primary-color;
  }
}
</style>
