import { download } from '@/utils/common';
export { templateEngine } from 'ele-admin-plus/es/ele-pro-form-builder/components/code-util';

/**
 * 页面生成模板
 */
export const indexTemplate = `<template>
  <ele-page>
    <!-- 搜索表单 -->
    <<% d.modelName %>-search @search="(where) => reload(where, 1)" />
    <ele-card bordered :body-style="{ paddingTop: '8px' }">
      <!-- 表格 -->
      <ele-pro-table
        ref="tableRef"
        row-key="<% d.primaryKey %>"
        :columns="columns"
        :datasource="datasource"
        :show-overflow-tooltip="true"
        :highlight-current-row="true"
        v-model:selections="selections"
        :export-config="{ fileName: '<% d.modelText %>' }"
      >
        <template #toolbar>
          <btn-items
            :items="[
              {
                preset: 'add',
                permission: '<% d.moduleName %>:<% d.modelName %>:add',
                onClick: () => handleEdit()
              },
              {
                preset: 'del',
                permission: '<% d.moduleName %>:<% d.modelName %>:remove',
                onClick: () => handleRemove()
              },
              {
                preset: 'export',
                permission: '<% d.moduleName %>:<% d.modelName %>:export',
                onClick: () => handleExport()
              }
            ]"
          />
        </template>
        <template #action="{ row }">
          <btn-items
            :divider="true"
            type="link"
            :items="[
              {
                preset: 'edit',
                permission: '<% d.moduleName %>:<% d.modelName %>:edit',
                onClick: () => handleEdit(row)
              },
              {
                preset: 'del',
                permission: '<% d.moduleName %>:<% d.modelName %>:remove',
                onClick: () => handleRemove(row)
              }
            ]"
          />
        </template><%# d.columns.forEach(function(item){if(item.dictType){ %>
        <template #<% item.prop %>="{ row }">
          <dict-data
            code="<% item.dictType %>"
            type="tag"
            :model-value="row.<% item.prop %>"
          />
        </template><%# }else if(item.formType==='imageUpload'){ %>
        <template #<% item.prop %>="{ row }">
          <image-upload
            :limit="1"
            :readonly="true"
            :model-value="row.<% item.prop %>"
            :item-style="{ width: '32px', height: '32px', padding: 0 }"
          />
        </template><%# }}); %>
      </ele-pro-table>
    </ele-card>
  </ele-page>
</template>

<script setup>
  import { ref } from 'vue';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import <% d.modelTypeName %>Search from './components/<% d.modelName %>-search.vue';
  import { page<% d.modelTypeName %>s, remove<% d.modelTypeName %>s, export<% d.modelTypeName %>s } from '@/api/<% d.moduleName %>/<% d.modelName %>';

  defineOptions({ name: '<% d.moduleTypeName %><% d.modelTypeName %>' });

  const { openModal } = useModal();

  /** 表格组件 */
  const tableRef = ref(null);

  /** 表格列配置 */
  const columns = ref([
    {
      type: 'selection',
      columnKey: 'selection',
      width: 50,
      align: 'center',
      showOverflowTooltip: false,
      fixed: 'left'
    },
    {
      type: 'index',
      columnKey: 'index',
      width: 50,
      align: 'center',
      fixed: 'left'
    }<%# d.columns.forEach(function(item){ %>,
    {
      prop: '<% item.prop %>',
      label: '<% item.label %>',
      align: 'center',
      minWidth: 110<%# if(item.dictType || item.formType==='imageUpload'){ %>,
      slot: '<% item.prop %>'<%# } %>
    }<%# }); %>,
    {
      columnKey: 'action',
      label: '操作',
      width: 156,
      align: 'center',
      slot: 'action',
      hideInPrint: true,
      hideInExport: true,
      fixed: 'right'
    }
  ]);

  /** 表格选中数据 */
  const selections = ref([]);

  /** 表格数据源 */
  const datasource = ({ pages, where }) => {
    return page<% d.modelTypeName %>s({ ...where, ...pages });
  };

  /** 搜索 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 打开编辑弹窗 */
  const handleEdit = (row) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/<% d.modelName %>-edit.vue'),
      componentProps: { data: row, onDone: () => reload() }
    });
  };

  /** 删除 */
  const handleRemove = (row) => {
    const rows = row == null ? selections.value : [row];
    if (!rows.length) {
      EleMessage.error({ message: '请至少选择一条数据', plain: true });
      return;
    }
    ElMessageBox.confirm(
      \`是否确认删除<% d.delTipName %>为"\${rows.map((d) => d.<% d.delTipKey %>).join()}"的数据项?\`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({ message: '请求中..', plain: true });
        remove<% d.modelTypeName %>s(rows.map((d) => d.<% d.primaryKey %>))
          .then(() => {
            loading.close();
            EleMessage.success({ message: '删除成功', plain: true });
            reload();
          })
          .catch((e) => {
            loading.close();
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };

  /** 导出数据 */
  const handleExport = () => {
    const loading = EleMessage.loading({ message: '请求中..', plain: true });
    tableRef.value?.fetch?.(({ where, pages }) => {
      export<% d.modelTypeName %>s({ ...where, ...pages })
        .then(() => {
          loading.close();
        })
        .catch((e) => {
          loading.close();
          EleMessage.error({ message: e.message, plain: true });
        });
    });
  };
</script>
`;

/**
 * 搜索表单生成模板
 */
export const searchTemplate = `<!-- 搜索表单 -->
<template>
  <ele-card bordered :search-form="true">
    <el-form label-width="72px" @keyup.enter="handleSearch" @submit.prevent="">
      <el-row :gutter="16"><%# d.queryForm.forEach(function(item){ %>
        <el-col :lg="6" :md="12" :sm="12" :xs="24">
          <el-form-item label="<% item.label %>">
            <%# if(item.dictType){ %><dict-data
              code="<% item.dictType %>"
              v-model="form.<% item.prop %>"
              placeholder="请选择"
            /><%# }else{ %><el-input
              clearable
              v-model.trim="form.<% item.prop %>"
              placeholder="请输入"
            /><%# } %>
          </el-form-item>
        </el-col><%# }); %>
        <el-col :lg="6" :md="12" :sm="12" :xs="24">
          <el-form-item label-width="0px">
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </ele-card>
</template>

<script setup>
  import { useFormData } from '@/utils/use-form-data';

  const emit = defineEmits(['search']);

  /** 表单数据 */
  const [form, resetFields] = useFormData({<%# d.queryForm.forEach(function(item,i){ %>
    <% item.prop %>: <% item.isString ? "''" : 'void 0' %><% i === (d.queryForm.length - 1) ? '' : ',' %><%# }); %>
  });

  /** 搜索 */
  const handleSearch = () => {
    emit('search', { ...form });
  };

  /** 重置 */
  const handleReset = () => {
    resetFields();
    handleSearch();
  };
</script>
`;

/**
 * 编辑弹窗生成模板
 */
export const editTemplate = `<!-- 编辑弹窗 -->
<template>
  <ele-modal
    :form="true"
    :width="460"
    :title="isUpdate ? '修改<% d.modelText %>' : '添加<% d.modelText %>'"
    :loading="loading"
    v-bind="modalProps"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      @submit.prevent=""
    ><%# d.editForm.forEach(function(item){ %>
      <el-form-item label="<% item.label %>" prop="<% item.prop %>">
        <%# if(item.dictType){ %><dict-data
          code="<% item.dictType %>"<%# if(['radio','checkbox'].includes(item.formType)){ %>
          type="<% item.formType %>"<%# } %>
          v-model="form.<% item.prop %>"
        /><%# }else if(item.formType==='textarea'){ %><el-input
          :rows="4"
          type="textarea"
          v-model="form.<% item.prop %>"
          placeholder="请输入<% item.label %>"
        /><%# }else if(item.formType==='datetime'){ %><el-date-picker
          v-model="form.<% item.prop %>"
          value-format="YYYY-MM-DD"
          placeholder="请选择<% item.label %>"
          class="ele-fluid"
        /><%# }else if(item.formType==='editor'){ %><tinymce-editor
          v-model="form.<% item.prop %>"
          :init="{ height: 440, menubar: false }"
        /><%# }else if(item.formType==='imageUpload'){ %><image-upload
          v-model="form.<% item.prop %>"
          :limit="1"
        /><%# }else if(item.formType==='fileUpload'){ %><file-upload
          v-model="form.<% item.prop %>"
          :limit="1"
        /><%# }else{ %><el-input
          clearable
          v-model="form.<% item.prop %>"
          placeholder="请输入<% item.label %>"
        /><%# } %>
      </el-form-item><%# }); %>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </ele-modal>
</template>

<script setup>
  import { ref, reactive } from 'vue';
  import { EleMessage, useModal } from 'ele-admin-plus';
  import { useFormData } from '@/utils/use-form-data';
  import { add<% d.modelTypeName %>, update<% d.modelTypeName %> } from '@/api/<% d.moduleName %>/<% d.modelName %>';

  const props = defineProps({
    /** 修改回显的数据 */
    data: Object
  });

  const emit = defineEmits(['done']);

  const { modalProps, closeModal } = useModal();

  /** 是否是修改 */
  const isUpdate = ref(false);

  /** 提交状态 */
  const loading = ref(false);

  /** 表单组件 */
  const formRef = ref(null);

  /** 表单数据 */
  const [form, _resetFields, assignFields] = useFormData({
    <% d.primaryKey %>: void 0<%# d.editForm.forEach(function(item){ %>,
    <% item.prop %>: <% item.isString ? "''" : 'void 0' %><%# }); %>
  });

  /** 表单验证规则 */
  const rules = reactive({<%# d.editRules.forEach(function(item,i){ %>
    <% item.prop %>: [
      {
        required: true,
        message: '请输入<% item.label %>',
        type: '<% item.type %>',
        trigger: '<% item.trigger %>'
      }
    ]<% i === (d.editRules.length - 1) ? '' : ',' %><%# }); %>
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
      const saveOrUpdate = isUpdate.value ? update<% d.modelTypeName %> : add<% d.modelTypeName %>;
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

  /** 修改赋值 */
  if (props.data) {
    assignFields(props.data);
    isUpdate.value = true;
  }
</script>
`;

/**
 * 接口生成模板
 */
export const apiTemplate = `import request from '@/utils/request';
import { download, toFormData, checkDownloadRes } from '@/utils/common';

/**
 * 分页查询<% d.modelText %>
 */
export async function page<% d.modelTypeName %>s(params) {
  const res = await request.get('/<% d.moduleName %>/<% d.modelName %>/list', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 查询全部<% d.modelText %>
 */
export async function list<% d.modelTypeName %>s(params) {
  const res = await request.get('/<% d.moduleName %>/<% d.modelName %>/list', { params });
  if (res.data.code === 200 && res.data.data) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 根据id查询<% d.modelText %>
 */
export async function get<% d.modelTypeName %>(id) {
  const res = await request.get('/<% d.moduleName %>/<% d.modelName %>/' + id);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 添加<% d.modelText %>
 */
export async function add<% d.modelTypeName %>(data) {
  const res = await request.post('/<% d.moduleName %>/<% d.modelName %>', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 修改<% d.modelText %>
 */
export async function update<% d.modelTypeName %>(data) {
  const res = await request.put('/<% d.moduleName %>/<% d.modelName %>', data);
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 删除<% d.modelText %>
 */
export async function remove<% d.modelTypeName %>s(ids) {
  const res = await request.delete('/<% d.moduleName %>/<% d.modelName %>/' + ids.join());
  if (res.data.code === 200) {
    return res.data.msg;
  }
  return Promise.reject(new Error(res.data.msg));
}

/**
 * 导出<% d.modelText %>
 */
export async function export<% d.modelTypeName %>s(params) {
  const res = await request({
    url: '/<% d.moduleName %>/<% d.modelName %>/export',
    method: 'POST',
    data: toFormData(params),
    responseType: 'blob'
  });
  await checkDownloadRes(res);
  download(res.data, \`<% d.modelName %>_\${Date.now()}.xlsx\`);
}
`;

/**
 * 树表页面生成模板
 */
export const indexTreeTemplate = `<template>
  <ele-page>
    <!-- 搜索表单 -->
    <<% d.modelName %>-search @search="(where) => reload(where, 1)" />
    <ele-card bordered :body-style="{ paddingTop: '8px' }">
      <!-- 表格 -->
      <ele-pro-table
        ref="tableRef"
        row-key="<% d.primaryKey %>"
        :columns="columns"
        :datasource="datasource"
        :show-overflow-tooltip="true"
        :highlight-current-row="true"
        :export-config="{ fileName: '<% d.modelText %>' }"
        :default-expand-all="true"
        :pagination="false"
        :sticky="true"
      >
        <template #toolbar>
          <btn-items
            :items="[
              {
                preset: 'add',
                permission: '<% d.moduleName %>:<% d.modelName %>:add',
                onClick: () => handleEdit()
              },
              { preset: 'expand', onClick: () => handleExpandAll() },
              { preset: 'fold', onClick: () => handleFoldAll() }
            ]"
          />
        </template>
        <template #action="{ row }">
          <btn-items
            :divider="true"
            type="link"
            :items="[
              {
                preset: 'add',
                permission: '<% d.moduleName %>:<% d.modelName %>:add',
                onClick: () => handleEdit(null, row.id)
              },
              {
                preset: 'edit',
                permission: '<% d.moduleName %>:<% d.modelName %>:edit',
                onClick: () => handleEdit(row)
              },
              {
                preset: 'del',
                permission: '<% d.moduleName %>:<% d.modelName %>:remove',
                onClick: () => handleRemove(row)
              }
            ]"
          />
        </template><%# d.columns.forEach(function(item){if(item.dictType){ %>
        <template #<% item.prop %>="{ row }">
          <dict-data
            code="<% item.dictType %>"
            type="tag"
            :model-value="row.<% item.prop %>"
          />
        </template><%# }else if(item.formType==='imageUpload'){ %>
        <template #<% item.prop %>="{ row }">
          <image-upload
            :limit="1"
            :readonly="true"
            :model-value="row.<% item.prop %>"
            :item-style="{ width: '32px', height: '32px', padding: 0 }"
          />
        </template><%# }}); %>
      </ele-pro-table>
    </ele-card>
  </ele-page>
</template>

<script setup>
  import { ref } from 'vue';
  import { ElMessageBox } from 'element-plus';
  import { EleMessage, useModal, toTree } from 'ele-admin-plus';
  import <% d.modelTypeName %>Search from './components/<% d.modelName %>-search.vue';
  import { list<% d.modelTypeName %>s, remove<% d.modelTypeName %> } from '@/api/<% d.moduleName %>/<% d.modelName %>';

  defineOptions({ name: '<% d.moduleTypeName %><% d.modelTypeName %>' });

  const { openModal } = useModal();

  /** 表格组件 */
  const tableRef = ref(null);

  /** 表格列配置 */
  const columns = ref([
    {
      type: 'index',
      columnKey: 'index',
      width: 50,
      align: 'center',
      fixed: 'left'
    }<%# d.columns.forEach(function(item,columnItemIndex){ %>,
    {
      prop: '<% item.prop %>',
      label: '<% item.label %>',
      align: '<% columnItemIndex==0?'left':'center' %>',
      minWidth: 110<%# if(item.dictType || item.formType==='imageUpload'){ %>,
      slot: '<% item.prop %>'<%# } %>
    }<%# }); %>,
    {
      columnKey: 'action',
      label: '操作',
      width: 180,
      align: 'center',
      slot: 'action',
      hideInPrint: true,
      hideInExport: true,
      fixed: 'right'
    }
  ]);

  /** 表格数据源 */
  const datasource = async ({ where }) => {
    const data = await list<% d.modelTypeName %>s({ ...where });
    return toTree({
      data,
      idField: '<% d.treeCode %>',
      parentIdField: '<% d.treeParentCode %>'
    });
  };

  /** 搜索 */
  const reload = (where, page) => {
    tableRef.value?.reload?.({ where, page });
  };

  /** 打开编辑弹窗 */
  const handleEdit = (row, id) => {
    openModal({
      custom: true,
      asyncComponent: () => import('./components/<% d.modelName %>-edit.vue'),
      componentProps: { data: row, parentId: id, onDone: () => reload() }
    });
  };

  /** 删除 */
  const handleRemove = (row) => {
    ElMessageBox.confirm(<%# var delTipKeyTplStr = '\${row.'+d.delTipKey+'}'; %>
      \`是否确认删除<% d.delTipName %>为"<% delTipKeyTplStr %>"的数据项?\`,
      '系统提示',
      { type: 'warning', draggable: true }
    )
      .then(() => {
        const loading = EleMessage.loading({ message: '请求中..', plain: true });
        remove<% d.modelTypeName %>([row.<% d.primaryKey %>])
          .then(() => {
            loading.close();
            EleMessage.success({ message: '删除成功', plain: true });
            reload();
          })
          .catch((e) => {
            loading.close();
            EleMessage.error({ message: e.message, plain: true });
          });
      })
      .catch(() => {});
  };

  /** 展开全部 */
  const handleExpandAll = () => {
    tableRef.value?.toggleRowExpansionAll?.(true);
  };

  /** 折叠全部 */
  const handleFoldAll = () => {
    tableRef.value?.toggleRowExpansionAll?.(false);
  };
</script>
`;

/**
 * 树表编辑弹窗生成模板
 */
export const editTreeTemplate = `<!-- 编辑弹窗 -->
<template>
  <ele-modal
    :form="true"
    :width="460"
    :title="isUpdate ? '修改<% d.modelText %>' : '添加<% d.modelText %>'"
    :loading="loading"
    v-bind="modalProps"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      @submit.prevent=""
    ><%# d.editForm.forEach(function(item){ %>
      <el-form-item label="<% item.label %>" prop="<% item.prop %>">
        <%# if(item.prop==d.treeParentCode){ %><el-tree-select
          clearable
          check-strictly
          default-expand-all
          :data="treeSelectData"
          node-key="<% d.treeCode %>"
          :props="{ label: '<% d.treeName %>' }"
          placeholder="请选择<% item.label %>"
          class="ele-fluid"
          v-model="form.<% item.prop %>"
        /><%# }else if(item.dictType){ %><dict-data
          code="<% item.dictType %>"<%# if(['radio','checkbox'].includes(item.formType)){ %>
          type="<% item.formType %>"<%# } %>
          v-model="form.<% item.prop %>"
        /><%# }else if(item.formType==='textarea'){ %><el-input
          :rows="4"
          type="textarea"
          v-model="form.<% item.prop %>"
          placeholder="请输入<% item.label %>"
        /><%# }else if(item.formType==='datetime'){ %><el-date-picker
          v-model="form.<% item.prop %>"
          value-format="YYYY-MM-DD"
          placeholder="请选择<% item.label %>"
          class="ele-fluid"
        /><%# }else if(item.formType==='editor'){ %><tinymce-editor
          v-model="form.<% item.prop %>"
          :init="{ height: 440, menubar: false }"
        /><%# }else if(item.formType==='imageUpload'){ %><image-upload
          v-model="form.<% item.prop %>"
          :limit="1"
        /><%# }else if(item.formType==='fileUpload'){ %><file-upload
          v-model="form.<% item.prop %>"
          :limit="1"
        /><%# }else{ %><el-input
          clearable
          v-model="form.<% item.prop %>"
          placeholder="请输入<% item.label %>"
        /><%# } %>
      </el-form-item><%# }); %>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </ele-modal>
</template>

<script setup>
  import { ref, reactive } from 'vue';
  import { EleMessage, useModal, toTree } from 'ele-admin-plus';
  import { useFormData } from '@/utils/use-form-data';
  import { add<% d.modelTypeName %>, update<% d.modelTypeName %>, list<% d.modelTypeName %>s } from '@/api/<% d.moduleName %>/<% d.modelName %>';

  const props = defineProps({
    /** 修改回显的数据 */
    data: Object,
    /** 添加时默认选中的上级id */
    parentId: [Number, String]
  });

  const emit = defineEmits(['done']);

  const { modalProps, closeModal } = useModal();

  /** 是否是修改 */
  const isUpdate = ref(false);

  /** 提交状态 */
  const loading = ref(false);

  /** 表单组件 */
  const formRef = ref(null);

  /** 表单数据 */
  const [form, _resetFields, assignFields] = useFormData({
    <% d.primaryKey %>: void 0<%# d.editForm.forEach(function(item){ %>,
    <% item.prop %>: <% item.isString ? "''" : 'void 0' %><%# }); %>
  });

  /** 表单验证规则 */
  const rules = reactive({<%# d.editRules.forEach(function(item,i){ %>
    <% item.prop %>: [
      {
        required: true,
        message: '请输入<% item.label %>',
        type: '<% item.type %>',
        trigger: '<% item.trigger %>'
      }
    ]<% i === (d.editRules.length - 1) ? '' : ',' %><%# }); %>
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
      const saveOrUpdate = isUpdate.value ? update<% d.modelTypeName %> : add<% d.modelTypeName %>;
      saveOrUpdate({ ...form, <% d.treeParentCode %>: form.parentId || 0 })
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

  /** 修改赋值 */
  if (props.data) {
    assignFields({
      ...props.data,
      <% d.treeParentCode %>: props.data.parentId || void 0
    });
    isUpdate.value = true;
  } else {
    form.<% d.treeParentCode %> = props.parentId;
  }

  /** 下拉树数据 */
  const treeSelectData = ref([]);

  /** 获取下拉树数据 */
  list<% d.modelTypeName %>s()
    .then((list) => {
      treeSelectData.value = toTree({
        data: list,
        idField: '<% d.treeCode %>',
        parentIdField: '<% d.treeParentCode %>'
      });
    })
    .catch((e) => {
      EleMessage.error({ message: e.message, plain: true });
    });
</script>
`;

/**
 * 获取模板数据
 * @param res 接口数据
 */
export function getTemplateData(res) {
  const primaryField = {};
  const columns = [];
  const queryForm = [];
  const editForm = [];
  const editRules = [];
  const treeOption = {};
  (res.info.columns || []).forEach((col) => {
    if (col.isPk == '1') {
      primaryField.prop = col.javaField;
      primaryField.label = col.columnComment;
    }
    if (col.isList == '1') {
      columns.push({
        prop: col.javaField,
        label: col.columnComment,
        dictType: col.dictType
      });
    }
    if (col.isQuery == '1') {
      queryForm.push({
        prop: col.javaField,
        label: col.columnComment,
        dictType: col.dictType,
        isString: ['String', 'Date'].includes(col.javaType ?? '')
      });
    }
    if (col.isEdit == '1') {
      editForm.push({
        prop: col.javaField,
        label: col.columnComment,
        dictType: col.dictType,
        formType: col.htmlType,
        isString: ['String', 'Date'].includes(col.javaType ?? '')
      });
      if (col.isRequired == '1') {
        editRules.push({
          prop: col.javaField,
          label: col.columnComment,
          type: ['String', 'Date'].includes(col.javaType ?? '')
            ? 'string'
            : 'number',
          trigger: [
            'select',
            'radio',
            'checkbox',
            'imageUpload',
            'fileUpload',
            'editor'
          ].includes(col.htmlType ?? '')
            ? 'change'
            : 'blur'
        });
      }
    }
    if (res.info.treeCode && col.columnName === res.info.treeCode) {
      treeOption.treeCode = col.javaField;
    }
    if (res.info.treeParentCode && col.columnName === res.info.treeParentCode) {
      treeOption.treeParentCode = col.javaField;
    }
    if (res.info.treeName && col.columnName === res.info.treeName) {
      treeOption.treeName = col.javaField;
    }
  });
  const moduleName = res.info.moduleName;
  const modelTypeName = capitalizeStr(res.info.businessName);
  const primaryKey = primaryField.prop || 'key';
  const firstColumn = columns.length ? columns[0] : primaryField;
  const subTableInfo =
    res.info.subTableName && res.tables
      ? res.tables.find((t) => t.tableName === res.info.subTableName)
      : void 0;
  return {
    modelName: res.info.businessName, // 模型名
    modelTypeName, // 模型类型名
    modelText: res.info.functionName, // 模型显示文本
    primaryKey, // 主键名
    moduleName, // 模块名
    moduleTypeName: capitalizeStr(moduleName), // 模块类型名
    tableCacheKey: moduleName + modelTypeName + 'Table', // 表格缓存名
    columns, // 表格列
    delTipKey: firstColumn.prop || primaryKey, // 删除提示字段名
    delTipName: firstColumn.label || '', // 删除提示文本名
    queryForm, // 搜索表单
    editForm: editForm.filter((d) => d.prop !== primaryKey), // 编辑表单
    editRules, // 编辑表单验证规则
    classModelName: lowerFirstStr(res.info.className),
    subTable: subTableInfo ? getTemplateData({ info: subTableInfo }) : void 0,
    ...treeOption
  };
}

/**
 * 字符串首字母大写
 * @param str 字符串
 */
export function capitalizeStr(str) {
  if (str == null || str === '') {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 字符串首字母小写
 * @param str 字符串
 */
export function lowerFirstStr(str) {
  if (str == null || str === '') {
    return '';
  }
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * 下载文本
 * @param text 文本内容
 * @param name 文件名称
 */
export function downloadText(text, name) {
  download(text, name, 'text/plain;charset=utf-8');
}
