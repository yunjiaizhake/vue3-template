import { mapState, mapActions } from 'pinia';
import { usePlayerStore } from '@/stores';

/**
 * 歌曲列表
 */
export const listMixin = {
  computed: {
    ...mapState(usePlayerStore, ['playing', 'currentMusic']),
  },
  methods: {
    selectItem(item, index) {
      if (item.id === this.currentMusic.id && this.playing) {
        this.setPlaying(false);
      } else {
        this.selectPlay({
          list: this.list,
          index,
        });
      }
    },
    ...mapActions(usePlayerStore, ['setPlaying', 'selectPlay']),
  },
};

/**
 * loading状态
 * @type {{data(): *, methods: {_hideLoad(): void}}}
 */
export const loadMixin = {
  data() {
    return {
      mmLoadShow: true, // loading状态
    };
  },
  methods: {
    _hideLoad() {
      let timer;
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.mmLoadShow = false;
      }, 200);
    },
  },
};
