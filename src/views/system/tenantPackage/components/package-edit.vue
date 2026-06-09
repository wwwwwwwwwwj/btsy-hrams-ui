<!-- 编辑弹窗 -->
<template>
  <ele-modal
    :form="true"
    :width="460"
    :title="isUpdate ? '修改租户套餐' : '添加租户套餐'"
    :loading="loading"
    v-bind="modalProps"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      @submit.prevent=""
    >
      <el-form-item label="套餐名称" prop="packageName">
        <el-input
          clearable
          v-model="form.packageName"
          placeholder="请输入套餐名称"
        />
      </el-form-item>
      <el-form-item label="菜单权限">
        <ele-loading :loading="menuLoading" class="package-menu-tree">
          <div style="line-height: 1; padding: 0 6px 0 0">
            <el-button
              class="ele-btn-icon"
              size="small"
              style="margin: 0 0 6px 6px"
              @click="expandAll"
            >
              展开全部
            </el-button>
            <el-button
              class="ele-btn-icon"
              size="small"
              style="margin: 0 0 6px 6px"
              @click="foldAll"
            >
              折叠全部
            </el-button>
            <el-button
              class="ele-btn-icon"
              size="small"
              style="margin: 0 0 6px 6px"
              @click="checkAll"
            >
              全选
            </el-button>
            <el-button
              class="ele-btn-icon"
              size="small"
              style="margin: 0 0 6px 6px"
              @click="checkOutAll"
            >
              取消全选
            </el-button>
          </div>
          <div style="height: 260px; overflow: auto; padding: 0 6px">
            <el-tree
              ref="treeRef"
              show-checkbox
              node-key="id"
              :data="menuData"
              :default-checked-keys="checkedKeys"
            />
          </div>
        </ele-loading>
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          :rows="3"
          type="textarea"
          v-model="form.remark"
          placeholder="请输入备注"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <btn-items
        :items="[
          { preset: 'cancel', onClick: () => handleCancel() },
          { preset: 'save', onClick: () => handleSave() }
        ]"
      />
    </template>
  </ele-modal>
</template>

<script setup>
  import { ref, reactive } from 'vue';
  import { EleMessage, useModal, eachTree } from 'ele-admin-plus';
  import { useFormData } from '@/utils/use-form-data';
  import {
    addTenantPackage,
    updateTenantPackage,
    listTenantPackageMenu
  } from '@/api/system/tenant-package';

  const props = defineProps({
    /** 修改回显的数据 */
    data: Object
  });

  const emit = defineEmits({
    done: () => true
  });

  const { modalProps, closeModal } = useModal();

  /** 菜单树组件 */
  const treeRef = ref(null);

  /** 菜单数据 */
  const menuData = ref([]);

  /** 菜单数据请求状态 */
  const menuLoading = ref(false);

  /** 菜单回显选中 */
  const checkedKeys = ref([]);

  /** 是否是修改 */
  const isUpdate = ref(false);

  /** 提交状态 */
  const loading = ref(false);

  /** 表单组件 */
  const formRef = ref(null);

  /** 表单数据 */
  const [form, _resetFields, assignFields] = useFormData({
    packageId: void 0,
    packageName: '',
    remark: ''
  });

  /** 表单验证规则 */
  const rules = reactive({
    packageName: [
      {
        required: true,
        message: '请输入套餐名称',
        type: 'string',
        trigger: 'blur'
      }
    ]
  });

  /** 关闭弹窗 */
  const handleCancel = () => {
    closeModal();
  };

  /** 保存编辑 */
  const handleSave = () => {
    formRef.value?.validate?.((valid) => {
      if (!valid) {
        return;
      }
      const menuIds =
        (treeRef.value?.getCheckedKeys?.() ?? []).concat(
          treeRef.value?.getHalfCheckedKeys?.() ?? []
        ) ?? [];
      loading.value = true;
      const saveOrUpdate = isUpdate.value
        ? updateTenantPackage
        : addTenantPackage;
      saveOrUpdate({ ...form, menuIds })
        .then((msg) => {
          loading.value = false;
          EleMessage.success({ message: msg, plain: true });
          emit('done');
          handleCancel();
        })
        .catch((e) => {
          loading.value = false;
          EleMessage.error({ message: e.message, plain: true });
        });
    });
  };

  /** 展开全部 */
  const expandAll = () => {
    eachTree(menuData.value, (d) => {
      const node = treeRef.value?.getNode?.(d);
      node && node.expand(null, false);
    });
  };

  /** 折叠全部 */
  const foldAll = () => {
    eachTree(menuData.value, (d) => {
      const node = treeRef.value?.getNode?.(d);
      node && node.collapse();
    });
  };

  /** 全选 */
  const checkAll = () => {
    const keys = [];
    eachTree(menuData.value, (d) => {
      keys.push(d.id);
    });
    treeRef.value?.setCheckedKeys?.(keys);
  };

  /** 取消全选 */
  const checkOutAll = () => {
    treeRef.value?.setCheckedKeys?.([]);
  };

  /** 查询菜单数据 */
  const query = () => {
    menuData.value = [];
    checkedKeys.value = [];
    menuLoading.value = true;
    listTenantPackageMenu(props.data?.packageId)
      .then((result) => {
        menuLoading.value = false;
        menuData.value = result.menus;
        const cks = [];
        eachTree(menuData.value, (d) => {
          if (!d.children?.length && result.checkedKeys?.includes?.(d.id)) {
            cks.push(d.id);
          }
        });
        checkedKeys.value = cks;
      })
      .catch((e) => {
        menuLoading.value = false;
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 修改赋值 */
  if (props.data) {
    assignFields(props.data);
    isUpdate.value = true;
  }

  query();
</script>

<style lang="scss" scoped>
  .package-menu-tree {
    width: 100%;
    padding: 6px 0;
    border: 1px solid var(--el-border-color);
    border-radius: var(--el-border-radius-base);
    box-sizing: border-box;
    overflow: hidden;
  }
</style>
