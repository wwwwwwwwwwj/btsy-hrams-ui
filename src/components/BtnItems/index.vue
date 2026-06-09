<!-- 操作按钮 -->
<template>
  <EleButtons v-bind="{ ...emitProps, ...$props }" :items="data">
    <template v-for="name in Object.keys($slots)" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps || {}"></slot>
    </template>
  </EleButtons>
</template>

<script setup>
  import { computed } from 'vue';
  import { mapTree, useComponentEvents } from 'ele-admin-plus';
  import {
    buttonsProps,
    buttonsEmits
  } from 'ele-admin-plus/es/ele-buttons/props';
  import { usePermission } from '@/utils/use-permission';

  defineOptions({ name: 'BtnItems' });

  const props = defineProps(buttonsProps);

  const emit = defineEmits(buttonsEmits);

  const { emitProps } = useComponentEvents(buttonsEmits, emit);

  const { hasPermission, hasAnyPermission, hasRole, hasAnyRole } =
    usePermission();

  /** 判断是否权限 */
  const isPermission = (item, permissionFilter) => {
    if (item.vIf && !item.vIf()) {
      return false;
    }
    if (
      !item.permission &&
      !item.anyPermission &&
      !item.role &&
      !item.anyRole
    ) {
      return true;
    }
    if (item.permission && hasPermission(item.permission)) {
      return true;
    }
    if (item.anyPermission && hasAnyPermission(item.anyPermission)) {
      return true;
    }
    if (item.role && hasRole(item.role)) {
      return true;
    }
    if (item.anyRole && hasAnyRole(item.anyRole)) {
      return true;
    }
    return permissionFilter === 'disabled' ? 'disabled' : false;
  };

  /** 筛选有权限的数据 */
  const data = computed(() => {
    const temp = [];
    if (!props.items) {
      return temp;
    }
    props.items.forEach((item) => {
      const itemStatus = isPermission(
        item,
        item.permissionFilter ?? props.permissionFilter
      );
      if (!itemStatus) {
        return;
      }
      const disabled = itemStatus === 'disabled' || item.disabled;
      if (!item.dropdownItems?.length) {
        temp.push({ ...item, disabled });
        return;
      }
      const dItems = mapTree(
        item.dropdownItems,
        (d) => {
          const dStatus = isPermission(
            d,
            d.permissionFilter ?? props.permissionFilter
          );
          if (dStatus) {
            return {
              ...d,
              disabled: dStatus === 'disabled' || d.disabled,
              permission: void 0,
              anyPermission: void 0,
              role: void 0,
              anyRole: void 0,
              permissionFilter: void 0,
              vIf: void 0
            };
          }
        },
        'children',
        'children',
        (d) => {
          if (d.children == null || d.children?.length) {
            return d;
          }
        }
      );
      if (dItems.length) {
        temp.push({ ...item, disabled, dropdownItems: dItems });
      }
    });
    return temp;
  });
</script>
