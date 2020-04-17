import { snakeCase, map, pickBy } from 'lodash';

export default {
  computed: {
    field() {
      if (!this.form.field) {
        return {};
      }
      const option = this.fieldOptions[this.fieldOptionsIndexedByKey[this.form.field]];
      const fieldName = this.form.field.split('.').reverse().shift();
      const model = option.model || this.model;
      return model.getField(fieldName);
    }
  },
  methods: {
    getFieldOptions(customFilter = () => true, model = this.model) {
      return map(pickBy(model.fields(), field => field.filter !== false && field.type !== 'model' && customFilter(field)),
          (field, key) => ({value: field.label, key, stamp: snakeCase(key)})
      )
    }
  }
}
