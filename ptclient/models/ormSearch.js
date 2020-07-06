import { Model } from '@vuex-orm/core'

export default class ormSearch extends Model {
  static entity = 'ormSearch'

  static fields() {
    return {
      id: this.uid(), // vuex-orm generates a unique ID https://vuex-orm.org/guide/model/defining-models.html#uid-type
      value: this.string(''), // this is the tab name that is shown to the user. I call it value since autocomplete function expects the object property to be called value
      ctAbbr: this.string(''),
      ctToShowInsideTab: this.string(''),
      layer: this.string(''),
    }
  }
}