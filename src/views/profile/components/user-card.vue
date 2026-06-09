<template>
  <ele-card bordered>
    <div class="info-user">
      <div class="info-user-avatar" @click="openCropper">
        <el-avatar :size="100" :src="data.avatar" style="background: none" />
        <el-icon class="info-user-avatar-icon">
          <CloudUploadOutlined style="stroke-width: 3" />
        </el-icon>
      </div>
      <ele-text size="xxl" style="margin-top: 6px">
        {{ data.nickName }}
      </ele-text>
      <ele-text type="placeholder">
        <span>{{ data.deptName }}</span>
        <span style="padding: 0 8px">/</span>
        <span>{{ data.postGroup }}</span>
      </ele-text>
    </div>
    <el-divider border-style="dashed" style="margin: 22px 0" />
    <div class="info-list">
      <div class="info-item">
        <el-icon>
          <UserOutlined />
        </el-icon>
        <div class="info-item-text">
          <span>用户名称:</span>
          <span>{{ data.userName }}</span>
        </div>
      </div>
      <div class="info-item">
        <el-icon>
          <MobileOutlined />
        </el-icon>
        <div class="info-item-text">
          <span>手机号码:</span>
          <span>{{ data.phonenumber }}</span>
        </div>
      </div>
      <div class="info-item">
        <el-icon>
          <MailOutlined />
        </el-icon>
        <div class="info-item-text">
          <span>邮箱账号:</span>
          <span>{{ data.email }}</span>
        </div>
      </div>
      <div class="info-item">
        <el-icon>
          <IdcardOutlined />
        </el-icon>
        <div class="info-item-text">
          <span>所属角色:</span>
          <span>{{ data.roleGroup }}</span>
        </div>
      </div>
      <div class="info-item">
        <el-icon>
          <CalendarOutlined />
        </el-icon>
        <div class="info-item-text">
          <span>创建日期:</span>
          <span>{{ data.createTime }}</span>
        </div>
      </div>
    </div>
    <!-- 头像裁剪弹窗 -->
    <ele-cropper-modal
      v-model="visible"
      :src="data.avatar"
      :aspect-ratio="1"
      :to-blob="true"
      :modal-props="{ destroyOnClose: true, title: '修改头像' }"
      @done="handleCrop"
    />
  </ele-card>
</template>

<script setup>
  import { ref } from 'vue';
  import { EleMessage } from 'ele-admin-plus';
  import {
    CloudUploadOutlined,
    UserOutlined,
    MobileOutlined,
    MailOutlined,
    IdcardOutlined,
    CalendarOutlined
  } from '@/components/icons';
  import { uploadAvatar } from '@/api/profile';

  defineProps({
    data: {
      type: Object,
      required: true
    }
  });

  const emit = defineEmits({
    done: (_result) => true
  });

  /** 是否显示裁剪弹窗 */
  const visible = ref(false);

  /** 打开图片裁剪 */
  const openCropper = () => {
    visible.value = true;
  };

  /** 头像裁剪完成回调 */
  const handleCrop = (blob) => {
    const loading = EleMessage.loading({
      message: '请求中..',
      plain: true
    });
    uploadAvatar(blob)
      .then((res) => {
        loading.close();
        visible.value = false;
        EleMessage.success({ message: '修改成功', plain: true });
        emit('done', { avatar: res.imgUrl });
      })
      .catch((e) => {
        loading.close();
        EleMessage.error({ message: e.message, plain: true });
      });
  };
</script>

<style lang="scss" scoped>
  .info-user {
    padding-top: 16px;
    box-sizing: border-box;
    text-align: center;

    .info-user-avatar {
      display: inline-block;
      position: relative;
      cursor: pointer;
      line-height: 0;

      .info-user-avatar-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #fff;
        font-size: 30px;
        display: none;
        z-index: 2;
      }

      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: transparent;
        transition: background-color 0.3s;
      }

      &:hover {
        .info-user-avatar-icon {
          display: block;
        }

        &::after {
          background-color: rgba(0, 0, 0, 0.4);
        }
      }
    }
  }

  .info-list {
    padding-bottom: 12px;

    .info-item {
      display: flex;
      align-items: center;

      & > .el-icon {
        font-size: 16px;
        transform: translateY(-1px);
      }

      .info-item-text {
        flex: 1;
        padding-left: 8px;
        box-sizing: border-box;
        word-break: break-all;

        & > span + span {
          margin-left: 8px;
        }
      }

      & + .info-item {
        margin-top: 24px;
      }
    }
  }
</style>
