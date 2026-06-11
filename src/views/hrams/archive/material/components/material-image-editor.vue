<template>
  <el-dialog v-model="visible" title="图像处理" width="820px" destroy-on-close @closed="onClosed">
    <div class="tool-bar">
      <el-button @click="rotate(-90)">左旋转90°</el-button>
      <el-button @click="rotate(90)">右旋转90°</el-button>
      <el-button @click="rotate(180)">旋转180°</el-button>
      <el-button @click="resetView">重置</el-button>
      <span class="hint">拖拽框选区域后确认，将裁去框外部分</span>
    </div>
    <div ref="stageRef" class="stage" @mousedown="onDown" @mousemove="onMove" @mouseup="onUp" @mouseleave="onUp">
      <canvas ref="canvasRef" />
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="confirm">确认并继续</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
  import { computed, nextTick, ref, watch } from 'vue';

  const props = defineProps({
    modelValue: Boolean,
    file: Object
  });
  const emit = defineEmits(['update:modelValue', 'done']);

  const visible = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v)
  });

  const canvasRef = ref(null);
  const stageRef = ref(null);
  const img = ref(null);
  const rotation = ref(0);
  const crop = ref(null);
  const dragging = ref(false);
  const dragStart = ref(null);
  const objectUrl = ref('');

  const isImageFile = (f) =>
    f && (/^image\//i.test(f.type) || /\.(jpe?g|png|bmp)$/i.test(f.name || ''));

  const loadFile = async (file) => {
    if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
    rotation.value = 0;
    crop.value = null;
    img.value = null;
    if (!file || !isImageFile(file)) return;
    objectUrl.value = URL.createObjectURL(file);
    const image = new Image();
    image.src = objectUrl.value;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
    img.value = image;
    await nextTick();
    draw();
  };

  watch(
    () => props.file,
    (f) => {
      if (visible.value && f) loadFile(f);
    }
  );

  watch(visible, (v) => {
    if (v && props.file) loadFile(props.file);
  });

  const draw = () => {
    const canvas = canvasRef.value;
    const image = img.value;
    if (!canvas || !image) return;
    const rot = ((rotation.value % 360) + 360) % 360;
    const swap = rot === 90 || rot === 270;
    const w = swap ? image.height : image.width;
    const h = swap ? image.width : image.height;
    const maxW = 760;
    const scale = Math.min(1, maxW / w);
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.drawImage(image, (-image.width * scale) / 2, (-image.height * scale) / 2, image.width * scale, image.height * scale);
    ctx.restore();
    if (crop.value) {
      const { x, y, w: cw, h: ch } = crop.value;
      ctx.strokeStyle = '#409eff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cw, ch);
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.fillRect(0, 0, canvas.width, y);
      ctx.fillRect(0, y, x, ch);
      ctx.fillRect(x + cw, y, canvas.width - x - cw, ch);
      ctx.fillRect(0, y + ch, canvas.width, canvas.height - y - ch);
    }
  };

  const rotate = (deg) => {
    rotation.value += deg;
    crop.value = null;
    draw();
  };

  const resetView = () => {
    rotation.value = 0;
    crop.value = null;
    draw();
  };

  const onDown = (e) => {
    if (!canvasRef.value) return;
    const rect = canvasRef.value.getBoundingClientRect();
    dragStart.value = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    dragging.value = true;
    crop.value = { x: dragStart.value.x, y: dragStart.value.y, w: 0, h: 0 };
  };

  const onMove = (e) => {
    if (!dragging.value || !dragStart.value || !canvasRef.value) return;
    const rect = canvasRef.value.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const x0 = Math.min(dragStart.value.x, x);
    const y0 = Math.min(dragStart.value.y, y);
    crop.value = {
      x: x0,
      y: y0,
      w: Math.abs(x - dragStart.value.x),
      h: Math.abs(y - dragStart.value.y)
    };
    draw();
  };

  const onUp = () => {
    dragging.value = false;
    if (crop.value && (crop.value.w < 8 || crop.value.h < 8)) {
      crop.value = null;
      draw();
    }
  };

  const exportBlob = () =>
    new Promise((resolve, reject) => {
      const image = img.value;
      if (!image) return reject(new Error('无图像'));
      const rot = ((rotation.value % 360) + 360) % 360;
      const swap = rot === 90 || rot === 270;
      const rw = swap ? image.height : image.width;
      const rh = swap ? image.width : image.height;
      const off = document.createElement('canvas');
      off.width = rw;
      off.height = rh;
      const ctx = off.getContext('2d');
      ctx.translate(rw / 2, rh / 2);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.drawImage(image, -image.width / 2, -image.height / 2);
      let out = off;
      if (crop.value && crop.value.w >= 8 && crop.value.h >= 8 && canvasRef.value) {
        const scaleX = rw / canvasRef.value.width;
        const scaleY = rh / canvasRef.value.height;
        const sx = Math.round(crop.value.x * scaleX);
        const sy = Math.round(crop.value.y * scaleY);
        const sw = Math.round(crop.value.w * scaleX);
        const sh = Math.round(crop.value.h * scaleY);
        const cropped = document.createElement('canvas');
        cropped.width = Math.max(1, sw);
        cropped.height = Math.max(1, sh);
        cropped.getContext('2d').drawImage(off, sx, sy, sw, sh, 0, 0, sw, sh);
        out = cropped;
      }
      const type = props.file?.type?.startsWith('image/') ? props.file.type : 'image/jpeg';
      out.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('导出失败'))), type, 0.92);
    });

  const confirm = async () => {
    const blob = await exportBlob();
    const name = props.file?.name || 'material.jpg';
    const file = new File([blob], name, { type: blob.type });
    emit('done', file);
    visible.value = false;
  };

  const onClosed = () => {
    if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = '';
    img.value = null;
    crop.value = null;
    rotation.value = 0;
  };
</script>

<style scoped>
  .tool-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px; }
  .hint { font-size: 12px; color: #888; margin-left: 8px; }
  .stage { max-height: 520px; overflow: auto; border: 1px solid #eee; background: #fafafa; cursor: crosshair; }
  canvas { display: block; margin: 0 auto; }
</style>
