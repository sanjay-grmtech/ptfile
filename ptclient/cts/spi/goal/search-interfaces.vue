<template>
  <div></div>
</template>

<script>
import ormSearchPhraseUiToCT from '@/cts/core/vl-search-box/vuex-orm/searchUIToCT'

export default {
  data() {
    return {
      // dataTable: [],
    }
  },
  mounted() {
    // Search interfaces to this component
    ormSearchPhraseUiToCT.insert({
      data: {
        value: 'add goal',
        ctAbbr: 'addg',
        ctToShowInCL: 'spi/goal/cl/ctAddGoal.vue',
        layer: 'change',
      },
    })

    ormSearchPhraseUiToCT.insert({
      data: {
        value: 'multi rate goal',
        ctAbbr: 'mcg',
        ctToShowInCL: 'spi/goal/cl/ctMultiRateGoal.vue',
        layer: 'change',
      },
    })

    ormSearchPhraseUiToCT.insert({
      data: {
        value: 'goal',
        ctAbbr: 'g',
        ctToShowInCL: 'spi/goal/g-vl.vue',
        layer: 'view',
      },
    })
  },
}
</script>
