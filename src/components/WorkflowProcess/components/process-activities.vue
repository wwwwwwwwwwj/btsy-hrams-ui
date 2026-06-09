<!-- 审批进度 -->
<template>
  <div class="ele-workflow-process-activities">
    <template v-for="(item, index) in data" :key="item.id">
      <!-- 整体状态 -->
      <div
        v-if="index === 0"
        class="ele-workflow-process-activity-item ele-workflow-process-activity-item-status"
      >
        <div class="ele-workflow-process-activity-item-status-icon">
          <el-icon v-if="item.flowStatus == 'pass'" class="is-pass">
            <CheckOutlined style="transform: scale(0.8); stroke-width: 8px" />
          </el-icon>
          <el-icon
            v-else-if="
              item.flowStatus == 'termination' ||
              item.flowStatus == 'cancel' ||
              item.flowStatus == 'invalid' ||
              item.flowStatus == 'back' ||
              item.flowStatus == 'timeout'
            "
            class="is-stop"
          >
            <CloseOutlined style="transform: scale(0.8); stroke-width: 8px" />
          </el-icon>
          <el-icon v-else>
            <LoadingDotOutlined style="stroke-width: 6" />
          </el-icon>
        </div>
        <div class="ele-workflow-process-activity-item-status-name">
          <span v-if="item.flowStatus == 'pass'">审批通过</span>
          <span
            v-else-if="
              item.flowStatus == 'termination' ||
              item.flowStatus == 'cancel' ||
              item.flowStatus == 'invalid' ||
              item.flowStatus == 'back' ||
              item.flowStatus == 'timeout'
            "
          >
            已终止
          </span>
          <span v-else>进行中</span>
        </div>
      </div>
      <!-- 活动项 -->
      <div class="ele-workflow-process-activity-item">
        <div class="ele-workflow-process-activity-item-left">
          <!-- 头像 -->
          <div class="ele-workflow-process-activity-item-avatar">
            <!-- 头像图标 -->
            <el-icon v-if="item.flowStatus == 'copy'">
              <Promotion />
            </el-icon>
            <el-icon v-else-if="item.approver.includes(',')">
              <Avatar />
            </el-icon>
            <div v-else>{{ getNameAvatar(item.approveName) }}</div>
            <!-- 状态标记 -->
            <el-icon
              v-if="item.flowStatus == 'pass'"
              class="ele-workflow-process-activity-item-icon is-pass"
            >
              <CheckOutlined style="stroke-width: 8" />
            </el-icon>
            <el-icon
              v-else-if="item.flowStatus == 'waiting'"
              class="ele-workflow-process-activity-item-icon is-waiting"
            >
              <EllipsisOutlined />
            </el-icon>
            <el-icon
              v-else-if="item.flowStatus == 'transfer'"
              class="ele-workflow-process-activity-item-icon is-transfer"
            >
              <RecoverOutlined
                style="stroke-width: 7; transform: translate(0.5px, -0.8px)"
              />
            </el-icon>
            <el-icon
              v-else-if="item.flowStatus == 'back'"
              class="ele-workflow-process-activity-item-icon is-back"
            >
              <RollbackOutlined
                style="stroke-width: 7; transform: translate(-0.2px, -0.7px)"
              />
            </el-icon>
            <el-icon
              v-else-if="
                item.flowStatus == 'invalid' || item.flowStatus == 'termination'
              "
              class="ele-workflow-process-activity-item-icon is-invalid"
            >
              <CloseOutlined style="stroke-width: 8" />
            </el-icon>
          </div>
          <!-- 连接线 -->
          <div class="ele-workflow-process-activity-item-line"></div>
        </div>
        <div class="ele-workflow-process-activity-item-body">
          <!-- 节点名称 -->
          <div class="ele-workflow-process-activity-item-name">
            <div>{{ item.nodeName }}</div>
            <div class="ele-workflow-process-activity-item-time">
              {{ item.updateTime }}
            </div>
          </div>
          <!-- 审批人 -->
          <div class="ele-workflow-process-activity-item-text">
            <span v-if="item.flowStatus == 'copy'">
              <span>抄送</span>
              <span>{{ item.approveName.split(',').length }}</span>
              <span>人</span>
            </span>
            <template v-else-if="item.approver.includes(',')">
              <span>{{ item.approver.split(',').length }}</span>
              <span>人审批</span>
            </template>
            <template v-else>
              <span>{{ item.approveName }}</span>
              <span
                v-if="
                  item.flowStatus == 'waiting' &&
                  data &&
                  data[index + 1]?.flowStatus !== 'back'
                "
              >
                （审批中）
              </span>
              <span
                v-else-if="
                  data && index < data.length - 1 && item.flowStatus == 'pass'
                "
              >
                （已同意）
              </span>
              <span v-else-if="item.flowStatus == 'transfer'">（转交）</span>
              <span v-else-if="item.flowStatus == 'back'">（驳回）</span>
              <span v-else-if="item.flowStatus == 'invalid'">（作废）</span>
              <span v-else-if="item.flowStatus == 'termination'">（终止）</span>
            </template>
          </div>
          <!-- 多人列表 -->
          <div
            v-if="item.flowStatus == 'copy' || item.approver.includes(',')"
            class="ele-workflow-process-activity-item-users"
          >
            <div
              v-for="u in item.approveName.split(',')"
              :key="u"
              class="ele-workflow-process-activity-item-user"
            >
              <div class="ele-workflow-process-activity-item-user-avatar">
                <div>{{ getNameAvatar(u) }}</div>
              </div>
              <div class="ele-workflow-process-activity-item-user-name">
                {{ u }}
              </div>
            </div>
          </div>
          <!-- 备注 -->
          <div
            v-if="item.message && item.flowStatus !== 'copy'"
            class="ele-workflow-process-activity-item-content"
          >
            {{ item.message }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
  import { Promotion, Avatar } from '@element-plus/icons-vue';
  import {
    CheckOutlined,
    EllipsisOutlined,
    RecoverOutlined,
    LoadingDotOutlined,
    CloseOutlined,
    RollbackOutlined
  } from 'ele-admin-plus/es/icons';

  defineOptions({ name: 'ProcessActivities' });

  defineProps({
    /** 数据 */
    data: Array
  });

  /** 获取名称头像 */
  const getNameAvatar = (name) => {
    return name && name.length > 2 ? name.substring(name.length - 2) : name;
  };
</script>
