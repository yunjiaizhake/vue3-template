import { defineStore } from 'pinia';

// 第一个参数是应用程序中 store 的唯一 id
export const useUsersStore = defineStore('users', {
  state: () => {
    return {
      name: '小猪课堂',
      age: 25,
      sex: '男',
    };
  },
  getters: {
    getAddAge: (state) => {
      return (num: number) => state.age + num;
    },
    getNameAndAge(): string {
      return this.name + this.getAddAge; // 调用其它getter
    },
  },
  actions: {
    saveName(name: string) {
      this.name = name;
    },
  },

  persist: [
    {
      key: 'store_name',
      pick: ['name'],
      storage: localStorage,
    },
    {
      key: 'store_age',
      pick: ['age'],
      storage: sessionStorage,
    },
  ],
});
