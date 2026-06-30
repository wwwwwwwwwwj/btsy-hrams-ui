<template>
  <ele-page hide-footer>
    <div class="hrams-v2-page utilize-page">
      <utilize-borrow-workspace ref="borrowRef" />
    </div>
  </ele-page>
</template>

<script setup>
  import { onActivated, ref } from 'vue';
  import UtilizeBorrowWorkspace from './components/utilize-borrow-workspace.vue';
  import '../styles/v2.scss';

  defineOptions({ name: 'HramsUtilize' });
  const borrowRef = ref(null);

  onActivated(() => {
    borrowRef.value?.reloadRecords?.();
  });
</script>
