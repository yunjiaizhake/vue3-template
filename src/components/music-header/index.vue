<template>
  <header class="mm-header">
    <h1 class="header">
      <a href="https://github.com/maomao1996/Vue-mmPlayer" target="_blank">
        BbPlayer 在线音乐播放器
      </a>
    </h1>

    <dl class="user">
      <template v-if="user.userId">
        <router-link class="user-info" to="/music/userlist">
          <img class="avatar" :src="`${user.avatarUrl}?param=50y50`" />
          <span>{{ user.nickname }}</span>
        </router-link>
        <dd class="user-btn" @click="openDialog(2)">退出</dd>
      </template>

      <dd v-else class="user-btn" @click="openDialog(0)">登录</dd>
    </dl>

    <!-- 登录 -->
    <mm-dialog
      ref="loginDialog"
      head-text="登录"
      confirm-btn-text="登录"
      cancel-btn-text="关闭"
      @confirm="login"
    >
      <div class="mm-dialog-text">
        <input
          v-model.trim="uidValue"
          class="mm-dialog-input"
          type="number"
          autofocus
          placeholder="请输入您的网易云 UID"
          @keyup.enter="login"
        />
      </div>

      <template #btn>
        <div @click="openDialog(1)">帮助</div>
      </template>
    </mm-dialog>

    <!-- 帮助 -->
    <mm-dialog
      ref="helpDialog"
      head-text="登录帮助"
      confirm-btn-text="去登录"
      cancel-btn-text="关闭"
      @confirm="openDialog(0)"
    >
      <div class="mm-dialog-text">
        <p>
          1、
          <a target="_blank" href="https://music.163.com">
            点我(https://music.163.com)
          </a>
          打开网易云音乐官网
        </p>
        <p>2、点击页面右上角“登录”</p>
        <p>3、点击头像进入主页</p>
        <p>4、复制 /user/home?id= 后面的数字</p>
      </div>
    </mm-dialog>

    <!-- 退出 -->
    <mm-dialog
      ref="outDialog"
      body-text="确定退出当前用户吗？"
      @confirm="out"
    />
  </header>
</template>

<script setup>
import { usePlayerStore } from '@/stores/index.ts';
import { getUserPlaylist } from '@/api';
import MmDialog from '@/base/mm-dialog/index.vue';
import { toHttps } from '@/utils/util';

// ================= store =================
const store = usePlayerStore();
const uid = computed(() => store.uid);
const setUid = (uid) => store.setUid(uid);

// ================= state =================
const user = ref({});
const uidValue = ref('');

// ================= dialog refs =================
const loginDialog = ref();
const helpDialog = ref();
const outDialog = ref();

// ================= functions =================
const openDialog = (key) => {
  switch (key) {
    case 0:
      loginDialog.value?.show();
      break;
    case 1:
      loginDialog.value?.hide();
      helpDialog.value?.show();
      break;
    case 2:
      outDialog.value?.show();
      break;
    case 3:
      loginDialog.value?.hide();
      break;
  }
};

// 退出
const out = () => {
  user.value = {};
  setUid(null);
  window.$mmToast?.('退出成功！');
};

// 登录
const login = () => {
  if (!uidValue.value) {
    window.$mmToast?.('UID 不能为空');
    openDialog(0);
    return;
  }
  openDialog(3);
  app_getUserPlaylist(uidValue.value);
};

// 获取用户数据
const app_getUserPlaylist = (uid) => {
  getUserPlaylist(uid).then(({ playlist = [] }) => {
    uidValue.value = '';

    if (!playlist.length || !playlist[0].creator) {
      window.$mmToast?.(`未查询到 UID 为 ${uid} 的用户信息`);
      return;
    }

    const creator = playlist[0].creator;
    setUid(uid);

    creator.avatarUrl = toHttps(creator.avatarUrl);
    user.value = creator;

    setTimeout(() => {
      window.$mmToast?.(`${user.value.nickname} 欢迎使用 BbPlayer`);
    }, 200);
  });
};

// ================= lifecycle =================
onMounted(() => {
  if (uid.value) app_getUserPlaylist(uid.value);
});
</script>

<style scoped lang="less">
.mm-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  @media (max-width: 768px) {
    background: @header_bg_color;
  }
  .header {
    .flex-center;
    line-height: 60px;
    color: @text_color_active;
    font-size: @font_size_large;
    @media (max-width: 768px) {
      padding-left: 15px;
      justify-content: flex-start;
    }
    @media (max-width: 414px) {
      font-size: @font_size_medium;
    }
    .visitor {
      margin-left: 6px;
      height: 20px;
      @media (max-width: 414px) {
        display: none;
      }
    }
  }
  .user {
    position: absolute;
    top: 50%;
    right: 15px;
    line-height: 30px;
    text-align: right;
    transform: translateY(-50%);
    &-info {
      float: left;
      margin-right: 15px;
      cursor: pointer;
      .avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        vertical-align: middle;
      }
      span {
        margin-left: 10px;
        color: @text_color_active;
      }
    }
    &-btn {
      float: left;
      cursor: pointer;
      &:hover {
        color: @text_color_active;
      }
    }
    @media (max-width: 768px) {
      &-info {
        margin-right: 10px;
        span {
          display: none;
        }
      }
    }
  }
}
.mm-dialog-text {
  text-align: left;
  .mm-dialog-input {
    width: 100%;
    height: 40px;
    box-sizing: border-box;
    padding: 0 15px;
    border: 1px solid @btn_color;
    outline: 0;
    background: transparent;
    color: @text_color_active;
    font-size: @font_size_medium;
    box-shadow: 0 0 1px 0 #fff inset;
    &::placeholder {
      color: @text_color;
    }
  }
  a:hover {
    color: #d43c33;
  }
}
</style>
