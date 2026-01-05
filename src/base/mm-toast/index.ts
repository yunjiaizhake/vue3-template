import TempToast from './index.vue';

let instance = null;
let timer = null;

const defaultOpt = {
  message: '',
  position: 'center',
  duration: 1500,
};

const initInstance = () => {
  if (instance) return instance;

  const container = document.createElement('div');
  const toastApp = createApp(TempToast);
  const vm = toastApp.mount(container);

  document.body.appendChild(container);

  instance = { vm, container };
  return instance;
};

const mmToast = {
  install(app, options = {}) {
    const opt = { ...defaultOpt, ...options };

    app.config.globalProperties.$mmToast = (message, position) => {
      const { vm } = initInstance();

      // 如果有未完成的计时器，先清掉
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      // 更新内容和显示
      vm.message = message ?? opt.message;
      vm.position = position ?? opt.position;
      vm.duration = opt.duration;
      vm.visible = true;

      // 自动隐藏
      timer = setTimeout(() => {
        vm.visible = false;
        timer = null;
      }, opt.duration);
    };
  },
};

export default mmToast;
