<template>
  <transition name="mm-dialog-fade">
    <div v-show="dialogShow" class="mm-dialog-box">
      <div class="mm-dialog-wrapper">
        <div class="mm-dialog-content">
          <div class="mm-dialog-head" v-text="headText"></div>
          <slot>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="mm-dialog-text" v-html="bodyText"></div>
          </slot>

          <div class="mm-dialog-btns">
            <div
              v-if="dialogType !== 'alert'"
              class="mm-btn-cancel"
              @click="cancel"
              v-text="cancelBtnText"
            ></div>
            <slot name="btn"></slot>
            <div
              class="mm-btn-confirm"
              @click="confirm"
              v-text="confirmBtnText"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
// -------- props --------
const props = defineProps({
  type: { type: String, default: 'confirm' },
  headText: { type: String, default: '提示' },
  bodyText: { type: String, default: '' },
  cancelBtnText: { type: String, default: '取消' },
  confirmBtnText: { type: String, default: '确定' },
  appendToBody: { type: Boolean, default: true },
});

// -------- emit --------
const emit = defineEmits(['cancel', 'confirm']);

// -------- state --------
const dialogShow = ref(false);

// -------- computed --------
const dialogType = computed(() => props.type.toLowerCase());

// -------- watch --------
watch(dialogShow, async (val) => {
  if (val && props.appendToBody) {
    await nextTick();
    document.body.appendChild(dialogRef.value);
  }
});

// -------- ref --------
const dialogRef = ref(null);

// -------- 生命周期 --------
onMounted(() => {
  if (dialogShow.value && props.appendToBody) {
    document.body.appendChild(dialogRef.value);
  }
});

onBeforeUnmount(() => {
  if (props.appendToBody && dialogRef.value?.parentNode) {
    dialogRef.value.parentNode.removeChild(dialogRef.value);
  }
});

// -------- methods --------
function show() {
  dialogShow.value = true;
}

function hide() {
  dialogShow.value = false;
}

function cancel() {
  hide();
  emit('cancel');
}

function confirm() {
  hide();
  emit('confirm');
}

// -------- expose methods --------
defineExpose({
  show,
  hide,
});
</script>

<style lang="less">
@dialog-prefix-cls: mm-dialog;

.@{dialog-prefix-cls}-box {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1996;
  background-color: @dialog_bg_color;
  user-select: none;
  backdrop-filter: @backdrop_filter;

  &.@{dialog-prefix-cls}-fade-enter-active {
    animation: mm-dialog-fadein 0.3s;
    .@{dialog-prefix-cls}-content {
      animation: mm-dialog-zoom 0.3s;
    }
  }

  .@{dialog-prefix-cls}-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1996;

    .@{dialog-prefix-cls}-content {
      width: 420px;
      border-radius: @dialog_border_radius;
      background: @dialog_content_bg_color;

      @media (max-width: 767px) {
        width: 270px;
        border-radius: @dialog_mobile_border_radius;
        text-align: center;
      }

      .@{dialog-prefix-cls}-head {
        padding: 15px;
        padding-bottom: 0;
        font-size: @font_size_large;
        color: @text_color_active;
      }

      .@{dialog-prefix-cls}-text {
        padding: 20px 15px;
        line-height: 22px;
        font-size: @font_size_medium;
        color: @dialog_text_color;
      }

      .@{dialog-prefix-cls}-btns {
        display: flex;
        align-items: center;
        padding: 0 15px 10px;
        text-align: center;
        color: @dialog_text_color;

        @media (min-width: 768px) {
          justify-content: flex-end;

          div {
            display: block;
            padding: 8px 15px;
            border-radius: @dialog_btn_mobile_border_radius;
            border: 1px solid @btn_color;
            font-size: @font_size_medium;
            cursor: pointer;

            &:not(:nth-of-type(1)) {
              margin-left: 10px;
            }

            &:hover {
              color: @text_color_active;
              border: 1px solid @btn_color_active;
            }
          }
        }

        @media (max-width: 767px) {
          justify-content: center;
          padding: 0;

          div {
            flex: 1;
            line-height: 22px;
            padding: 10px 0;
            border-top: 1px solid @dialog_line_color;
            font-size: @font_size_large;

            &:not(:nth-of-type(1)) {
              border-left: 1px solid @dialog_line_color;
            }
          }
        }
      }
    }
  }
}

@keyframes mm-dialog-fadein {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes mm-dialog-zoom {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
</style>
