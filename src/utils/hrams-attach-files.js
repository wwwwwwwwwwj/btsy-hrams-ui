import JSZip from 'jszip';

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

export function isZipFile(file) {
  const name = (file?.name || '').toLowerCase();
  return name.endsWith('.zip');
}
