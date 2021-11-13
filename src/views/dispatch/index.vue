<template>
  <div class="app-container">

    <el-row :gutter="32">
      <el-col :xs="12">
        <Batches></Batches>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import Batches from '@/views/dispatch/components/Batches'

export default {
  name: 'Dispatch',
  components: { Batches }
}
</script>

<style scoped>

</style>
