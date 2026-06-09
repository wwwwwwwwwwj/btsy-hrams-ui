<!-- 编辑弹窗 -->
<template>
  <ele-modal
    :form="true"
    :width="680"
    :title="isUpdate ? '修改流程 spel 表达式定义' : '添加流程 spel 表达式定义'"
    :loading="loading"
    v-bind="modalProps"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="98px"
      @submit.prevent=""
    >
      <el-form-item prop="componentName">
        <template #label>
          <ele-tooltip
            content="注册到Spring容器中的组件名，如：spelRuleComponent"
            placement="top-start"
            :popper-options="{
              modifiers: [{ name: 'offset', options: { offset: [-12, 10] } }]
            }"
          >
            <el-icon
              :size="13"
              style="align-self: center; margin-right: 4px; cursor: help"
            >
              <QuestionCircleOutlined style="opacity: 0.6" />
            </el-icon>
          </ele-tooltip>
          <span>组件名称</span>
        </template>
        <el-input
          clearable
          v-model="form.componentName"
          placeholder="请输入组件名称"
        />
      </el-form-item>
      <el-form-item prop="methodName">
        <template #label>
          <ele-tooltip
            content="组件中的方法名称，如：selectDeptLeaderById"
            placement="top-start"
            :popper-options="{
              modifiers: [{ name: 'offset', options: { offset: [-12, 10] } }]
            }"
          >
            <el-icon
              :size="13"
              style="align-self: center; margin-right: 4px; cursor: help"
            >
              <QuestionCircleOutlined style="opacity: 0.6" />
            </el-icon>
          </ele-tooltip>
          <span>方法名称</span>
        </template>
        <el-input
          clearable
          v-model="form.methodName"
          placeholder="请输入方法名称"
        />
      </el-form-item>
      <el-form-item prop="methodParams">
        <template #label>
          <ele-tooltip
            content="方法参数，如：deptId, 多个使用 ',' 分隔，单参数变量仅支持单个方法参数"
            placement="top-start"
            :popper-options="{
              modifiers: [{ name: 'offset', options: { offset: [-12, 10] } }]
            }"
          >
            <el-icon
              :size="13"
              style="align-self: center; margin-right: 4px; cursor: help"
            >
              <QuestionCircleOutlined style="opacity: 0.6" />
            </el-icon>
          </ele-tooltip>
          <span>方法参数</span>
        </template>
        <el-input
          clearable
          v-model="form.methodParams"
          placeholder="请输入方法参数"
        />
      </el-form-item>
      <el-form-item label="SPEL表达式">
        <el-tag
          size="large"
          type="info"
          :disable-transitions="true"
          style="
            white-space: normal;
            height: auto;
            line-height: 1.5;
            padding: 5px 8px;
            display: block;
            width: 100%;
          "
        >
          {{
            form.viewSpel || '例如：#{@组件名.方法名(#方法参数)} 或 ${方法参数}'
          }}
        </el-tag>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <dict-data
          code="sys_normal_disable"
          type="radio"
          v-model="form.status"
        />
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
  import { ref, reactive, watch } from 'vue';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { QuestionCircleOutlined } from '@/components/icons';
  import { useFormData } from '@/utils/use-form-data';
  import { addSpel, updateSpel } from '@/api/workflow/spel';

  const props = defineProps({
    /** 修改回显的数据 */
    data: Object
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
    id: void 0,
    componentName: '',
    methodName: '',
    methodParams: '',
    viewSpel: '',
    status: void 0,
    remark: ''
  });

  /** 表单验证规则 */
  const rules = reactive({
    status: [
      {
        required: true,
        message: '请选择状态',
        trigger: 'change'
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
      const saveOrUpdate = isUpdate.value ? updateSpel : addSpel;
      saveOrUpdate(form)
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

  /** 更新 spel 预览值 */
  watch(
    [() => form.componentName, () => form.methodName, () => form.methodParams],
    () => {
      const comp = (form.componentName || '').trim();
      const method = (form.methodName || '').trim();
      const paramStr = (form.methodParams || '').trim();
      if (!comp && !method && !paramStr) {
        form.viewSpel = '';
        return;
      }
      // 替换变量值：只有参数存在，组件和方法都不存在
      if (!comp && !method && paramStr) {
        const paramList = paramStr
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p.length > 0);
        if (paramList.length === 1) {
          form.viewSpel = `\${${paramList[0]}}`;
          return;
        }
      }
      // 如果缺少组件或方法，提示填写
      if (!comp || !method) {
        form.viewSpel = '请填写组件名称和方法名';
        return;
      }
      let paramList = [];
      if (paramStr) {
        // 分割并过滤掉空参数
        paramList = paramStr
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p.length > 0);
      }
      const paramPart =
        paramList.length > 0
          ? '(' + paramList.map((p) => `#${p}`).join(',') + ')'
          : '()';
      form.viewSpel = `#{@${comp}.${method}${paramPart}}`;
    }
  );

  /** 修改赋值 */
  if (props.data) {
    assignFields(props.data);
    isUpdate.value = true;
  }
</script>
