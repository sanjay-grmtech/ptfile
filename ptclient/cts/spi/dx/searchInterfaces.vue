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
        value: 'add diagnosis',
        ctAbbr: 'adddx',
        ctToShowInCL: 'spi/dx/cl/ctAddDx.vue',
        layer: 'change',
      },
    })
    ormSearchPhraseUiToCT.insert({
      data: {
        value: 'diagnosis',
        ctAbbr: 'dx',
        ctToShowInCL: 'spi/dx/dx-vl.vue',
        layer: 'view',
      },
    })
    ormSearchPhraseUiToCT.insert({
      data: {
        value: 'multichange dx assessment',
        ctAbbr: 'mcdxa',
        ctToShowInCL: 'spi/dx/cl/ctMultiChangeDxa.vue',
        layer: 'change',
      },
    })
  },
}
</script>
