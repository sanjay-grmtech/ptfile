// simiolar to person.js in example

import { Model } from '@vuex-orm/core'

class rowStatus extends Model {
  // For Class syntax https://javascript.info/class
  static entity = 'rowstatus'

  static arOrmRowsCached = []
  static vOrmSaveScheduled = ''

  static fields() {
    return {
      // the following fields only exist on client
      rowStateInThisSession: this.number(1), // Details read: /ptclient/docs/forms.md
      validationClass: this.string(''),
      isValidationError: this.boolean(false),
    }
  }

  static getValidUniqueUuidRows() {
    // Following query makes sure I get valid data and not discontimued data fromm temporal table. Ref: https://mariadb.com/kb/en/temporal-data-tables/
    const arFromORM = this.query().where('ROW_END', 2147483647.999999).get()

    const uniqueUuidRows = []

    // Goal: From the set of valid data, find unique UUIDs since it is possible that some UUID is being changed and now there are 2 records with same UUID
    let breakCheck1 = false
    for (let i = 0; i < arFromORM.length; i++) {
      for (let j = 0; j < uniqueUuidRows.length; j++) {
        if (arFromORM[i].uuid === uniqueUuidRows[j].uuid) {
          /* Suppose a row is being changed. Now 2 rows have the same uuid. The old row and the new changed row.
          In the array that is returned from this Fn I am returning the array with the new data.       
          Hence in the following line I over write the old row
          */
          uniqueUuidRows[j] = arFromORM[i]
          breakCheck1 = true
          break
        }
      }
      if (breakCheck1) break
      uniqueUuidRows.push(arFromORM[i])
    }

    return uniqueUuidRows
  }

  static getEditStateRows() {
    const arFromORM = this.query()
      .where('rowStateInThisSession', 2) // New
      .orWhere('rowStateInThisSession', 24) // New -> Changed
      .orWhere('rowStateInThisSession', 2456) // New -> Changed -> Requested save -> form error
      .get()
    return arFromORM
  }

  static getApiSuccessStateRows() {
    // New -> Changed -> Requested save -> Sent to server -> Success
    const arFromORM = this.query().where('rowStateInThisSession', 24571).get()
    return arFromORM
  }

  static getApiErrorStateRows() {
    // C3/3
    // New -> Changed -> Requested save -> Sent to server -> Failure
    const arFromORM = this.query().where('rowStateInThisSession', 24578).get()
    return arFromORM
  }

  static getApiSendingStateRows() {
    // New -> Changed -> Requested save -> Sending to server
    const arFromORM = this.query().where('rowStateInThisSession', 2457).get()
    return arFromORM
  }

  static deleteEditStateRows() {
    const arFromORM = this.getEditStateRows()
    if (arFromORM.length) {
      console.log('unsaved data found', arFromORM)
      for (let i = 0; i < arFromORM.length; i++) {
        this.delete(arFromORM[i].$id)
      }
    }
  }

  static getField(pOrmRowId, pFieldName) {
    // first time it will have to find in model. This is needed to show the initial content in the field.
    if (typeof this.arOrmRowsCached[pOrmRowId] === 'undefined') {
      console.log('finding in model')
      const arFromORM = this.find(pOrmRowId)
      if (arFromORM) {
        return arFromORM[pFieldName]
      }
    } else {
      // if caching is removed then typing will update every 1 second when the vuex store gets updated.
      console.log('returning from cache')
      return this.arOrmRowsCached[pOrmRowId][pFieldName]
    }
  }

  static setField(pEvent, pOrmRowId, pFieldName) {
    this.putFieldValueInCache(pEvent, pOrmRowId, pFieldName)
    this.createTimeoutToSave(pEvent, pOrmRowId, pFieldName)
  }

  /*  
    Why? 
    Put the value of what the user is typing in cache so that the user can see form field has the charecters that he has typed.
  
    How? 
    Step 1: This is called in the form on each key press (@input is invoked on each key press)
            Ref: The chain is started at cts/spi/rem/cl/add.vue:16 
            The sequence is: add.vue:16:mfSetFieldInOrmOnTimeout 
                              => add.vue:116:ormRem.setField 
                                => rowStatus.js:118:this.putFieldValueInCache

    Step : The work done by this function is used on each key press at:
                            add.vue:15:value="mfGetField"
                              => add.vue:113:ormRem.getField
                                => rowStatus.js:97

  */
  static putFieldValueInCache(pEvent, pOrmRowId, pFieldName) {
    // Ref: https://stackoverflow.com/questions/45644781/update-value-in-multidimensional-array-in-vue

    let newRow = []
    if (typeof this.arOrmRowsCached[pOrmRowId] === 'undefined') {
      this.arOrmRowsCached[pOrmRowId] = [] // setting this to a blank row since later I do splice. For splice that row needs to exist.
      console.log('Creating a new blank row')
    } else {
      /* 
          From arOrmRowsCached 
      */
      newRow = this.arOrmRowsCached.slice(pOrmRowId, pOrmRowId + 1) // Existing row may have 5 fields so I need to pull it out before updating 1 field
      console.log('Existing row pulled out is', newRow)
    }
    newRow[pFieldName] = pEvent // Upadted the field value in the new row

    /*  
        Ref: https://vuejs.org/2016/02/06/common-gotchas/#Why-isn%E2%80%99t-the-DOM-updating
     */
    this.arOrmRowsCached.splice(pOrmRowId, 1, newRow) // Put the single row back inside the array of a lot of rows.
    console.log(this.arOrmRowsCached)

    /*
      Option 2:
      this.arOrmRowsCached[pOrmRowId] = newRow // vue does not react. Now add.vue:115:setFieldInOrmOnTimeOut needs this.$forceUpdate
      forceUpdates are not good quality code. This needs fixing TODO
      */

    /* 
      Option 3: Will not work with $set is not available outside vue code
      this.$set(this.arOrmRowsCached, pOrmRowId, newRow)
      */
  }

  static createTimeoutToSave(pEvent, pOrmRowId, pFieldName) {
    // Goal 2/2: debouncing. If A and B are pressed quickly. Timeout for "A" keypress will get cancelled and timeout for "B" keypress will get scheduled.
    if (this.vOrmSaveScheduled) {
      clearTimeout(this.vOrmSaveScheduled)
    }
    /* Ref: https://stackoverflow.com/questions/38399050/vue-equivalent-of-settimeout */
    this.vOrmSaveScheduled = setTimeout(
      function (scope) {
        scope.setFieldInVuex(pEvent, pOrmRowId, pFieldName)
      },
      1000,
      this
    )
  }

  static setFieldInVuex(pEvent, pOrmRowId, pFieldName) {
    const row = {
      [pFieldName]: pEvent,
      rowStateInThisSession: 24,
      validationClass: '',
      isValidationError: false,
    }
    const arFromORM = this.update({
      where: pOrmRowId,
      data: row,
    })
    if (!arFromORM) {
      console.log('FATAL ERROR')
    }
  }

  static async sendToServer() {
    // API will return 1 (Success) or 0 (Failure)
    const arFromORM = this.query().where('rowStateInThisSession', 2457).get()

    console.log(arFromORM)

    for (let i = 0; i < arFromORM.length; i++) {
      const status = await this.fnMakeApiCAll(arFromORM[i])
      if (status === 0) {
        // Handle api returned success
        this.update({
          where: (record) => record.id === arFromORM[i].id,
          data: {
            rowStateInThisSession: '24578', // New -> Changed -> Requested save -> Send to server -> API fail
          },
        })
      } else {
        // Handle api returned failure
        this.update({
          where: (record) => record.id === arFromORM[i].id,
          data: {
            rowStateInThisSession: '24571', // New -> Changed -> Requested save -> Send to server -> API Success
          },
        })
      }
    }
  }

  static async fnMakeApiCAll(pORMRowArray) {
    pORMRowArray.uuidOfRemMadeFor = 'bfe041fa-073b-4223-8c69-0540ee678ff8'
    pORMRowArray.recordChangedByUUID = 'bua674fa-073b-4223-8c69-0540ee786kj8'
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          // Authorization: 'Bearer ' + TOKEN,
        },
        body: JSON.stringify({
          data: pORMRowArray,
        }),
      })
      if (!response.ok) {
        return 0 // Returns error code when api fails to update record in DB
      } else {
        return 1 // Returns success code when api successfully updates record in DB
      }
    } catch (ex) {
      return 0 // Returns error code when try block gets an exception and fails
    }
  }

  static async sendDiscontinueDataToServer(pORMDataRowID, remUUID, descontinuedNotes) {
    try {
      const response = await fetch(`${this.apiUrl}/${remUUID}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          // "Authorization": "Bearer " + TOKEN
        },
        body: JSON.stringify({
          dNotes: descontinuedNotes,
          patientId: 'bfe041fa-073b-4223-8c69-0540ee678ff8',
        }),
      })
      if (!response.ok) {
        return 0
      } else {
        this.update({
          where: pORMDataRowID,
          data: {
            ROW_END: Math.floor(Date.now() / 1000),
          },
        })
        return 1
      }
    } catch (ex) {
      return 0
    }
  }
}

export default rowStatus
