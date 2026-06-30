<template>
  <div
    class="login-wrapper"
    :class="{
      'is-left': loginLayout === 'left',
      'is-right': loginLayout === 'right'
    }"
  >
    <div class="login-header">
      <div class="login-tools">
        <div class="login-tool">
          <ele-dropdown
            trigger="click"
            :items="[
              {
                title: '居左布局',
                command: 'left',
                icon: MenuFoldOutlined
              },
              {
                title: '居中布局',
                command: 'center',
                icon: MenuOutlined,
                iconStyle: { transform: 'scale(0.98)' }
              },
              {
                title: '居右布局',
                command: 'right',
                icon: MenuUnfoldOutlined
              }
            ]"
            :model-value="loginLayout"
            :icon-props="{ size: 13 }"
            :popper-options="{
              modifiers: [{ name: 'offset', options: { offset: [0, 5] } }]
            }"
            @command="changeLayout"
          >
            <el-icon>
              <SizeMiddleOutlined style="transform: rotate(90deg)" />
            </el-icon>
          </ele-dropdown>
        </div>
        <div class="login-tool ele-dark-switch" style="padding: 0 6px">
          <dark-switch />
        </div>
      </div>
    </div>
    <div class="login-main">
      <div class="login-card">
        <div class="login-cover">
          <img :src="loginBg" class="login-cover-image" />
        </div>
        <div class="login-body">
          <div class="login-content">
            <ele-text
              type="heading"
              style="font-size: 24px; margin-bottom: 16px"
            >
              用户登录
            </ele-text>
            <el-form
              ref="formRef"
              size="large"
              :model="form"
              @keyup.enter="handleSubmit"
              @submit.prevent=""
            >
              <el-form-item v-if="tenantEnabled" prop="tenantId">
                <el-select
                  filterable
                  v-model="form.tenantId"
                  placeholder="请选择公司"
                  :prefix-icon="UserOutlined"
                >
                  <el-option
                    v-for="item in tenantList"
                    :key="item.tenantId"
                    :value="item.tenantId"
                    :label="item.companyName"
                  />
                  <template #prefix>
                    <el-icon>
                      <CityOutlined />
                    </el-icon>
                  </template>
                </el-select>
              </el-form-item>
              <el-form-item
                prop="username"
                :rules="[
                  {
                    required: true,
                    message: '请输入登录账号',
                    type: 'string',
                    trigger: 'blur'
                  }
                ]"
              >
                <el-input
                  clearable
                  v-model="form.username"
                  placeholder="请输入登录账号"
                  :prefix-icon="UserOutlined"
                />
              </el-form-item>
              <el-form-item
                prop="password"
                :rules="[
                  {
                    required: true,
                    message: '请输入登录密码',
                    type: 'string',
                    trigger: 'blur'
                  }
                ]"
              >
                <el-input
                  show-password
                  v-model="form.password"
                  placeholder="请输入登录密码"
                  :prefix-icon="LockOutlined"
                />
              </el-form-item>
              <el-form-item
                v-if="captchaEnabled"
                prop="code"
                :rules="[
                  {
                    required: true,
                    message: '请输入验证码',
                    type: 'string',
                    trigger: 'blur'
                  }
                ]"
              >
                <div class="login-captcha-group">
                  <el-input
                    clearable
                    v-model="form.code"
                    placeholder="请输入验证码"
                    :prefix-icon="ProtectOutlined"
                  />
                  <div class="login-captcha" @click="queryCaptcha">
                    <img v-if="captcha" :src="captcha" />
                  </div>
                </div>
              </el-form-item>
              <el-form-item>
                <el-checkbox v-model="form.rememberMe">记住密码</el-checkbox>
                <el-link
                  type="primary"
                  underline="never"
                  style="line-height: 16px; margin-left: auto"
                >
                  忘记密码
                </el-link>
              </el-form-item>
              <el-form-item>
                <el-button
                  size="large"
                  type="primary"
                  :loading="loading"
                  style="width: 100%"
                  @click="handleSubmit"
                >
                  登录
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
        <page-footer v-if="loginLayout !== 'center'" />
      </div>
    </div>
    <page-footer v-if="loginLayout === 'center'" />
    <img :src="loginBg" class="login-image" />
    <div class="login-background">
      <img :src="loginBg" class="login-bg-image" />
    </div>
    <svg style="display: none">
      <defs>
        <filter id="darken-image">
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.85 0.6 0.5 0.25 0" />
            <feFuncG type="table" tableValues="0.85 0.6 0.5 0.25 0" />
            <feFuncB type="table" tableValues="0.85 0.6 0.5 0.25 0" />
          </feComponentTransfer>
          <feColorMatrix
            type="matrix"
            values="-0.333 0.667 0.667 0 0 0.667 -0.333 0.667 0 0 0.667 0.667 -0.333 0 0 0 0 0 1 0"
          />
        </filter>
      </defs>
    </svg>
  </div>
</template>

<script setup>
  import { ref, reactive } from 'vue';
  import { storeToRefs } from 'pinia';
  import { EleMessage } from 'ele-admin-plus';
  import {
    UserOutlined,
    LockOutlined,
    ProtectOutlined,
    SizeMiddleOutlined,
    MenuFoldOutlined,
    MenuOutlined,
    MenuUnfoldOutlined,
    CityOutlined
  } from '@/components/icons';
  import PageFooter from '@/layout/components/page-footer.vue';
  import DarkSwitch from '@/layout/components/dark-switch.vue';
  import { useThemeStore } from '@/store/modules/theme';
  import { useLogin } from '@/utils/use-login';
  import { getCaptcha, getTenantList } from '@/api/login';
  import loginBg from '@/assets/login-bg.png';

  const { login, checkLogin } = useLogin();
  const themeStore = useThemeStore();
  const { loginLayout } = storeToRefs(themeStore);

  /** 表单 */
  const formRef = ref(null);

  /** 登录请求状态 */
  const loading = ref(false);

  /** 表单数据 */
  const form = reactive({
    tenantId: '000000',
    username: 'admin',
    password: 'admin123',
    code: '',
    uuid: '',
    rememberMe: true
  });

  /** 图形验证码 */
  const captcha = ref('');

  /** 图形验证码开关 */
  const captchaEnabled = ref(true);

  /** 租户列表 */
  const tenantList = ref([]);

  /** 租户开关 */
  const tenantEnabled = ref(true);

  /** 获取图形验证码 */
  const queryCaptcha = () => {
    if (!captchaEnabled.value) {
      return;
    }
    getCaptcha()
      .then((result) => {
        captchaEnabled.value = result.captchaEnabled ?? true;
        if (captchaEnabled.value) {
          captcha.value = `data:image/gif;base64,${result.img}`;
          form.uuid = result.uuid;
          formRef.value?.clearValidate?.();
        }
      })
      .catch((e) => {
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 提交 */
  const handleSubmit = () => {
    formRef.value?.validate?.((valid) => {
      if (!valid) {
        return;
      }
      loading.value = true;
      login(form).catch((e) => {
        loading.value = false;
        EleMessage.error({ message: e.message, plain: true });
        queryCaptcha();
      });
    });
  };

  /** 切换布局方向 */
  const changeLayout = (command) => {
    themeStore.setValue('loginLayout', command);
  };

  /** 如果已登录直接进入首页 */
  checkLogin().catch(() => {
    /** 获取验证码 */
    queryCaptcha();
    /** 获取租户 */
    getTenantList(false)
      .then((result) => {
        tenantEnabled.value = result.tenantEnabled ?? true;
        if (tenantEnabled.value) {
          tenantList.value = result.voList || [];
          if (tenantList.value.length) {
            form.tenantId = tenantList.value[0].tenantId;
          }
        }
      })
      .catch((e) => {
        EleMessage.error({ message: e.message, plain: true });
      });
  });
</script>

<style lang="scss" scoped>
  @use 'ele-admin-plus/es/style/util.scss' as *;

  .login-wrapper {
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    position: relative;

    /* 左右布局时的插画图片 */
    .login-image {
      max-width: 100%;
      max-height: 100%;
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      mask-image: radial-gradient(
        farthest-side at 20% 52%,
        black 86%,
        transparent
      );
      pointer-events: none;
      user-select: none;
      z-index: 2;
    }

    /* 背景图片 */
    .login-bg-image {
      width: 100%;
      height: 100%;
      mask-image:
        linear-gradient(to bottom, black 26%, transparent 26%),
        linear-gradient(to top, black 28%, transparent 28%),
        linear-gradient(to left, black 50%, transparent 50%),
        linear-gradient(to right, black 15%, transparent 15%);
      display: block;
    }

    .login-background {
      width: 100%;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      filter: blur(18px);
      background: #dee5f0;
      pointer-events: none;
      user-select: none;
    }

    /* 顶栏 */
    .login-header {
      width: 100%;
      padding: 8px 8px 0 16px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      box-sizing: border-box;
      position: absolute;
      left: 0;
      top: 0;
      z-index: 4;
    }

    .login-tools {
      display: flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 42px;
      background: rgba(255, 255, 255, 0.28);
      box-shadow:
        0 6px 8px 0 rgba(255, 255, 255, 0.98) inset,
        0 0 2px 1px rgba(255, 255, 255, 0.98) inset,
        0 2px 8px 0 rgba(0, 0, 0, 0.06);
    }

    .login-tool {
      height: 34px;
      min-width: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      border-radius: 30px;
      transition: all 0.2s;
      cursor: pointer;

      &:hover {
        background: hsla(0, 0%, 60%, 0.15);
      }

      :deep(.el-dropdown) {
        width: 100%;
        height: 100%;

        & > div,
        .el-icon {
          width: 100%;
          height: 100%;
        }
      }
    }

    /* 底栏 */
    .ele-footer {
      padding-top: 0;
      position: relative;
      z-index: 3;
    }

    /* 主体 */
    .login-main {
      flex: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      padding: 68px 20px 20px 20px;
      position: relative;
      z-index: 3;
    }

    /* 主体卡片 */
    .login-card {
      width: 100%;
      max-width: 900px;
      display: flex;
      background: rgba(255, 255, 255, 0.68);
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
      border-radius: 12px;
      position: relative;
      overflow: hidden;

      &::after {
        content: '';
        width: 100%;
        height: 100%;
        border-radius: inherit;
        box-shadow:
          0 6px 8px 0 rgba(255, 255, 255, 0.98) inset,
          0 0 2px 1px rgba(255, 255, 255, 0.98) inset;
        position: absolute;
        left: 0;
        top: 0;
        pointer-events: none;
      }
    }

    /* 居中布局时卡片左侧插画 */
    .login-cover {
      flex-shrink: 0;
      width: 56.8%;
      height: 480px;
      display: flex;
      position: relative;
      overflow: hidden;

      &::after {
        content: '';
        height: 84%;
        border-left: 1px solid rgba(0, 0, 0, 0.08);
        position: absolute;
        right: 0;
        top: 8%;
      }
    }

    .login-cover-image {
      height: 100%;
      transform: scaleX(0.85);
      transform-origin: center left;
      pointer-events: none;
      user-select: none;
    }

    /* 登录表单 */
    .login-body {
      flex: 1;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      box-sizing: border-box;
      padding-top: 24px;

      :deep(.el-checkbox) {
        height: auto;

        .el-checkbox__label {
          color: inherit;
        }
      }

      :deep(.el-input__prefix-inner > .el-icon),
      :deep(.el-select__prefix > .el-icon) {
        margin-right: 12px;
        transform: scale(1.16);
      }
    }

    .login-content {
      width: 76%;
      min-height: 394px;
      box-sizing: border-box;
    }

    :deep(.ele-segmented) {
      #{eleVarName('segmented', 'bg')}: hsla(0, 0%, 60%, 0.16);
    }

    /* 验证码 */
    .login-captcha-group {
      width: 100%;
      display: flex;
      align-items: center;

      :deep(.el-input) {
        flex: 1;
      }

      .login-captcha {
        flex-shrink: 0;
        width: 108px;
        height: 40px;
        margin-left: 8px;
        border-radius: elVar('border-radius', 'base');
        border: 1px solid elVar('border-color');
        transition: border 0.2s;
        box-sizing: border-box;
        background: #fff;
        overflow: hidden;
        cursor: pointer;

        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        &:hover {
          border-color: elVar('color-primary');
        }
      }
    }

    /* 二维码 */
    .login-qrcode-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 0 0 0;
    }

    .login-qrcode {
      font-size: 0;
      display: inline-block;
      border: 1px solid elVar('border-color');
      border-radius: elVar('border-radius', 'base');
      overflow: hidden;
    }

    /* 居左居右 */
    &.is-left,
    &.is-right {
      align-items: flex-end;

      .login-main {
        width: 32%;
        padding: 0;
      }

      .login-card {
        flex: auto;
        max-width: none;
        flex-direction: column;
        border-radius: 0;
      }

      .login-cover {
        display: none;
      }

      .login-body {
        flex: auto;
        align-items: center;
        padding-top: 58px;
      }
    }

    &.is-left {
      align-items: flex-start;

      .login-image {
        right: 0;
        left: auto;
        transform: translateX(28%) translateY(-50%);
      }

      .login-background {
        transform: scaleX(-1);
      }
    }

    &:not(.is-left):not(.is-right) .login-image {
      display: none;
    }
  }

  /* 小屏幕适应 */
  @media screen and (max-width: 908px) {
    .login-wrapper {
      &.is-left,
      &.is-right {
        .login-main {
          width: 100%;
        }

        .login-image {
          top: 7%;
          transform: translateX(16%) scaleX(-1);
        }
      }
    }
  }

  @media screen and (max-width: 780px) {
    .login-wrapper {
      .login-card .login-cover {
        display: none;
      }

      &:not(.is-left):not(.is-right) {
        .login-card {
          max-width: 480px;
        }

        .login-body {
          padding-bottom: 52px;
        }
      }
    }
  }

</style>

<style lang="scss">
  /* 适配暗黑模式 */
  html.dark .login-wrapper {
    .login-tools {
      background: rgba(255, 255, 255, 0.06);
      box-shadow:
        0 2px 4px 0 rgba(255, 255, 255, 0.08) inset,
        0 0 2px 1px rgba(255, 255, 255, 0.06) inset,
        0 0 2px 0 rgba(0, 0, 0, 0.8);
    }

    .login-card {
      background: rgba(255, 255, 255, 0.06);

      &::after {
        box-shadow:
          0 6px 8px 0 rgba(255, 255, 255, 0.08) inset,
          0 0 2px 1px rgba(255, 255, 255, 0.08) inset;
      }
    }

    .login-cover {
      filter: url(#darken-image);
    }

    &.is-left .login-image,
    &.is-right .login-image {
      filter: url(#darken-image);
    }

    .login-background {
      filter: url(#darken-image) blur(120px);
    }

    .login-captcha-group .login-captcha {
      background: #000;

      img {
        filter: invert(1) hue-rotate(180deg) brightness(0.8);
      }
    }
  }
</style>
