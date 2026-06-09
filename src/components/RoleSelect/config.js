import { listRole as listRoles } from '@/api/system/role';

/**
 * 角色id字段名
 */
export const roleIdField = 'roleId';

/**
 * 角色名字段名
 */
export const roleNameField = 'roleName';

/**
 * 角色查询接口
 */
export const listRoleApi = async (params) => {
  let result = await listRoles(params);
  if (params.roleName) {
    result = result.filter((row) => row.roleName?.includes?.(params.roleName));
  }
  if (params.roleCode) {
    result = result.filter((row) => row.roleKey?.includes?.(params.roleCode));
  }
  return result;
};

/**
 * 角色表格列
 */
export const roleTableColumns = [
  {
    prop: 'roleName',
    label: 'labelRoleName',
    minWidth: 120
  },
  {
    prop: 'roleKey',
    label: 'labelRoleCode',
    minWidth: 120
  },
  {
    prop: 'status',
    label: 'labelStatus',
    minWidth: 90,
    slot: 'status'
  },
  {
    prop: 'createTime',
    label: 'labelCreateTime',
    width: 180,
    align: 'center'
  }
];

/**
 * 角色状态字典
 */
export const statusDictCode = 'sys_normal_disable';
