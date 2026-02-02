<template>
  <header class="bb-header">
    <h1 class="header">
      <a href="https://github.com/yunjiaizhake/vue3-template/tree/Graduation-project" target="_blank">
        BbPlayer 在线音乐播放器
      </a>
    </h1>

    <dl class="user">
      <template v-if="user.userId">
        <router-link class="user-info" to="/music/userlist">
          <img class="avatar" v-lazy="`${user.avatarUrl}?param=50y50`" />
          <span>{{ user.nickname }}</span>
        </router-link>
        <dd class="user-btn" @click="openDialog(2)">退出</dd>
      </template>

      <dd v-else class="user-btn" @click="openDialog(0)">登录</dd>
    </dl>

    <!-- 登录 -->
    <bb-dialog ref="loginDialog" head-text="登录" confirm-btn-text="登录" cancel-btn-text="关闭" @confirm="login">
      <div class="bb-dialog-text">
        <input v-model.trim="uidValue" class="bb-dialog-input" type="number" autofocus placeholder="请输入您的网易云 UID"
          @keyup.enter="login" />
      </div>

      <template #btn>
        <div @click="openDialog(1)">帮助</div>
        <div @click="openDialog(3)">扫码登录</div>
      </template>
    </bb-dialog>

    <!-- 帮助 -->
    <bb-dialog ref="helpDialog" head-text="登录帮助" confirm-btn-text="去登录" cancel-btn-text="关闭" @confirm="openDialog(0)">
      <div class="bb-dialog-text">
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
    </bb-dialog>

    <!-- 退出 -->
    <bb-dialog ref="outDialog" body-text="确定退出当前用户吗？" @confirm="out" />

    <!-- 扫码登录 -->
    <bb-dialog ref="qrDialog" head-text="扫码登录" confirm-btn-text="去登录" cancel-btn-text="关闭" @confirm="openDialog(0)"
      @cancel="closeQrDialog">
      <div class="bb-dialog-text qr-login">
        <div class="qr-box">
          <img v-if="qrImg" :src="qrImg" alt="二维码" />
          <div v-else class="qr-placeholder">二维码加载中…</div>
        </div>
        <p class="qr-status">{{ qrStatus }}</p>
      </div>
    </bb-dialog>
  </header>
</template>

<script setup lang="ts">
import { usePlayerStore } from '@/stores/index.ts';
import {
  getUserPlaylist,
  getLoginQrKey,
  getLoginQrCode,
  checkLoginQr,
  getLoginStatus,
  logout,
} from '@/api';
import BbDialog from '@/base/bb-dialog/index.vue';
import { toHttps } from '@/utils/util';
import type { Creator as UserItem } from '@/types/dataTypes';

// ------------------------------ store ------------------------------
const store = usePlayerStore();
const uid = computed<string | null>(() => store.uid);
const setUid = (uid: string | null) => store.setUid(uid);

// ------------------------------ state ------------------------------
const user = ref<Partial<UserItem>>({});
const uidValue = ref<string>('');

const { proxy } = getCurrentInstance()!;

// ------------------------------ refs ------------------------------
const loginDialog =
  useTemplateRef<InstanceType<typeof BbDialog>>('loginDialog');
const helpDialog = useTemplateRef<InstanceType<typeof BbDialog>>('helpDialog');
const outDialog = useTemplateRef<InstanceType<typeof BbDialog>>('outDialog');
const qrDialog = useTemplateRef<InstanceType<typeof BbDialog>>('qrDialog');

const qrImg = ref<string>('');
const qrStatus = ref<string>('准备获取二维码…');
let qrTimer: number | null = null;
let qrKey = '';

// ------------------------------ methods ------------------------------
const openDialog = (key: number) => {
  switch (key) {
    case 0:
      loginDialog.value?.show();
      clearQrTimer();
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
      startQrLogin();
      break;
  }
};

const closeQrDialog = () => {
  qrDialog.value?.hide();
  clearQrTimer();
};

const clearQrTimer = () => {
  if (qrTimer) {
    window.clearInterval(qrTimer);
    qrTimer = null;
  }
};

const startQrLogin = async () => {
  clearQrTimer();
  qrImg.value = '';
  qrStatus.value = '正在获取二维码…';
  qrDialog.value?.show();

  try {
    const keyRes = await getLoginQrKey();
    qrKey = keyRes.data.unikey;
    const qrRes = await getLoginQrCode(qrKey);
    qrImg.value = qrRes.data.qrimg;
    qrStatus.value = '请使用网易云音乐扫码';

    qrTimer = window.setInterval(async () => {
      const status = await checkLoginQr(qrKey);
      console.log('[QR] check res', status);
      if (status.code === 802) {
        qrImg.value = status.avatarUrl || '';
        qrStatus.value = `欢迎 ${status.nickname}, 请在手机上进行授权`;
      }
      if (status.code === 800) {
        qrStatus.value = '二维码已过期，请重新获取';
        clearQrTimer();
        return;
      }
      if (status.code === 803) {
        qrStatus.value = '授权成功，正在登录…';
        clearQrTimer();
        if (status.cookie) {
          localStorage.setItem('cookie', status.cookie);
        }
        const loginStatus = await getLoginStatus(status.cookie);

        const userId = loginStatus.data.profile?.userId
        if (userId) {
          app_getUserPlaylist(userId);
          closeQrDialog();
        }
      }
    }, 3000);
  } catch (err) {
    console.error('二维码登录失败:', err);
    qrStatus.value = '二维码获取失败，请稍后重试';
  }
};

// 退出
const out = () => {
  user.value = {};
  setUid(null);
  localStorage.removeItem('cookie');
  logout();
  proxy!.$bbToast?.('退出成功！');
};

// 登录
const login = () => {
  if (!uidValue.value) {
    proxy!.$bbToast?.('UID 不能为空');
    openDialog(0);
    return;
  }
  loginDialog.value?.hide();
  app_getUserPlaylist(uidValue.value);
};

// 获取用户数据
const app_getUserPlaylist = (uid: string) => {
  getUserPlaylist(uid)
    .then(({ playlist = [] }) => {
      uidValue.value = '';

      if (!playlist.length || !playlist[0]!.creator) {
        proxy!.$bbToast?.(`未查询到 UID 为 ${uid} 的用户信息`);
        return;
      }

      const creator = playlist[0]!.creator;
      setUid(uid);

      creator.avatarUrl = toHttps(creator.avatarUrl);
      user.value = creator;

      setTimeout(() => {
        proxy!.$bbToast?.(`${user.value.nickname} 欢迎使用 BbPlayer`);
      }, 200);
    })
    .catch(() => {
      proxy!.$bbToast?.('获取用户信息失败，请稍后重试');
    });
};

// ------------------------------ 生命周期 ------------------------------
onMounted(() => {
  if (uid.value) app_getUserPlaylist(uid.value);
});

onBeforeUnmount(() => {
  clearQrTimer();
});
</script>

<style lang="less">
.bb-header {
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

.bb-dialog-text {
  text-align: left;

  .bb-dialog-input {
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

.qr-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  .qr-box {
    width: 180px;
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 8px;

    img {
      width: 180px;
      height: 180px;
    }

    .qr-placeholder {
      color: @text_color;
    }
  }

  .qr-status {
    color: @text_color;
    text-align: center;
  }
}
</style>
