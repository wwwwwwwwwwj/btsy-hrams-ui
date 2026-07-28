import JSZip from 'jszip';

/** 与后端 hrams.attach 默认上限对齐 */
export const ATTACH_ZIP_MAX_FILES = 5000;
export const ATTACH_ZIP_MAX_SIZE = 524_288_000; // 500MB

/**
 * 将 zip 解压为带 webkitRelativePath 的 File 列表（与文件夹选择一致）
 */
export async function unzipArchiveToFiles(zipFile) {
  const zip = await JSZip.loadAsync(zipFile);
  const out = [];
  const tasks = [];
  zip.forEach((relativePath, entry) => {
    if (entry.dir) {
      return;
    }
    const path = relativePath.replace(/\\/g, '/');
    if (path.includes('__MACOSX') || path.endsWith('.DS_Store')) {
      return;
    }
    tasks.push(
      entry.async('blob').then((blob) => {
        const name = path.split('/').pop() || 'file';
        const file = new File([blob], name, { type: blob.type || 'application/octet-stream' });
        Object.defineProperty(file, 'webkitRelativePath', { value: path, configurable: true });
        out.push(file);
      })
    );
  });
  await Promise.all(tasks);
  return out;
}

/**
 * 校验文件夹体积/数量，超限抛错
 */
export function assertAttachFolderLimits(files) {
  const list = files || [];
  if (!list.length) {
    throw new Error('所选文件夹没有可上传文件');
  }
  if (list.length > ATTACH_ZIP_MAX_FILES) {
    throw new Error(`文件数超过上限 ${ATTACH_ZIP_MAX_FILES}，请拆分后分批挂接或改用 ZIP`);
  }
  const total = list.reduce((sum, f) => sum + (Number(f.size) || 0), 0);
  if (total > ATTACH_ZIP_MAX_SIZE) {
    const mb = Math.round(ATTACH_ZIP_MAX_SIZE / 1024 / 1024);
    throw new Error(`文件夹总体积超过 ${mb}MB，请拆分后分批挂接或改用 ZIP`);
  }
  return total;
}

/**
 * 将文件夹文件打包为 ZIP（保留相对路径），供异步 scan/zip 使用
 */
export async function zipFolderFiles(files, relativePaths, zipName = 'attach-folder.zip') {
  assertAttachFolderLimits(files);
  const zip = new JSZip();
  (files || []).forEach((file, index) => {
    const rel = (relativePaths?.[index] || file.webkitRelativePath || file.name || `file-${index}`)
      .replace(/\\/g, '/');
    if (!rel || rel.endsWith('/')) {
      return;
    }
    if (rel.includes('__MACOSX') || rel.endsWith('.DS_Store')) {
      return;
    }
    zip.file(rel, file, { binary: true });
  });
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 1 }
  });
  if (blob.size > ATTACH_ZIP_MAX_SIZE) {
    const mb = Math.round(ATTACH_ZIP_MAX_SIZE / 1024 / 1024);
    throw new Error(`打包后 ZIP 超过 ${mb}MB，请拆分后分批挂接`);
  }
  return new File([blob], zipName, { type: 'application/zip' });
}

export function isZipFile(file) {
  const name = (file?.name || '').toLowerCase();
  return name.endsWith('.zip');
}
