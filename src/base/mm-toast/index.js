import { createApp } from 'vue'
import TempToast from './index.vue'

let instance = null
let showToast = false
let timer = null

const defaultOpt = {
  message: '',
  position: 'center',
  duration: 1500,
}

const removeInstance = () => {
  if (!instance) return
  const { app, container } = instance
  app.unmount()
  if (container?.parentNode) {
    container.parentNode.removeChild(container)
  }
  instance = null
  showToast = false
}

const mmToast = {
  install(app, options = {}) {
    const opt = { ...defaultOpt, ...options }

    app.config.globalProperties.$mmToast = (message, position) => {
      if (showToast) {
        clearTimeout(timer)
        removeInstance()
      }

      const merged = {
        ...opt,
        message: message ?? opt.message,
        position: position ?? opt.position,
      }

      const container = document.createElement('div')
      const toastApp = createApp(TempToast)
      const vm = toastApp.mount(container)

      // 挂载到 body
      document.body.appendChild(container.firstElementChild)

      // script setup 中通过 defineExpose 暴露的响应式变量可直接赋值
      vm.message = merged.message
      vm.position = merged.position
      vm.duration = merged.duration
      vm.visible = showToast = true

      instance = { app: toastApp, vm, container }

      timer = setTimeout(() => {
        vm.visible = showToast = false
        removeInstance()
      }, merged.duration)
    }
  },
}

export default mmToast
