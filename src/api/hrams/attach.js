import {
  attachModeToBatchType,
  scanZipMaterialBatch,
  getMaterialBatch,
  listMaterialBatchItems,
  excludeMaterialBatchPaths,
  rescanMaterialBatch,
  confirmMaterialBatch
} from '@/api/hrams/material-batch';

const DIR_MARKER = '.hrams-dir-marker';

function isDirMarkerItem(item) {
  if (item.originalFileName === DIR_MARKER || item.normalizedFileName === DIR_MARKER) {
    return true;
  }
  const rp = (item.relativePath || '').replace(/\\/g, '/');
  return rp === DIR_MARKER || rp.endsWith(`/${DIR_MARKER}`);
}

function mapPreviewItem(item) {
  return {
    index: item.rowIndex,
    personId: item.personId,
    archiveNo: item.archiveNo,
    personName: item.personName,
    personKey: item.personKey,
    relativePath: item.relativePath,
    fileName: item.originalFileName || item.normalizedFileName,
    originalFileName: item.originalFileName,
    categoryCode: item.categoryCode,
    status: item.status,
    statusText: item.statusText,
    message: item.message,
    personAttachable: item.personAttachable
  };
}

export async function uploadAttachZip({ mode, personIds, zip }) {
  const batchType = attachModeToBatchType(mode);
  const ids = (personIds || []).map((id) => String(id));
  const data = await scanZipMaterialBatch(batchType, ids, zip);
  return { batchId: data.id, ...data, scanStatus: data.status };
}

export async function getAttachScanStatus(batchId) {
  const data = await getMaterialBatch(batchId);
  return {
    ...data,
    scanStatus: data.status,
    message: data.failMessage
  };
}

export async function getAttachScanPreview(batchId) {
  const items = await listMaterialBatchItems(batchId);
  return items.filter((i) => !isDirMarkerItem(i)).map(mapPreviewItem);
}

export async function excludeAttachPaths(batchId, relativePaths) {
  return excludeMaterialBatchPaths(batchId, relativePaths);
}

export async function rescanAttachBatch(batchId) {
  return rescanMaterialBatch(batchId);
}

export async function confirmAttachBatch({ batchId, confirmedPersonIds }) {
  return confirmMaterialBatch(batchId, confirmedPersonIds);
}
