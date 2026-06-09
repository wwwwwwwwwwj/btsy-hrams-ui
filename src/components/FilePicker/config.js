import { toTree } from 'ele-admin-plus';
import { uploadOss } from '@/api/system/oss';
import {
  listUserFiles,
  addUserFile,
  removeUserFile,
  updateUserFile,
  pageUserFiles
} from '@/api/system/user-file';

/**
 * 查询分组接口
 */
export const listGroupApi = async function (params) {
  const data = await listUserFiles(params);
  const result = toTree({
    data,
    idField: 'id',
    parentIdField: 'parentId'
  });
  return result;
};

/**
 * 添加分组接口
 */
export const addGroupApi = addUserFile;

/**
 * 删除分组接口
 */
export const deleteGroupApi = removeUserFile;

/**
 * 重命名分组接口
 */
export const renameGroupApi = updateUserFile;

/**
 * 查询文件接口
 */
export const listFileApi = pageUserFiles;

/**
 * 删除文件接口
 */
export const deleteFileApi = removeUserFile;

/**
 * 重命名文件接口
 */
export const renameFileApi = updateUserFile;

/**
 * 移动文件接口
 */
export const moveFileApi = updateUserFile;

/**
 * 上传文件接口
 * @param file 文件
 * @param parentId 分组id
 */
export const uploadFileApi = async function (file, parentId) {
  const data = await uploadOss(file);
  const msg = await addUserFile({
    name: data.fileName,
    isDirectory: 0,
    parentId,
    path: data.url,
    length: void 0,
    contentType: ''
  });
  return msg;
};
