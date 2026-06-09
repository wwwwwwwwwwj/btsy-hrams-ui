<!-- 编辑弹窗 -->
<template>
  <ele-modal
    :form="true"
    :width="460"
    :title="isUpdate ? '修改流程分类' : '添加流程分类'"
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
      <el-form-item label="上级分类" prop="parentId">
        <category-select v-model="form.parentId" />
      </el-form-item>
      <el-form-item label="分类名称" prop="categoryName">
        <el-input
          clearable
          v-model="form.categoryName"
          placeholder="请输入分类名称"
        />
      </el-form-item>
      <el-form-item label="排序" prop="orderNum">
        <el-input-number
          :min="0"
          :max="99999"
          v-model="form.orderNum"
          placeholder="请输入排序"
          controls-position="right"
          class="ele-fluid"
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
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { useFormData } from '@/utils/use-form-data';
  import CategorySelect from './category-select.vue';
  import { addCategory, updateCategory } from '@/api/workflow/category';

  const props = defineProps({
    /** 修改回显的数据 */
    data: Object,
    /** 上级id */
    parentId: [Number, String]
  });

  const emit = defineEmits({
    done: () => true
  });

  const { modalProps, closeModal } = useModal();

  /** 是否是修改 */
  const isUpdate = ref(false);

  /** 提交状态 */
  const loading = ref(false);

  /** 表单组件 */
  const formRef = ref(null);

  /** 表单数据 */
  const [form, _resetFields, assignFields] = useFormData({
    categoryId: void 0,
    parentId: props.parentId,
    categoryName: '',
    orderNum: void 0
  });

  /** 表单验证规则 */
  const rules = reactive({
    parentId: [
      {
        required: true,
        message: '请选择上级分类',
        trigger: 'change'
      }
    ],
    categoryName: [
      {
        required: true,
        message: '请输入分类名称',
        trigger: 'blur'
      }
    ],
    orderNum: [
      {
        required: true,
        message: '请输入排序',
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
      loading.value = true;
      const saveOrUpdate = isUpdate.value ? updateCategory : addCategory;
      saveOrUpdate({ ...form, parentId: form.parentId || 0 })
        .then((msg) => {
          loading.value = false;
          EleMessage.success({ message: msg, plain: true });
          handleCancel();
          emit('done');
        })
        .catch((e) => {
          loading.value = false;
          EleMessage.error({ message: e.message, plain: true });
        });
    });
  };

  /** 监听弹窗打开 */
  if (props.data) {
    assignFields({
      ...props.data,
      parentId: props.data.parentId || void 0
    });
    isUpdate.value = true;
  }
</script>
