<template>
  <!--评论-->
  <div class="comment" @scroll="listScroll">
    <bb-loading :value="bbLoadShow" />

    <dl v-if="hotComments.length > 0" class="comment-list">
      <dt class="comment-title">精彩评论</dt>
      <dd
        v-for="item in hotComments"
        :key="item.commentId"
        class="comment-item"
      >
        <a
          target="_blank"
          :href="`https://music.163.com/#/user/home?id=${item.user.userId}`"
        >
          <img
            v-lazy="`${item.user.avatarUrl}?param=50y50`"
            class="comment-item-pic"
          />
          <h2 class="comment-item-title">{{ item.user.nickname }}</h2>
        </a>
        <p class="comment-item-disc">{{ item.content }}</p>
        <div class="comment-item-opt">
          <span class="comment-opt-date">{{ formatTime(item.time) }}</span>
          <span class="comment-opt-liked">
            <bb-icon type="good" />
            {{ item.likedCount }}
          </span>
        </div>
      </dd>
    </dl>

    <dl v-if="commentList.length > 0" class="comment-list">
      <dt class="comment-title">最新评论（{{ total }}）</dt>
      <dd
        v-for="item in commentList"
        :key="item.commentId"
        class="comment-item"
      >
        <a
          class="comment-item-pic"
          target="_blank"
          :href="`https://music.163.com/#/user/home?id=${item.user.userId}`"
        >
          <img
            v-lazy="`${item.user.avatarUrl}?param=50y50`"
            class="cover-img"
          />
        </a>

        <h2 class="comment-item-title">
          <a
            target="_blank"
            :href="`https://music.163.com/#/user/home?id=${item.user.userId}`"
          >
            {{ item.user.nickname }}
          </a>
        </h2>

        <p class="comment-item-disc">{{ item.content }}</p>

        <div
          v-for="beReplied in item.beReplied"
          :key="beReplied.user.userId"
          class="comment-item-replied"
        >
          <a
            target="_blank"
            :href="`https://music.163.com/#/user/home?id=${beReplied.user.userId}`"
          >
            {{ beReplied.user.nickname }}
          </a>
          ：{{ beReplied.content }}
        </div>

        <div class="comment-item-opt">
          <span class="comment-opt-date">{{ formatTime(item.time) }}</span>
          <span v-if="item.likedCount > 0" class="comment-opt-liked">
            <bb-icon type="good" />
            {{ item.likedCount }}
          </span>
        </div>
      </dd>
    </dl>
  </div>
</template>

<script setup lang="ts">
import { getComment } from '@/api';
import { formatTime } from '@/utils/util';
import BbLoading from '@/base/bb-loading/index.vue';
import { useLoad } from '@/hooks/useload';
import type { CommentItem } from '@/types/dataTypes';

// ------------------------------ 路由 & hooks ------------------------------
const route = useRoute();
const { bbLoadShow, _hideLoad } = useLoad();

// ------------------------------ 数据 ------------------------------
const lockUp = ref<boolean>(true);
const page = ref<number>(0);
const hotComments = ref<CommentItem[]>([]);
const commentList = ref<CommentItem[]>([]);
const total = ref<number>(0);

// ------------------------------ 监听 ------------------------------
watch(commentList, (newList, oldList) => {
  if (newList.length !== oldList.length) {
    lockUp.value = false;
  }
});

// ------------------------------ 生命周期 ------------------------------
onMounted(() => {
  initData();
});

// ------------------------------ 方法 ------------------------------

// 初始化数据
function initData() {
  getComment(route.params.id as string, page.value).then((res) => {
    hotComments.value = res.hotComments;
    commentList.value = res.comments;
    console.log('hotComments.value', hotComments.value);
    total.value = res.total;
    lockUp.value = true;
    _hideLoad();
  });
}

// 列表滚动
function listScroll(e: Event) {
  if (lockUp.value) return;

  const { scrollTop, scrollHeight, offsetHeight } = e.target as HTMLElement;
  if (scrollTop + offsetHeight >= scrollHeight - 100) {
    lockUp.value = true;
    page.value += 1;
    pullUp();
  }
}

// 滚动加载
function pullUp() {
  getComment(route.params.id as string, page.value).then(({ comments }) => {
    commentList.value = [...commentList.value, ...comments];
  });
}
</script>

<style lang="less" scoped>
.comment {
  .comment-list {
    padding: 0 10px;
  }

  .comment-title {
    position: sticky;
    top: 0;
    z-index: 1;
    margin: 0 -10px;
    padding: 10px;
    height: 34px;
    line-height: 34px;
    color: @text_color_active;
    background: @header_bg_color;
    backdrop-filter: @backdrop_filter;
  }
  .comment-item {
    position: relative;
    padding: 15px 0 15px 55px;
    & + .comment-item {
      border-top: 1px solid @comment_item_line_color;
    }
    &-pic {
      display: block;
      position: absolute;
      left: 0;
      top: 20px;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      overflow: hidden;
    }
    &-title {
      height: 20px;
      margin-bottom: 6px;
      font-weight: 400;
      .no-wrap();
      color: @text_color_active;
    }
    &-disc {
      overflow: hidden;
      word-break: break-all;
      word-wrap: break-word;
      line-height: 25px;
      text-align: justify;
      color: @text_color;
      img {
        position: relative;
        vertical-align: middle;
        top: -2px;
      }
    }
    &-replied {
      padding: 8px 19px;
      margin-top: 10px;
      line-height: 20px;
      border: 1px solid @comment_replied_line_color;
      a {
        color: @text_color_active;
      }
    }
    &-opt {
      margin-top: 10px;
      line-height: 25px;
      text-align: right;
      overflow: hidden;
      .comment-opt-date {
        float: left;
        line-height: 28px;
      }
      .comment-opt-liked {
        display: inline-block;
        height: 20px;
        line-height: 20px;
      }
    }
  }
}
</style>
