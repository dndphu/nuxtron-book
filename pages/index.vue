<script setup lang="ts">
import { Book, Rendition } from "epubjs";
import { dark, tan, light } from "@/utils/book-reader/themeBook";

import type {
  IFront,
  IMeta,
  IStateBook,
  typeTheme,
  typeFlow,
} from "@/types/book";

import {
  selectListener,
  clickListener,
  swipListener,
  wheelListener,
  keyListener,
} from "@/utils/book-reader/listener/index";
const arrayDropdown = [
  { id: 1, label: "label one", variant: "default" },
  { id: 2, label: "label two", variant: "alert" },
  { id: 3, label: "label three", variant: "highlight" },
];
const settingBook = reactive<IStateBook>({
  fontSize: 18,
  fontFamily: "Arial",
  theme: "light",
  flow: "paginated",
});

const rendition = ref({}) as any;
const bookRender = ref({}) as any;
const metadata = ref<IMeta | undefined>();

const isReady = ref(false);
const isStart = ref(); // check is first page
const isEnd = ref(); // check is last page

const cfiString = ref(); //'epubcfi(/6/6!/4/24/1:547)'
const toc = ref([]) as any; // Add a ref for the table of contents

const epubFilePath = ref();
const bookData = ref();

const isActiveToc = ref(); // check table of content is acting
const isActiveSetting = ref(false);

const fontsList = [
  { id: 1, name: "Arial" },
  { id: 2, name: "Times New Roman" },
  { id: 3, name: "Palatino Linotype" },
];

const theme = {
  light: {
    background: "inherit",
    color: "inherit",
  },
  tan: {
    background: `#fdf6e3 `,
    color: `#002b36 `,
  },
  dark: {
    background: `#444 `,
    color: `#fff `,
  },
};

const background = ref("inherit");
const color = ref("inherit");
const route = useRoute();

// const { data: bookCache } = useNuxtData(API_KEY.BOOK_ID(id))

// if (bookCache.value) {
//   bookData.value = bookCache.value.data
//   epubFilePath.value = bookCache.value?.data.path
// } else {
//   const { data, error, pending, refresh } = await fetchBook(id)
//   bookData.value = bookCache.value.data
//   epubFilePath.value = data.value?.data.path
// }

onMounted(async () => {
  // initBook();
});

//Method
const initBook = async () => {
  // const localForage = useLocalForage()
  //check local last visit
  // const item = await localForage.getItem(id as string)
  // if (item) {
  //   if (confirm('Bạn đang đọc cuốn sách này, có muốn tiếp tục?') == true) {
  //     cfiString.value = item
  //   }
  // }
  if (!epubFilePath.value) {
    return;
  }

  bookRender.value = new Book(epubFilePath.value); //read path bookRender

  rendition.value = new Rendition(bookRender.value, {
    width: "100%",
    height: "100%",
  });

  // setting action from user
  rendition.value.on("rendered", (e: any, iframe: any) => {
    iframe.iframe.contentWindow.focus();
    clickListener(iframe.document, rendition.value, flipPage);
    selectListener(iframe.document, rendition.value, toggleBuble);
    swipListener(iframe.document, flipPage);
    wheelListener(iframe.document, flipPage);
    keyListener(iframe.document, flipPage);
  });

  rendition.value.on("relocated", async (location: any) => {
    isStart.value = location.atStart;
    isEnd.value = location.atEnd;
    // if (!location.atStart) {
    //   await localForage.setItem(id as string, location.start.cfi)
    // }
  });

  bookRender.value.ready
    .then(() => {
      metadata.value = bookRender.value.package.metadata;
      // table of content - danh mục
      bookRender.value.loaded.navigation.then((nav: any) => {
        toc.value = nav.toc;
      });
    })
    .then(() => {
      rendition.value.attachTo(document.getElementById("reader"));
      rendition.value.display(cfiString.value || "0");
      rendition.value.themes.registerRules("light", light);
      rendition.value.themes.registerRules("dark", dark);
      rendition.value.themes.registerRules("tan", tan);
      rendition.value.themes.font(settingBook.fontFamily);
      rendition.value.themes.fontSize(settingBook.fontSize + "px");
      rendition.value.ready = true;
    })
    .then(() => {
      setTheme(settingBook.theme);
      isReady.value = true;
    });
};

const nextPage = () => {
  rendition.value.next();
  // let location = rendition.value.currentLocation()
  // cfiString.value = location.start.cfi // this is what you want to save
};

const prevPage = () => {
  rendition.value.prev();
};

const flipPage = (direction: string) => {
  if (direction === "next") nextPage();
  else if (direction === "prev") prevPage();
};

const toggleBuble = () => {};

const onClick = (item: any) => {
  rendition.value.display(item.cfi || item.href);
  isActiveToc.value = item;
};

const increaseFs = () => {
  settingBook.fontSize++;
  rendition.value.themes.fontSize((settingBook.fontSize + "px") as string);
  refreshRendition();
};

const decreaseFs = () => {
  settingBook.fontSize--;
  rendition.value.themes.fontSize((settingBook.fontSize + "px") as string);
  refreshRendition();
};

const refreshRendition = () => {
  if (rendition.value.manager) {
    rendition.value.start();
  }
};

const setTheme = (name: typeTheme) => {
  // if (settingBook.theme === name) return
  settingBook.theme = name;
  rendition.value.themes.select(name);
  background.value = theme[name].background;
  color.value = theme[name].color;
  refreshRendition();
};

const changeFlow = (flow: typeFlow) => {
  if (!rendition.value.ready) return;
  settingBook.flow = flow;
  rendition.value.flow(flow);
};

const setFont = (font: IFront) => {
  // if (font.name === settingBook.fontFamily) return
  settingBook.fontFamily = font.name;
  rendition.value.themes.font(font.name as string);
  refreshRendition();
};

const onClickSetting = () => {
  isActiveSetting.value = !isActiveSetting.value;
};

const onClickAdd = async () => {
  try {
    const filePath = await window.ipcRenderer.invoke("open-file-dialog");

    if (filePath && filePath.length > 0) {
      epubFilePath.value = filePath[0];

      initBook();
    }
  } catch (error) {
    console.log("error :>> ", error);
  }
};

const onClickRemove = async () => {
  rendition.value.destroy();
  metadata.value = undefined;
};
</script>

<template>
  <div class="book-page__wrapper">
    <div class="container-layout book-page">
      <div style="display: flex">
        <DpButton
          class=""
          size="sm"
          style="width: fit-content"
          @click="onClickAdd"
        >
          <DpIcon name="Plus" size="16"></DpIcon>
        </DpButton>


        <DpButton
          class=""
          size="sm"
          style="width: fit-content"
          @click="onClickRemove"
        >
          <DpIcon name="Trash2" size="16"></DpIcon>
        </DpButton>
      </div>

      <nav class="setting-book" :class="{ active: isActiveSetting }">
        <button class="toggle" @click="onClickSetting">
          <DpIcon name="Settings"> </DpIcon>
        </button>

        <div class="settings">
          <div class="option">
            <span>Flow</span>

            <div>
              <button
                :class="{ active: settingBook.flow === 'paginated' }"
                @click="changeFlow('paginated')"
              >
                Pages
              </button>
              <button
                :class="{ active: settingBook.flow === 'scrolled-doc' }"
                @click="changeFlow('scrolled-doc')"
              >
                Scroll
              </button>
            </div>
          </div>

          <div class="option">
            <span>Themes</span>
            <div>
              <button
                :class="{ active: settingBook.theme === 'light' }"
                @click="setTheme('light')"
              >
                Light
              </button>
              <button
                :class="{ active: settingBook.theme === 'tan' }"
                @click="setTheme('tan')"
              >
                Tan
              </button>
              <button
                :class="{ active: settingBook.theme === 'dark' }"
                @click="setTheme('dark')"
              >
                Dark
              </button>
            </div>
          </div>

          <div class="option">
            <span>Font Size</span>
            <div>
              <button @click="decreaseFs">-</button>
              <button @click="increaseFs">+</button>
            </div>
          </div>

          <div class="option">
            <span>Font</span>
            <div>
              <!-- <Dropdown
                placement="bottom"
                :list="fontsList"
                @onSelect="setFont"
              >
                <template #name>
                  <button>{{ settingBook.fontFamily }}</button>
                </template>
                <template #item="{ item }">
                  <span
                    :class="{
                      'active-font': settingBook.fontFamily === item.name,
                    }"
                  >
                    {{ item.name }}
                  </span>
                </template>
              </Dropdown> -->
            </div>
          </div>
        </div>
      </nav>
      <div v-if="!isReady" class="loading animated-skeleton"></div>

      <h1 :title="metadata?.title">{{ metadata?.title }}</h1>
      <i>{{ metadata?.creator }}</i>

      <div
        v-if="isStart"
        v-html="metadata?.description"
        class="description"
      ></div>

      <div v-if="isReady && metadata" class="btn-toc">
        <button :disabled="isStart" @click="prevPage">
          <DpIcon name="ChevronLeft"> </DpIcon>
        </button>

        <!-- <Dropdown :list="toc" placement="bottom" @onSelect="onClick">
          <template #name>
            <button>Mục lục</button>
          </template>
          <template #item="{ item }">
            <span
              :class="{
                'active-toc': isActiveToc && item.label === isActiveToc.label,
              }"
            >
              {{ item.label }}
            </span>
          </template>
        </Dropdown> -->
        <!-- <DpDropdown :options="arrayDropdown">
          <template #item="{ item }">
            <DpOptionItem :variant="item.variant" size="md">
              {{ item.label }}
            </DpOptionItem>
          </template>
        </DpDropdown> -->
        <button :disabled="isEnd" @click="nextPage">
          <DpIcon name="ChevronRight"> </DpIcon>
        </button>
      </div>

      <ClientOnly>
        <div id="reader" v-show="isReady"></div>
      </ClientOnly>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$w-setting: 300px;

.book-page {
  padding: 20px;
  display: flex;
  flex-direction: column;
  position: relative;

  &__wrapper {
    background: v-bind(background);
    color: v-bind(color);
    // height: calc(100dvh - 80px);
    height: 100%;
  }
}

.loading {
  width: 100%;
  height: 90dvh;
}

.description {
  line-height: 1.4;
  font-size: 18px;
}

#reader {
  user-select: none;
  height: 75vh;
  order: 2;
}

.btn-toc {
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
  margin-top: 8px;
  order: 3;

  button {
    padding: 8px 16px;
    border-radius: 4px;
    outline: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    height: 40px;
    margin-right: 8px;
    color: #000;
    background-color: #e5e7eb;

    &:hover {
      background-color: #e9e9e9;
    }

    &:disabled {
      background-color: #efefef;
      cursor: not-allowed;
    }
  }

  // @include screen-small() {
  //   order: 1;
  // }
}

.active-toc {
  font-weight: 600;
}

.setting-book {
  background-color: #eee;
  padding: 20px;
  position: fixed;
  top: 60px;
  // left: 0;
  right: 0;
  height: auto;
  width: $w-setting;
  // transform: translateX(-100%);
  transform: translateX($w-setting);
  transition: transform 0.4s ease;
  z-index: 30;

  .toggle {
    border: none;
    cursor: pointer;
    font-size: 20px;
    padding: 10px 15px;
    position: absolute;
    top: 0;
    // right: 1px;
    // transform: translateX(100%);
    left: 0;
    transform: translateX(-50px);
    background: #eee;
    color: #212121;
    opacity: 0.5;
    border-top-left-radius: 16px;
    border-bottom-left-radius: 16px;

    &:hover {
      opacity: 1;
    }
  }

  &.active {
    transform: translateX(0);
  }

  &.active .toggle {
    opacity: 1;

    svg {
      animation: spin 1s linear infinite;
    }
  }

  .settings {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .option {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;

      span {
        color: #000000;
      }

      button {
        // @include btn-base;
        background: #e5e7eb;

        &.active {
          border: 1px solid #adadad;
        }
      }

      .active-font {
        // color: #3f9eff;
        font-weight: 600;
      }
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
