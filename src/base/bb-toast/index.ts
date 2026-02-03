import type { App } from 'vue';
import TempToast from './index.vue';

/*
this.$bbToast('保存成功')
this.$bbToast('失败了', 'top')  默认展示时间 1.5s
this.$bbToast('永久提示', 'center', 0) 0 代表永远不关闭，只要再次吊起替换他
*/

interface ToastInstance {
  // InstanceType 给一个 构造函数类型（class 或 typeof MyComponent），返回它 实例的类型
  vm: ComponentPublicInstance<InstanceType<typeof TempToast>>; // 组件实例类型
  container: HTMLDivElement;
}

let instance: ToastInstance | null = null;
let timer: number | null = null;

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

  instance = { vm, container } as ToastInstance;
  return instance;
};

const bbToast = {
  install(app: App, options = {}) {
    const opt = { ...defaultOpt, ...options };

    // 这里把 position 可选属性去掉就会报错，是因为在.d.ts文件中写了可选；但是.d.ts文件中写必选但是这里可选不会报错
    app.config.globalProperties.$bbToast = (
      message: string,
      position?: 'top' | 'center' | 'bottom',
      // 加上duration属性，当其为0时，会让toast永远不消失，直到下次调用将其顶替
      duration?: number,
    ) => {
      const { vm } = initInstance();

      // 如果有未完成的计时器，先清掉
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      // 更新内容和显示
      vm.message = message ?? opt.message;
      vm.position = position ?? opt.position;
      vm.duration = typeof duration === 'number' ? duration : opt.duration;
      vm.visible = true;

      // 自动隐藏
      if (vm.duration > 0) {
        timer = setTimeout(() => {
          vm.visible = false;
          timer = null;
        }, vm.duration);
      }
    };
  },
};

export default bbToast;
