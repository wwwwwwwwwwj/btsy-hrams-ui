import { toTree } from 'ele-admin-plus';
import { listDept } from '@/api/system/dept';

/**
 * 部门id字段名
 */
export const departmentIdField = 'deptId';

/**
 * 部门名字段名
 */
export const departmentNameField = 'deptName';

/**
 * 部门查询接口
 */
export const listDepartmentApi = async () => {
  const data = await listDept();
  return toTree({
    data,
    idField: departmentIdField,
    parentIdField: 'parentId'
  });
};
